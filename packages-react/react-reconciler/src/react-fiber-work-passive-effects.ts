import {
    enableDebugTracing, enableProfilerCommitHooks,
    enableProfilerTimer,
    enableSchedulingProfiler, enableTransitionTracing
} from "@zenflux/react-shared/src/react-feature-flags";

import {
    unstable_IdlePriority as IdleSchedulerPriority,
    unstable_NormalPriority as NormalSchedulerPriority
} from "@zenflux/react-scheduler";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { ReactFiberWorkOnRootShared } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-shared";
import { ReactFiberWorkDoubleInvokeSharedDev } from "@zenflux/react-reconciler/src/react-fiber-work-double-invoke-shared-dev";

import {
    activateExecutionCommitContext,
    getExecutionContext,
    isExecutionContextRenderOrCommitDeactivate, setExecutionContext
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import { logPassiveEffectsStarted, logPassiveEffectsStopped } from "@zenflux/react-reconciler/src/react-debug-tracing";
import {
    markPassiveEffectsStarted,
    markPassiveEffectsStopped,
    onPostCommitRoot as onPostCommitRootDevTools
} from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import { processTransitionCallbacks } from "@zenflux/react-reconciler/src/react-fiber-tracing-marker-component";
import {
    incrementNestedPassiveUpdateCount,
    isNestedRootWithPassiveUpdate,
    resetNestedPassiveUpdateCount, setNestedRootWithPassiveUpdate
} from "@zenflux/react-reconciler/src/react-fiber-work-nested-count";
import {
    DefaultEventPriority,
    getCurrentUpdatePriority,
    lanesToEventPriority,
    lowerEventPriority, setCurrentUpdatePriority
} from "@zenflux/react-reconciler/src/react-event-priorities";
import { fiberWorkScheduleCallback } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-callback";

import {
    getCurrentPendingTransitionCallbacks,
    setCurrentPendingTransitionCallbacks
} from "@zenflux/react-reconciler/src/react-fiber-work-current-transaction";
import { reactReleaseRootPooledCache } from "@zenflux/react-reconciler/src/react-release-root-pooled-cache";

import {
    commitPassiveEffectDurations,
    commitPassiveMountEffects,
    commitPassiveUnmountEffects
} from "@zenflux/react-reconciler/src/react-fiber-work-commit-passive";

import type { FiberRoot, Fiber, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { Transition } from "@zenflux/react-shared/src/react-internal-types/transition";

const {
    ReactCurrentBatchConfig,
} = ReactSharedInternals;

let rootDoesHavePassiveEffects: boolean = false;
let rootWithPendingPassiveEffects: FiberRoot | null = null;

let pendingPassiveEffectsLanes: Lanes = NoLanes;
let pendingPassiveProfilerEffects: Array<Fiber> = [];
let pendingPassiveEffectsRemainingLanes: Lanes = NoLanes;
let pendingPassiveTransitions: Array<Transition> | null = null;

let isFlushingPassiveEffects = false;
let didScheduleUpdateDuringPassiveEffects = false;

let currentEndTime: number | null = null;

function flushPassiveEffectsImpl() {
    if ( rootWithPendingPassiveEffects === null ) {
        return false;
    }

    // Cache and clear the transitions flag
    const transitions = pendingPassiveTransitions;
    pendingPassiveTransitions = null;
    const root = rootWithPendingPassiveEffects;
    const lanes = pendingPassiveEffectsLanes;
    clearRootWithPendingPassiveEffects();
    // TODO: This is sometimes out of sync with rootWithPendingPassiveEffects.
    // Figure out why and fix it. It's not causing any known issues (probably
    // because it's only used for profiling), but it's a refactor hazard.
    pendingPassiveEffectsLanes = NoLanes;

    if ( isExecutionContextRenderOrCommitDeactivate() ) {
        throw new Error( "Cannot flush passive effects while already rendering." );
    }

    if ( __DEV__ ) {
        isFlushingPassiveEffects = true;
        didScheduleUpdateDuringPassiveEffects = false;

        if ( enableDebugTracing ) {
            logPassiveEffectsStarted( lanes );
        }
    }

    if ( enableSchedulingProfiler ) {
        markPassiveEffectsStarted( lanes );
    }

    const prevExecutionContext = getExecutionContext();
    activateExecutionCommitContext();

    commitPassiveUnmountEffects( root.current );
    commitPassiveMountEffects( root, root.current, lanes, transitions );

    // TODO: Move to commitPassiveMountEffects
    if ( enableProfilerTimer && enableProfilerCommitHooks ) {
        const profilerEffects = pendingPassiveProfilerEffects;
        pendingPassiveProfilerEffects = [];

        for ( let i = 0 ; i < profilerEffects.length ; i++ ) {
            const fiber = ( ( profilerEffects[ i ] as any ) as Fiber );
            commitPassiveEffectDurations( root, fiber );
        }
    }

    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            logPassiveEffectsStopped();
        }
    }

    if ( enableSchedulingProfiler ) {
        markPassiveEffectsStopped();
    }

    if ( __DEV__ ) {
        ReactFiberWorkDoubleInvokeSharedDev.commitDoubleInvokeEffectsInDEV( root, true );
    }

    setExecutionContext( prevExecutionContext );
    ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();

    if ( enableTransitionTracing ) {
        const prevPendingTransitionCallbacks = getCurrentPendingTransitionCallbacks();
        const prevRootTransitionCallbacks = root.transitionCallbacks;
        const prevEndTime = currentEndTime;

        if ( prevPendingTransitionCallbacks !== null && prevRootTransitionCallbacks !== null && prevEndTime !== null ) {
            setCurrentPendingTransitionCallbacks( null );
            currentEndTime = null;
            fiberWorkScheduleCallback( IdleSchedulerPriority, () => {
                processTransitionCallbacks( prevPendingTransitionCallbacks, prevEndTime, prevRootTransitionCallbacks );
            } );
        }
    }

    if ( __DEV__ ) {
        // If additional passive effects were scheduled, increment a counter. If this
        // exceeds the limit, we'll fire a warning.
        if ( didScheduleUpdateDuringPassiveEffects ) {
            // if ( root === rootWithPassiveNestedUpdates ) {
            if ( isNestedRootWithPassiveUpdate( root ) ) {
                // nestedPassiveUpdateCount++;
                incrementNestedPassiveUpdateCount();
            } else {
                // nestedPassiveUpdateCount = 0;
                resetNestedPassiveUpdateCount();
                // rootWithPassiveNestedUpdates = root;
                setNestedRootWithPassiveUpdate( root );
            }
        } else {
            // nestedPassiveUpdateCount = 0;
            resetNestedPassiveUpdateCount();
        }

        isFlushingPassiveEffects = false;
        didScheduleUpdateDuringPassiveEffects = false;
    }

    // TODO: Move to commitPassiveMountEffects
    onPostCommitRootDevTools( root );

    if ( enableProfilerTimer && enableProfilerCommitHooks ) {
        const stateNode = root.current.stateNode;
        stateNode.effectDuration = 0;
        stateNode.passiveEffectDuration = 0;
    }

    return true;
}

