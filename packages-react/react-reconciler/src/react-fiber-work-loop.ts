import { unstable_now as now } from "@zenflux/react-scheduler";
import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import {
    DefaultEventPriority,
    DiscreteEventPriority,
    getCurrentUpdatePriority,
    setCurrentUpdatePriority
} from "@zenflux/react-reconciler/src/react-event-priorities";
import { markRootUpdated } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";
import {
    activateBatchedExecutionContext,
    getExecutionContext,
    isExecutionContextEmpty,
    isExecutionContextRenderOrCommitActivate,
    isExecutionContextRenderOrCommitDeactivate,
    setExecutionContext
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import {
    getWorkInProgressRootRenderTargetTime,
    resetWorkInProgressRootRenderTimer,
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";

import { ReactFiberWorkOnRootShared } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-shared";
import { upgradePendingLanesToSync } from "@zenflux/react-reconciler/src/react-fiber-lane";

import type { FiberRoot, Lane, Lanes } from "@zenflux/react-shared/src/react-internal-types";

const {
    ReactCurrentBatchConfig,
    ReactCurrentActQueue
} = ReactSharedInternals;

export function getRenderTargetTime(): number {
    return getWorkInProgressRootRenderTargetTime();
}

export function getCurrentTime(): number {
    return now();
}

export function scheduleInitialHydrationOnRoot( root: FiberRoot, lane: Lane ) {
    // This is a special fork of scheduleUpdateOnFiber that is only used to
    // schedule the initial hydration of a root that has just been created. Most
    // of the stuff in scheduleUpdateOnFiber can be skipped.
    //
    // The main reason for this separate path, though, is to distinguish the
    // initial children from subsequent updates. In fully client-rendered roots
    // (createRoot instead of hydrateRoot), all top-level renders are modeled as
    // updates, but hydration roots are special because the initial render must
    // match what was rendered on the server.
    const current = root.current;
    current.lanes = lane;
    markRootUpdated( root, lane );
    ReactFiberRootSchedulerShared.ensureRootScheduled( root );
}

export function flushRoot( root: FiberRoot, lanes: Lanes ) {
    if ( lanes !== NoLanes ) {
        upgradePendingLanesToSync( root, lanes );
        ReactFiberRootSchedulerShared.ensureRootScheduled( root );

        if ( isExecutionContextRenderOrCommitActivate() ) {
            resetWorkInProgressRootRenderTimer();
            // TODO: For historical reasons this flushes all sync work across all
            // roots. It shouldn't really matter either way, but we could change this
            // to only flush the given root.
            ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
        }
    }
}

export function deferredUpdates<A>( fn: () => A ): A {
    const previousPriority = getCurrentUpdatePriority();
    const prevTransition = ReactCurrentBatchConfig.transition;

    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority( DefaultEventPriority );
        return fn();
    } finally {
        setCurrentUpdatePriority( previousPriority );
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function batchedUpdates<A, R>( fn: Function, a: A, c?: unknown ): R {
    const prevExecutionContext = getExecutionContext();

    activateBatchedExecutionContext();

    try {
        return fn( a );
    } finally {
        setExecutionContext( prevExecutionContext );

        // If there were legacy sync updates, flush them at the end of the outer
        // most batchedUpdates-like method.
        if ( isExecutionContextEmpty() && // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
            ! ( __DEV__ && ReactCurrentActQueue.isBatchingLegacy ) ) {
            resetWorkInProgressRootRenderTimer();
            ReactFiberWorkOnRootShared.flushSyncWorkOnLegacyRootsOnly();
        }
    }
}

export function discreteUpdates<A, B, C, D, R>( fn: ( arg0: A, arg1: B, arg2: C, arg3: D ) => R, a: A, b: B, c: C, d: D ): R {
    const previousPriority = getCurrentUpdatePriority();
    const prevTransition = ReactCurrentBatchConfig.transition;

    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority( DiscreteEventPriority );
        return fn( a, b, c, d );
    } finally {
        setCurrentUpdatePriority( previousPriority );
        ReactCurrentBatchConfig.transition = prevTransition;

        if ( isExecutionContextEmpty() ) {
            resetWorkInProgressRootRenderTimer();
        }
    }
}

export function isAlreadyRendering(): boolean {
    // Used by the renderer to print a warning if certain APIs are called from
    // the wrong context.
    return __DEV__ && isExecutionContextRenderOrCommitDeactivate();
}