export function flushPassiveEffects(): boolean {
    // Returns whether passive effects were flushed.
    // TODO: Combine this check with the one in flushPassiveEffectsImpl. We should
    // probably just combine the two functions. I believe they were only separate
    // in the first place because we used to wrap it with
    // `Scheduler.runWithPriority`, which accepts a function. But now we track the
    // priority within React itself, so we can mutate the variable directly.
    if ( rootWithPendingPassiveEffects !== null ) {
        // Cache the root since rootWithPendingPassiveEffects is cleared in
        // flushPassiveEffectsImpl
        const root = rootWithPendingPassiveEffects;
        // Cache and clear the remaining lanes flag; it must be reset since this
        // method can be called from various places, not always from commitRoot
        // where the remaining lanes are known
        const remainingLanes = pendingPassiveEffectsRemainingLanes;
        pendingPassiveEffectsRemainingLanes = NoLanes;
        const renderPriority = lanesToEventPriority( pendingPassiveEffectsLanes );
        const priority = lowerEventPriority( DefaultEventPriority, renderPriority );
        const prevTransition = ReactCurrentBatchConfig.transition;
        const previousPriority = getCurrentUpdatePriority();

        try {
            ReactCurrentBatchConfig.transition = null;
            setCurrentUpdatePriority( priority );
            return flushPassiveEffectsImpl();
        } finally {
            setCurrentUpdatePriority( previousPriority );
            ReactCurrentBatchConfig.transition = prevTransition;
            // Once passive effects have run for the tree - giving components a
            // chance to retain cache instances they use - release the pooled
            // cache at the root (if there is one)
            reactReleaseRootPooledCache( root, remainingLanes );
        }
    }

    return false;
}

export function enqueuePendingPassiveProfilerEffect( fiber: Fiber ): void {
    if ( enableProfilerTimer && enableProfilerCommitHooks ) {
        pendingPassiveProfilerEffects.push( fiber );

        if ( ! rootDoesHavePassiveEffects ) {
            setRootHavePassiveEffects();
            fiberWorkScheduleCallback( NormalSchedulerPriority, () => {
                flushPassiveEffects();
                return null;
            } );
        }
    }
}

export function setDidScheduleUpdateDuringPassiveEffects() {
    didScheduleUpdateDuringPassiveEffects = true;
}

export function hasRootWithPassiveEffects(): boolean {
    return rootDoesHavePassiveEffects;
}

export function setRootHavePassiveEffects() {
    rootDoesHavePassiveEffects = true;
}

export function clearRootHavePassiveEffects() {
    rootDoesHavePassiveEffects = false;
}

export function isFlushPassiveEffects(): boolean {
    return isFlushingPassiveEffects;
}

export function hasRootWithPendingPassiveEffects() {
    return rootWithPendingPassiveEffects !== null;
}

export function getRootWithPendingPassiveEffects() {
    return rootWithPendingPassiveEffects;
}

export function getRootWithPendingPassiveEffectsSafe(): FiberRoot {
    return rootWithPendingPassiveEffects as FiberRoot;
}

export function setRootWithPendingPassiveEffects( root: FiberRoot ) {
    rootWithPendingPassiveEffects = root;
}

export function clearRootWithPendingPassiveEffects() {
    rootWithPendingPassiveEffects = null;
}

export function setCurrentEndTime( endTime: number ) {
    currentEndTime = endTime;
}

export function getPendingPassiveEffectsLanes() {
    return pendingPassiveEffectsLanes;
}

export function setPendingPassiveEffectsLanes( lanes: Lanes ) {
    pendingPassiveEffectsLanes = lanes;
}

export function setPendingPassiveEffectsRemainingLanes( lanes: Lanes ) {
    pendingPassiveEffectsRemainingLanes = lanes;
}

export function setPendingPassiveTransitions( transitions: Array<Transition> | null ) {
    pendingPassiveTransitions = transitions;
}
