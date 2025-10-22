import {
    alwaysThrottleRetries,
    enableCreateEventHandleAPI,
    enableFloat,
    enableHostSingletons,
    enableProfilerCommitHooks,
    enableProfilerNestedUpdatePhase,
    enableProfilerTimer,
    enableSchedulingProfiler,
    enableScopeAPI,
    enableSuspenseCallback,
    enableUpdaterTracking,
    enableUseEffectEventHook
} from "@zenflux/react-shared/src/react-feature-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { OffscreenDetached, OffscreenVisible } from "@zenflux/react-shared/src/react-internal-constants/offscreen";

import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";

import { NoLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import {
    getCurrentHoistableRoot,
    getCurrentHoistableRootSafe,
    setCurrentHoistableRoot
} from "@zenflux/react-reconciler/src/react-fiber-commit-current-hoistable-root";
import {
    commitHookEffectListMount,
    commitHookEffectListUnmount
} from "@zenflux/react-reconciler/src/react-fiber-commit-hook-effect";
import {
    getNextEffectSafe,
    hasNextEffect,
    setNextEffect
} from "@zenflux/react-reconciler/src/react-fiber-commit-next-effect";
import {
    captureCommitPhaseError,
    safelyCallDestroy
} from "@zenflux/react-reconciler/src/react-fiber-commit-phase-error";

import { hasExecutionCommitContext } from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import { markGlobalMostRecentFallbackTime } from "@zenflux/react-reconciler/src/react-fiber-work-most-recent-fallback-time";
import { enqueuePendingPassiveProfilerEffect } from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";
import { retryTimedOutBoundary } from "@zenflux/react-reconciler/src/react-fiber-work-retry-boundary";
import { didWarnAboutReassigningProps } from "@zenflux/react-reconciler/src/react-fiber-work-warn-about-reassigning-props";
import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";
import {
    getCurrentFiber as getCurrentDebugFiberInDEV,
    resetCurrentFiber as resetCurrentDebugFiberInDEV,
    setCurrentFiber as setCurrentDebugFiberInDEV
} from "@zenflux/react-reconciler/src/react-current-fiber";

import { isOffscreenManual, } from "@zenflux/react-reconciler/src/react-fiber-activity-component";

import {
    commitCallbacks,
    commitHiddenCallbacks,
    deferHiddenCallbacks
} from "@zenflux/react-reconciler/src/react-fiber-class-update-queue";

import {
    commitAttachRef,
    commitPlacement,
    isSuspenseBoundaryBeingHidden,
    restorePendingUpdaters,
    shouldProfile
} from "@zenflux/react-reconciler/src/react-fiber-commit-work";
import {
    isDevToolsPresent,
    markComponentLayoutEffectUnmountStarted,
    markComponentLayoutEffectUnmountStopped,
    onCommitUnmount
} from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import { resolveDefaultProps } from "@zenflux/react-reconciler/src/react-fiber-lazy-component";

import { doesFiberContain } from "@zenflux/react-reconciler/src/react-fiber-tree-reflection";

import {
    getCommitTime,
    isCurrentUpdateNested,
    recordLayoutEffectDuration,
    startLayoutEffectTimer
} from "@zenflux/react-reconciler/src/react-profile-timer";

import type {
    ChildSet,
    Container,
    HoistableRoot,
    Instance,
    TextInstance,
    UpdatePayload
} from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

import type { RootState } from "@zenflux/react-reconciler/src/react-fiber-root";
import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { Fiber, FiberRoot, Lanes, FiberUpdateQueue } from "@zenflux/react-shared/src/react-internal-types";
import type { Wakeable } from "@zenflux/react-shared/src/react-types";
import type {
    OffscreenInstance,
    OffscreenProps,
    OffscreenQueue,
    OffscreenState
} from "@zenflux/react-shared/src/react-internal-types/offscreen";

import type { FunctionComponentUpdateQueue, RetryQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";

const {
    acquireResource,
    acquireSingletonInstance,
    beforeActiveInstanceBlur,
    clearContainer,
    clearSingleton,
    clearSuspenseBoundary,
    clearSuspenseBoundaryFromContainer,
    commitHydratedContainer,
    commitHydratedSuspenseInstance,
    commitMount,
    commitTextUpdate,
    commitUpdate,
    createContainerChildSet,
    getHoistableRoot,
    getPublicInstance,
    hideInstance,
    hideTextInstance,
    hydrateHoistable,
    mountHoistable,
    prepareForCommit,
    prepareScopeUpdate,
    prepareToCommitHoistables,
    releaseResource,
    releaseSingletonInstance,
    removeChild,
    removeChildFromContainer,
    replaceContainerChildren,
    resetTextContent,
    supportsHydration,
    supportsMutation,
    supportsPersistence,
    supportsResources,
    supportsSingletons,
    unhideInstance,
    unhideTextInstance,
    unmountHoistable
} = globalThis.__RECONCILER__CONFIG__;

const PossiblyWeakSet: WeakSetConstructor = typeof WeakSet === "function" ? WeakSet : Set;

// Used for Profiling builds to track updaters.
let inProgressLanes: Lanes | null = null;
let inProgressRoot: FiberRoot | null = null;

let focusedInstanceHandle: null | Fiber = null;
let shouldFireAfterActiveInstanceBlur: boolean = false;

// Used during the commit phase to track the state of the Offscreen component stack.
// Allows us to avoid traversing the return path to find the nearest Offscreen ancestor.
let offscreenSubtreeIsHidden: boolean = false;
let offscreenSubtreeWasHidden: boolean = false;

// These are tracked on the stack as we recursively traverse a
// deleted subtree.
// TODO: Update these during the whole mutation phase, not just during
// a deletion.
let hostParent: Instance | Container | null = null;
let hostParentIsContainer: boolean = false;

let didWarnAboutUndefinedSnapshotBeforeUpdate: Set<unknown> | null = null;

if ( __DEV__ ) {
    didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
}

function markCommitTimeOfFallback() {
    markGlobalMostRecentFallbackTime();
}

export function invokeLayoutEffectMountInDEV( fiber: Fiber ): void {
    if ( __DEV__ ) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch ( fiber.tag ) {
            case WorkTag.FunctionComponent:
            case WorkTag.ForwardRef:
            case WorkTag.SimpleMemoComponent: {
                try {
                    commitHookEffectListMount( HookFlags.Layout | HookFlags.HasEffect, fiber );
                } catch ( error ) {
                    captureCommitPhaseError( fiber, fiber.return, error );
                }

                break;
            }

            case WorkTag.ClassComponent: {
                const instance = fiber.stateNode;

                if ( typeof instance.componentDidMount === "function" ) {
                    try {
                        instance.componentDidMount();
                    } catch ( error ) {
                        captureCommitPhaseError( fiber, fiber.return, error );
                    }
                }

                break;
            }
        }
    }
}

export function invokePassiveEffectMountInDEV( fiber: Fiber ): void {
    if ( __DEV__ ) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch ( fiber.tag ) {
            case WorkTag.FunctionComponent:
            case WorkTag.ForwardRef:
            case WorkTag.SimpleMemoComponent: {
                try {
                    commitHookEffectListMount( HookFlags.Passive | HookFlags.HasEffect, fiber );
                } catch ( error ) {
                    captureCommitPhaseError( fiber, fiber.return, error );
                }

                break;
            }
        }
    }
}

export function invokeLayoutEffectUnmountInDEV( fiber: Fiber ): void {
    if ( __DEV__ ) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch ( fiber.tag ) {
            case WorkTag.FunctionComponent:
            case WorkTag.ForwardRef:
            case WorkTag.SimpleMemoComponent: {
                try {
                    commitHookEffectListUnmount( HookFlags.Layout | HookFlags.HasEffect, fiber, fiber.return );
                } catch ( error ) {
                    captureCommitPhaseError( fiber, fiber.return, error );
                }

                break;
            }

            case WorkTag.ClassComponent: {
                const instance = fiber.stateNode;

                if ( typeof instance.componentWillUnmount === "function" ) {
                    safelyCallComponentWillUnmount( fiber, fiber.return, instance );
                }

                break;
            }
        }
    }
}

export function invokePassiveEffectUnmountInDEV( fiber: Fiber ): void {
    if ( __DEV__ ) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch ( fiber.tag ) {
            case WorkTag.FunctionComponent:
            case WorkTag.ForwardRef:
            case WorkTag.SimpleMemoComponent: {
                try {
                    commitHookEffectListUnmount( HookFlags.Passive | HookFlags.HasEffect, fiber, fiber.return );
                } catch ( error ) {
                    captureCommitPhaseError( fiber, fiber.return, error );
                }
            }
        }
    }
}

function commitClassCallbacks( finishedWork: Fiber ) {
    // TODO: I think this is now always non-null by the time it reaches the
    // commit phase. Consider removing the type check.
    const updateQueue: FiberUpdateQueue<unknown> | null = ( finishedWork.updateQueue as any );

    if ( updateQueue !== null ) {
        const instance = finishedWork.stateNode;

        if ( __DEV__ ) {
            if ( finishedWork.type === finishedWork.elementType && ! didWarnAboutReassigningProps ) {
                if ( instance.props !== finishedWork.memoizedProps ) {
                    console.error( "Expected %s props to match memoized props before " + "processing the update queue. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                }

                if ( instance.state !== finishedWork.memoizedState ) {
                    console.error( "Expected %s state to match memoized state before " + "processing the update queue. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                }
            }
        }

        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        try {
            commitCallbacks( updateQueue, instance );
        } catch ( error ) {
            captureCommitPhaseError( finishedWork, finishedWork.return, error );
        }
    }
}

function commitHostComponentMount( finishedWork: Fiber ) {
    const type = finishedWork.type;
    const props = finishedWork.memoizedProps;
    const instance: Instance = finishedWork.stateNode;

    try {
        commitMount( instance, type, props, finishedWork );
    } catch ( error ) {
        captureCommitPhaseError( finishedWork, finishedWork.return, error );
    }
}

function commitProfilerUpdate( finishedWork: Fiber, current: Fiber | null ) {
    if ( enableProfilerTimer && hasExecutionCommitContext() ) {
        try {
            const {
                onCommit,
                onRender
            } = finishedWork.memoizedProps;
            const {
                effectDuration
            } = finishedWork.stateNode;
            const commitTime = getCommitTime();
            let phase = current === null ? "mount" : "update";

            if ( enableProfilerNestedUpdatePhase ) {
                if ( isCurrentUpdateNested() ) {
                    phase = "nested-update";
                }
            }

            if ( typeof onRender === "function" ) {
                onRender( finishedWork.memoizedProps.id, phase, finishedWork.actualDuration, finishedWork.treeBaseDuration, finishedWork.actualStartTime, commitTime );
            }

            if ( enableProfilerCommitHooks ) {
                if ( typeof onCommit === "function" ) {
                    onCommit( finishedWork.memoizedProps.id, phase, effectDuration, commitTime );
                }

                // Schedule a passive effect for this Profiler to call onPostCommit hooks.
                // This effect should be scheduled even if there is no onPostCommit callback for this Profiler,
                // because the effect is also where times bubble to parent Profilers.
                enqueuePendingPassiveProfilerEffect( finishedWork );
                // Propagate layout effect durations to the next nearest Profiler ancestor.
                // Do not reset these values until the next render so DevTools has a chance to read them first.
                let parentFiber = finishedWork.return;

                outer: while ( parentFiber !== null ) {
                    switch ( parentFiber.tag ) {
                        case WorkTag.HostRoot:
                            const root = parentFiber.stateNode;
                            root.effectDuration += effectDuration;
                            break outer;

                        case WorkTag.Profiler:
                            const parentStateNode = parentFiber.stateNode;
                            parentStateNode.effectDuration += effectDuration;
                            break outer;
                    }

                    parentFiber = parentFiber.return;
                }
            }
        } catch ( error ) {
            captureCommitPhaseError( finishedWork, finishedWork.return, error );
        }
    }
}

function hideOrUnhideAllChildren( finishedWork: Fiber, isHidden: boolean ) {
    // Only hide or unhide the top-most host nodes.
    let hostSubtreeRoot: Fiber | null = null;

    if ( supportsMutation ) {
        // We only have the top Fiber that was inserted but we need to recurse down its
        // children to find all the terminal nodes.
        let node: Fiber = finishedWork;

        while ( true ) {
            if ( node.tag === WorkTag.HostComponent || ( enableFloat && supportsResources ? node.tag === WorkTag.HostHoistable : false )
                || ( enableHostSingletons && supportsSingletons ? node.tag === WorkTag.HostSingleton : false ) )
            {
                if ( hostSubtreeRoot === null ) {
                    hostSubtreeRoot = node;

                    try {
                        const instance = node.stateNode;

                        if ( isHidden ) {
                            hideInstance( instance );
                        } else {
                            unhideInstance( node.stateNode, node.memoizedProps );
                        }
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            } else if ( node.tag === WorkTag.HostText ) {
                if ( hostSubtreeRoot === null ) {
                    try {
                        const instance = node.stateNode;

                        if ( isHidden ) {
                            hideTextInstance( instance );
                        } else {
                            unhideTextInstance( instance, node.memoizedProps );
                        }
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            } else if ( ( node.tag === WorkTag.OffscreenComponent || node.tag === WorkTag.LegacyHiddenComponent ) &&
                ( node.memoizedState as OffscreenState ) !== null && node !== finishedWork )
            {// Found a nested Offscreen component that is hidden.
                // Don't search any deeper. This tree should remain hidden.
            } else if ( node.child !== null ) {
                node.child.return = node;
                node = node.child;
                continue;
            }

            if ( node === finishedWork ) {
                return;
            }

            while ( node.sibling === null ) {
                if ( node.return === null || node.return === finishedWork ) {
                    return;
                }

                if ( hostSubtreeRoot === node ) {
                    hostSubtreeRoot = null;
                }

                node = node.return;
            }

            if ( hostSubtreeRoot === node ) {
                hostSubtreeRoot = null;
            }

            node.sibling.return = node.return;
            node = node.sibling;
        }
    }
}

function detachFiberMutation( fiber: Fiber ) {
    // Cut off the return pointer to disconnect it from the tree.
    // This enables us to detect and warn against state updates on an unmounted component.
    // It also prevents events from bubbling from within disconnected components.
    //
    // Ideally, we should also clear the child pointer of the parent alternate to let this
    // get GC:ed but we don't know which for sure which parent is the current
    // one so we'll settle for GC:ing the subtree of this child.
    // This child itself will be GC:ed when the parent updates the next time.
    //
    // Note that we can't clear child or sibling pointers yet.
    // They're needed for passive effects and for findDOMNode.
    // We defer those fields, and all other cleanup, to the passive phase (see detachFiberAfterEffects).
    //
    // Don't reset the alternate yet, either. We need that so we can detach the
    // alternate's fields in the passive phase. Clearing the return pointer is
    // sufficient for findDOMNode semantics.
    const alternate = fiber.alternate;

    if ( alternate !== null ) {
        alternate.return = null;
    }

    fiber.return = null;
}

function emptyPortalContainer( current: Fiber ) {
    if ( ! supportsPersistence ) {
        return;
    }

    const portal: {
        containerInfo: Container;
        pendingChildren: ChildSet;
    } = current.stateNode;
    const {
        containerInfo
    } = portal;
    const emptyChildSet = createContainerChildSet();
    replaceContainerChildren( containerInfo, emptyChildSet );
}

function commitSuspenseCallback( finishedWork: Fiber ) {
    // TODO: Move this to passive phase
    const newState: SuspenseState | null = finishedWork.memoizedState;

    if ( enableSuspenseCallback && newState !== null ) {
        const suspenseCallback = finishedWork.memoizedProps.suspenseCallback;

        if ( typeof suspenseCallback === "function" ) {
            const retryQueue: RetryQueue | null = ( finishedWork.updateQueue as any );

            if ( retryQueue !== null ) {
                suspenseCallback( new Set( retryQueue ) );
            }
        } else if ( __DEV__ ) {
            if ( suspenseCallback !== undefined ) {
                console.error( "Unexpected type for suspenseCallback." );
            }
        }
    }
}

function commitSuspenseHydrationCallbacks( finishedRoot: FiberRoot, finishedWork: Fiber ) {
    if ( ! supportsHydration ) {
        return;
    }

    const newState: SuspenseState | null = finishedWork.memoizedState;

    if ( newState === null ) {
        const current = finishedWork.alternate;

        if ( current !== null ) {
            const prevState: SuspenseState | null = current.memoizedState;

            if ( prevState !== null ) {
                const suspenseInstance = prevState.dehydrated;

                if ( suspenseInstance !== null ) {
                    try {
                        commitHydratedSuspenseInstance( suspenseInstance );

                        if ( enableSuspenseCallback ) {
                            const hydrationCallbacks = finishedRoot.hydrationCallbacks;

                            if ( hydrationCallbacks !== null ) {
                                const onHydrated = hydrationCallbacks.onHydrated;

                                if ( onHydrated ) {
                                    onHydrated( suspenseInstance );
                                }
                            }
                        }
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            }
        }
    }
}

function attachSuspenseRetryListeners( finishedWork: Fiber, wakeables: RetryQueue ) {
    // If this boundary just timed out, then it will have a set of wakeables.
    // For each wakeable, attach a listener so that when it resolves, React
    // attempts to re-render the boundary in the primary (pre-timeout) state.
    const retryCache = getRetryCache( finishedWork );
    wakeables.forEach( wakeable => {
        // Memoize using the boundary fiber to prevent redundant listeners.
        const retry = resolveRetryWakeable.bind( null, finishedWork, wakeable );

        if ( ! retryCache.has( wakeable ) ) {
            retryCache.add( wakeable );

            if ( enableUpdaterTracking ) {
                if ( isDevToolsPresent ) {
                    if ( inProgressLanes !== null && inProgressRoot !== null ) {
                        // If we have pending work still, associate the original updaters with it.
                        restorePendingUpdaters( inProgressRoot, inProgressLanes );
                    } else {
                        throw Error( "Expected finished root and lanes to be set. This is a bug in React." );
                    }
                }
            }

            wakeable.then( retry, retry );
        }
    } );
}

function callComponentWillUnmountWithTimer( current: Fiber, instance: any ) {
    instance.props = current.memoizedProps;
    instance.state = current.memoizedState;

    if ( shouldProfile( current ) ) {
        try {
            startLayoutEffectTimer();
            instance.componentWillUnmount();
        } finally {
            recordLayoutEffectDuration( current );
        }
    } else {
        instance.componentWillUnmount();
    }
}

// Capture errors so they don't interrupt unmounting.
function safelyCallComponentWillUnmount( current: Fiber, nearestMountedAncestor: Fiber | null, instance: any ) {
    try {
        callComponentWillUnmountWithTimer( current, instance );
    } catch ( error ) {
        captureCommitPhaseError( current, nearestMountedAncestor, error );
    }
}

// Capture errors so they don't interrupt mounting.
function safelyAttachRef( current: Fiber, nearestMountedAncestor: Fiber | null ) {
    try {
        commitAttachRef( current );
    } catch ( error ) {
        captureCommitPhaseError( current, nearestMountedAncestor, error );
    }
}

function safelyDetachRef( current: Fiber, nearestMountedAncestor: Fiber | null ) {
    const ref = current.ref;
    const refCleanup = current.refCleanup;

    if ( ref !== null ) {
        if ( typeof refCleanup === "function" ) {
            try {
                if ( shouldProfile( current ) ) {
                    try {
                        startLayoutEffectTimer();
                        refCleanup();
                    } finally {
                        recordLayoutEffectDuration( current );
                    }
                } else {
                    refCleanup();
                }
            } catch ( error ) {
                captureCommitPhaseError( current, nearestMountedAncestor, error );
            } finally {
                // `refCleanup` has been called. Nullify all references to it to prevent double invocation.
                current.refCleanup = null;
                const finishedWork = current.alternate;

                if ( finishedWork != null ) {
                    finishedWork.refCleanup = null;
                }
            }
        } else if ( typeof ref === "function" ) {
            let retVal;

            try {
                if ( shouldProfile( current ) ) {
                    try {
                        startLayoutEffectTimer();
                        retVal = ref( null );
                    } finally {
                        recordLayoutEffectDuration( current );
                    }
                } else {
                    retVal = ref( null );
                }
            } catch ( error ) {
                captureCommitPhaseError( current, nearestMountedAncestor, error );
            }

            if ( __DEV__ ) {
                if ( typeof retVal === "function" ) {
                    console.error( "Unexpected return value from a callback ref in %s. " + "A callback ref should not return a function.", reactGetComponentNameFromFiber( current ) );
                }
            }
        } else {
            // $FlowFixMe[incompatible-use] unable to narrow type to RefObject
            ref.current = null;
        }
    }
}

function commitClassLayoutLifecycles( finishedWork: Fiber, current: Fiber | null ) {
    const instance = finishedWork.stateNode;

    if ( current === null ) {
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        if ( __DEV__ ) {
            if ( finishedWork.type === finishedWork.elementType && ! didWarnAboutReassigningProps ) {
                if ( instance.props !== finishedWork.memoizedProps ) {
                    console.error( "Expected %s props to match memoized props before " + "componentDidMount. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                }

                if ( instance.state !== finishedWork.memoizedState ) {
                    console.error( "Expected %s state to match memoized state before " + "componentDidMount. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                }
            }
        }

        if ( shouldProfile( finishedWork ) ) {
            try {
                startLayoutEffectTimer();
                instance.componentDidMount();
            } catch ( error ) {
                captureCommitPhaseError( finishedWork, finishedWork.return, error );
            }

            recordLayoutEffectDuration( finishedWork );
        } else {
            try {
                instance.componentDidMount();
            } catch ( error ) {
                captureCommitPhaseError( finishedWork, finishedWork.return, error );
            }
        }
    } else {
        const prevProps = finishedWork.elementType === finishedWork.type ? current.memoizedProps : resolveDefaultProps( finishedWork.type, current.memoizedProps );
        const prevState = current.memoizedState;

        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        if ( __DEV__ ) {
            if ( finishedWork.type === finishedWork.elementType && ! didWarnAboutReassigningProps ) {
                if ( instance.props !== finishedWork.memoizedProps ) {
                    console.error( "Expected %s props to match memoized props before " + "componentDidUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                }

                if ( instance.state !== finishedWork.memoizedState ) {
                    console.error( "Expected %s state to match memoized state before " + "componentDidUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                }
            }
        }

        if ( shouldProfile( finishedWork ) ) {
            try {
                startLayoutEffectTimer();
                instance.componentDidUpdate( prevProps, prevState, instance.__reactInternalSnapshotBeforeUpdate );
            } catch ( error ) {
                captureCommitPhaseError( finishedWork, finishedWork.return, error );
            }

            recordLayoutEffectDuration( finishedWork );
        } else {
            try {
                instance.componentDidUpdate( prevProps, prevState, instance.__reactInternalSnapshotBeforeUpdate );
            } catch ( error ) {
                captureCommitPhaseError( finishedWork, finishedWork.return, error );
            }
        }
    }
}

function getRetryCache( finishedWork: Fiber ) {
    // TODO: Unify the interface for the retry cache so we don't have to switch
    // on the tag like this.
    switch ( finishedWork.tag ) {
        case WorkTag.SuspenseComponent:
        case WorkTag.SuspenseListComponent: {
            let retryCache = finishedWork.stateNode;

            if ( retryCache === null ) {
                retryCache = finishedWork.stateNode = new PossiblyWeakSet();
            }

            return retryCache;
        }

        case WorkTag.OffscreenComponent: {
            const instance: OffscreenInstance = finishedWork.stateNode;
            let retryCache: null | Set<Wakeable> | WeakSet<Wakeable> = instance._retryCache;

            if ( retryCache === null ) {
                retryCache = instance._retryCache = new PossiblyWeakSet();
            }

            return retryCache;
        }

        default: {
            throw new Error( `Unexpected Suspense handler tag (${ finishedWork.tag }). This is a ` + "bug in React." );
        }
    }
}

function resolveRetryWakeable( boundaryFiber: Fiber, wakeable: Wakeable ) {
    let retryLane = NoLane; // Default

    let retryCache: WeakSet<Wakeable> | Set<Wakeable> | null;

    switch ( boundaryFiber.tag ) {
        case WorkTag.SuspenseComponent:
            retryCache = boundaryFiber.stateNode;
            const suspenseState: null | SuspenseState = boundaryFiber.memoizedState;

            if ( suspenseState !== null ) {
                retryLane = suspenseState.retryLane;
            }

            break;

        case WorkTag.SuspenseListComponent:
            retryCache = boundaryFiber.stateNode;
            break;

        case WorkTag.OffscreenComponent: {
            const instance: OffscreenInstance = boundaryFiber.stateNode;
            retryCache = instance._retryCache;
            break;
        }

        default:
            throw new Error( "Pinged unknown suspense boundary type. " + "This is probably a bug in React." );
    }

    if ( retryCache !== null ) {
        // The wakeable resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        retryCache.delete( wakeable );
    }

    retryTimedOutBoundary( boundaryFiber, retryLane );
}

export function commitMutationEffects( root: FiberRoot, finishedWork: Fiber, committedLanes: Lanes ) {
    inProgressLanes = committedLanes;
    inProgressRoot = root;
    setCurrentDebugFiberInDEV( finishedWork );
    commitMutationEffectsOnFiber( finishedWork, root, committedLanes );
    setCurrentDebugFiberInDEV( finishedWork );
    inProgressLanes = null;
    inProgressRoot = null;
}

function recursivelyTraverseMutationEffects( root: FiberRoot, parentFiber: Fiber, lanes: Lanes ) {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects hae fired.
    const deletions = parentFiber.deletions;

    if ( deletions !== null ) {
        for ( let i = 0 ; i < deletions.length ; i++ ) {
            const childToDelete = deletions[ i ];

            try {
                commitDeletionEffects( root, parentFiber, childToDelete );
            } catch ( error ) {
                captureCommitPhaseError( childToDelete, parentFiber, error );
            }
        }
    }

    const prevDebugFiber = getCurrentDebugFiberInDEV();

    if ( parentFiber.subtreeFlags & FiberFlags.MutationMask ) {
        let child = parentFiber.child;

        while ( child !== null ) {
            setCurrentDebugFiberInDEV( child );
            commitMutationEffectsOnFiber( child, root, lanes );
            child = child.sibling;
        }
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

function commitDeletionEffects( root: FiberRoot, returnFiber: Fiber, deletedFiber: Fiber ) {
    if ( supportsMutation ) {
        // We only have the top Fiber that was deleted but we need to recurse down its
        // children to find all the terminal nodes.
        // Recursively delete all host nodes from the parent, detach refs, clean
        // up mounted layout effects, and call componentWillUnmount.
        // We only need to remove the topmost host child in each branch. But then we
        // still need to keep traversing to unmount effects, refs, and cWU. TODO: We
        // could split this into two separate traversals functions, where the second
        // one doesn't include any removeChild logic. This is maybe the same
        // function as "disappearLayoutEffects" (or whatever that turns into after
        // the layout phase is refactored to use recursion).
        // Before starting, find the nearest host parent on the stack so we know
        // which instance/container to remove the children from.
        // TODO: Instead of searching up the fiber return path on every deletion, we
        // can track the nearest host component on the JS stack as we traverse the
        // tree during the commit phase. This would make insertions faster, too.
        let parent: null | Fiber = returnFiber;

        findParent: while ( parent !== null ) {
            switch ( parent.tag ) {
                case WorkTag.HostSingleton:
                case WorkTag.HostComponent: {
                    hostParent = parent.stateNode;
                    hostParentIsContainer = false;
                    break findParent;
                }

                case WorkTag.HostRoot: {
                    hostParent = parent.stateNode.containerInfo;
                    hostParentIsContainer = true;
                    break findParent;
                }

                case WorkTag.HostPortal: {
                    hostParent = parent.stateNode.containerInfo;
                    hostParentIsContainer = true;
                    break findParent;
                }
            }

            parent = parent.return;
        }

        if ( hostParent === null ) {
            throw new Error( "Expected to find a host parent. This error is likely caused by " + "a bug in React. Please file an issue." );
        }

        commitDeletionEffectsOnFiber( root, returnFiber, deletedFiber );
        hostParent = null;
        hostParentIsContainer = false;
    } else {
        // Detach refs and call componentWillUnmount() on the whole subtree.
        commitDeletionEffectsOnFiber( root, returnFiber, deletedFiber );
    }

    detachFiberMutation( deletedFiber );
}

function recursivelyTraverseDeletionEffects( finishedRoot: FiberRoot, nearestMountedAncestor: Fiber, parent: Fiber ) {
    // TODO: Use a static flag to skip trees that don't have unmount effects
    let child = parent.child;

    while ( child !== null ) {
        commitDeletionEffectsOnFiber( finishedRoot, nearestMountedAncestor, child );
        child = child.sibling;
    }
}

function commitDeletionEffectsOnFiber( finishedRoot: FiberRoot, nearestMountedAncestor: Fiber, deletedFiber: Fiber ) {
    onCommitUnmount( deletedFiber );

    // The cases in this outer switch modify the stack before they traverse
    // into their subtree. There are simpler cases in the inner switch
    // that don't modify the stack.
    switch ( deletedFiber.tag ) {
        case WorkTag.HostHoistable: {
            if ( enableFloat && supportsResources ) {
                if ( ! offscreenSubtreeWasHidden ) {
                    safelyDetachRef( deletedFiber, nearestMountedAncestor );
                }

                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );

                if ( deletedFiber.memoizedState ) {
                    releaseResource( deletedFiber.memoizedState );
                } else if ( deletedFiber.stateNode ) {
                    unmountHoistable( deletedFiber.stateNode );
                }

                return;
            } // Fall through

        }

        case WorkTag.HostSingleton: {
            if ( enableHostSingletons && supportsSingletons ) {
                if ( ! offscreenSubtreeWasHidden ) {
                    safelyDetachRef( deletedFiber, nearestMountedAncestor );
                }

                const prevHostParent = hostParent;
                const prevHostParentIsContainer = hostParentIsContainer;
                hostParent = deletedFiber.stateNode;
                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
                // Normally this is called in passive unmount effect phase however with
                // HostSingleton we warn if you acquire one that is already associated to
                // a different fiber. To increase our chances of avoiding this, specifically
                // if you keyed a HostSingleton so there will be a delete followed by a Placement
                // we treat detach eagerly here
                releaseSingletonInstance( deletedFiber.stateNode );
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;
                return;
            } // Fall through

        }

        case WorkTag.HostComponent: {
            if ( ! offscreenSubtreeWasHidden ) {
                safelyDetachRef( deletedFiber, nearestMountedAncestor );
            } // Intentional fallthrough to next branch

        }

        case WorkTag.HostText: {
            // We only need to remove the nearest host child. Set the host parent
            // to `null` on the stack to indicate that nested children don't
            // need to be removed.
            if ( supportsMutation ) {
                const prevHostParent = hostParent;
                const prevHostParentIsContainer = hostParentIsContainer;
                hostParent = null;
                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;

                if ( hostParent !== null ) {
                    // Now that all the child effects have unmounted, we can remove the
                    // node from the tree.
                    if ( hostParentIsContainer ) {
                        removeChildFromContainer( ( ( hostParent as any ) as Container ), ( deletedFiber.stateNode as Instance | TextInstance ) );
                    } else {
                        removeChild( ( ( hostParent as any ) as Instance ), ( deletedFiber.stateNode as Instance | TextInstance ) );
                    }
                }
            } else {
                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
            }

            return;
        }

        case WorkTag.DehydratedFragment: {
            if ( enableSuspenseCallback ) {
                const hydrationCallbacks = finishedRoot.hydrationCallbacks;

                if ( hydrationCallbacks !== null ) {
                    const onDeleted = hydrationCallbacks.onDeleted;

                    if ( onDeleted ) {
                        onDeleted( ( deletedFiber.stateNode as SuspenseInstance ) );
                    }
                }
            }

            // Dehydrated fragments don't have any children
            // Delete the dehydrated suspense boundary and all of its content.
            if ( supportsMutation ) {
                if ( hostParent !== null ) {
                    if ( hostParentIsContainer ) {
                        clearSuspenseBoundaryFromContainer( ( ( hostParent as any ) as Container ), ( deletedFiber.stateNode as SuspenseInstance ) );
                    } else {
                        clearSuspenseBoundary( ( ( hostParent as any ) as Instance ), ( deletedFiber.stateNode as SuspenseInstance ) );
                    }
                }
            }

            return;
        }

        case WorkTag.HostPortal: {
            if ( supportsMutation ) {
                // When we go into a portal, it becomes the parent to remove from.
                const prevHostParent = hostParent;
                const prevHostParentIsContainer = hostParentIsContainer;
                hostParent = deletedFiber.stateNode.containerInfo;
                hostParentIsContainer = true;
                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;
            } else {
                emptyPortalContainer( deletedFiber );
                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
            }

            return;
        }

        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.MemoComponent:
        case WorkTag.SimpleMemoComponent: {
            if ( ! offscreenSubtreeWasHidden ) {
                const updateQueue: FunctionComponentUpdateQueue | null = ( deletedFiber.updateQueue as any );

                if ( updateQueue !== null ) {
                    const lastEffect = updateQueue.lastEffect;

                    if ( lastEffect !== null ) {
                        const firstEffect = lastEffect.next;
                        let effect = firstEffect;

                        do {
                            const tag = effect.tag;
                            const inst = effect.inst;
                            const destroy = inst.destroy;

                            if ( destroy !== undefined ) {
                                if ( ( tag & HookFlags.Insertion ) !== HookFlags.NoHookEffect ) {
                                    inst.destroy = undefined;
                                    safelyCallDestroy( deletedFiber, nearestMountedAncestor, destroy );
                                } else if ( ( tag & HookFlags.Layout ) !== HookFlags.NoHookEffect ) {
                                    if ( enableSchedulingProfiler ) {
                                        markComponentLayoutEffectUnmountStarted( deletedFiber );
                                    }

                                    if ( shouldProfile( deletedFiber ) ) {
                                        startLayoutEffectTimer();
                                        inst.destroy = undefined;
                                        safelyCallDestroy( deletedFiber, nearestMountedAncestor, destroy );
                                        recordLayoutEffectDuration( deletedFiber );
                                    } else {
                                        inst.destroy = undefined;
                                        safelyCallDestroy( deletedFiber, nearestMountedAncestor, destroy );
                                    }

                                    if ( enableSchedulingProfiler ) {
                                        markComponentLayoutEffectUnmountStopped();
                                    }
                                }
                            }

                            effect = effect.next;
                        } while ( effect !== firstEffect );
                    }
                }
            }

            recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
            return;
        }

        case WorkTag.ClassComponent: {
            if ( ! offscreenSubtreeWasHidden ) {
                safelyDetachRef( deletedFiber, nearestMountedAncestor );
                const instance = deletedFiber.stateNode;

                if ( typeof instance.componentWillUnmount === "function" ) {
                    safelyCallComponentWillUnmount( deletedFiber, nearestMountedAncestor, instance );
                }
            }

            recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
            return;
        }

        case WorkTag.ScopeComponent: {
            if ( enableScopeAPI ) {
                safelyDetachRef( deletedFiber, nearestMountedAncestor );
            }

            recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
            return;
        }

        case WorkTag.OffscreenComponent: {
            safelyDetachRef( deletedFiber, nearestMountedAncestor );

            if ( deletedFiber.mode & TypeOfMode.ConcurrentMode ) {
                // If this offscreen component is hidden, we already unmounted it. Before
                // deleting the children, track that it's already unmounted so that we
                // don't attempt to unmount the effects again.
                // TODO: If the tree is hidden, in most cases we should be able to skip
                // over the nested children entirely. An exception is we haven't yet found
                // the topmost host node to delete, which we already track on the stack.
                // But the other case is portals, which need to be detached no matter how
                // deeply they are nested. We should use a subtree flag to track whether a
                // subtree includes a nested portal.
                const prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || deletedFiber.memoizedState !== null;
                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            } else {
                recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
            }

            break;
        }

        default: {
            recursivelyTraverseDeletionEffects( finishedRoot, nearestMountedAncestor, deletedFiber );
            return;
        }
    }
}

function commitHookLayoutEffects( finishedWork: Fiber, hookFlags: HookFlags ) {
    // At this point layout effects have already been destroyed (during mutation phase).
    // This is done to prevent sibling component effects from interfering with each other,
    // e.g. a destroy function in one component should never override a ref set
    // by a create function in another component during the same commit.
    if ( shouldProfile( finishedWork ) ) {
        try {
            startLayoutEffectTimer();
            commitHookEffectListMount( hookFlags, finishedWork );
        } catch ( error ) {
            captureCommitPhaseError( finishedWork, finishedWork.return, error );
        }

        recordLayoutEffectDuration( finishedWork );
    } else {
        try {
            commitHookEffectListMount( hookFlags, finishedWork );
        } catch ( error ) {
            captureCommitPhaseError( finishedWork, finishedWork.return, error );
        }
    }
}

function commitMutationEffectsOnFiber( finishedWork: Fiber, root: FiberRoot, lanes: Lanes ) {
    const current = finishedWork.alternate;
    const flags = finishedWork.flags;

    // The effect flag should be checked *after* we refine the type of fiber,
    // because the fiber tag is more specific. An exception is any flag related
    // to reconciliation, because those can be set on all fiber types.
    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.MemoComponent:
        case WorkTag.SimpleMemoComponent: {
            recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            commitReconciliationEffects( finishedWork );

            if ( flags & FiberFlags.Update ) {
                try {
                    commitHookEffectListUnmount( HookFlags.Insertion | HookFlags.HasEffect, finishedWork, finishedWork.return );
                    commitHookEffectListMount( HookFlags.Insertion | HookFlags.HasEffect, finishedWork );
                } catch ( error ) {
                    captureCommitPhaseError( finishedWork, finishedWork.return, error );
                }

                // Layout effects are destroyed during the mutation phase so that all
                // destroy functions for all fibers are called before any create functions.
                // This prevents sibling component effects from interfering with each other,
                // e.g. a destroy function in one component should never override a ref set
                // by a create function in another component during the same commit.
                if ( shouldProfile( finishedWork ) ) {
                    try {
                        startLayoutEffectTimer();
                        commitHookEffectListUnmount( HookFlags.Layout | HookFlags.HasEffect, finishedWork, finishedWork.return );
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }

                    recordLayoutEffectDuration( finishedWork );
                } else {
                    try {
                        commitHookEffectListUnmount( HookFlags.Layout | HookFlags.HasEffect, finishedWork, finishedWork.return );
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            }

            return;
        }

        case WorkTag.ClassComponent: {
            recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            commitReconciliationEffects( finishedWork );

            if ( flags & FiberFlags.Ref ) {
                if ( current !== null ) {
                    safelyDetachRef( current, current.return );
                }
            }

            if ( flags& FiberFlags.Callback && offscreenSubtreeIsHidden ) {
                const updateQueue: FiberUpdateQueue<unknown> | null = ( finishedWork.updateQueue as any );

                if ( updateQueue !== null ) {
                    deferHiddenCallbacks( updateQueue );
                }
            }

            return;
        }

        case WorkTag.HostHoistable: {
            if ( enableFloat && supportsResources ) {
                // We cast because we always set the root at the React root and so it cannot be
                // null while we are processing mutation effects
                const hoistableRoot: HoistableRoot = getCurrentHoistableRootSafe();
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
                commitReconciliationEffects( finishedWork );

                if ( flags & FiberFlags.Ref ) {
                    if ( current !== null ) {
                        safelyDetachRef( current, current.return );
                    }
                }

                if ( flags & FiberFlags.Update ) {
                    const currentResource = current !== null ? current.memoizedState : null;
                    const newResource = finishedWork.memoizedState;

                    if ( current === null ) {
                        // We are mounting a new HostHoistable Fiber. We fork the mount
                        // behavior based on whether this instance is a Hoistable Instance
                        // or a Hoistable Resource
                        if ( newResource === null ) {
                            if ( finishedWork.stateNode === null ) {
                                finishedWork.stateNode = hydrateHoistable( hoistableRoot, finishedWork.type, finishedWork.memoizedProps, finishedWork );
                            } else {
                                mountHoistable( hoistableRoot, finishedWork.type, finishedWork.stateNode );
                            }
                        } else {
                            finishedWork.stateNode = acquireResource( hoistableRoot, newResource, finishedWork.memoizedProps );
                        }
                    } else if ( currentResource !== newResource ) {
                        // We are moving to or from Hoistable Resource, or between different Hoistable Resources
                        if ( currentResource === null ) {
                            if ( current.stateNode !== null ) {
                                unmountHoistable( current.stateNode );
                            }
                        } else {
                            releaseResource( currentResource );
                        }

                        if ( newResource === null ) {
                            mountHoistable( hoistableRoot, finishedWork.type, finishedWork.stateNode );
                        } else {
                            acquireResource( hoistableRoot, newResource, finishedWork.memoizedProps );
                        }
                    } else if ( newResource === null && finishedWork.stateNode !== null ) {
                        // We may have an update on a Hoistable element
                        const updatePayload: null | UpdatePayload = ( finishedWork.updateQueue as any );
                        finishedWork.updateQueue = null;

                        try {
                            commitUpdate( finishedWork.stateNode, updatePayload, finishedWork.type, current.memoizedProps, finishedWork.memoizedProps, finishedWork );
                        } catch ( error ) {
                            captureCommitPhaseError( finishedWork, finishedWork.return, error );
                        }
                    }
                }

                return;
            } // Fall through

        }

        case WorkTag.HostSingleton: {
            if ( enableHostSingletons && supportsSingletons ) {
                if ( flags & FiberFlags.Update ) {
                    const previousWork = finishedWork.alternate;

                    if ( previousWork === null ) {
                        const singleton = finishedWork.stateNode;
                        const props = finishedWork.memoizedProps;
                        // This was a new mount, we need to clear and set initial properties
                        clearSingleton( singleton );
                        acquireSingletonInstance( finishedWork.type, props, singleton, finishedWork );
                    }
                }
            } // Fall through

        }

        case WorkTag.HostComponent: {
            recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            commitReconciliationEffects( finishedWork );

            if ( flags & FiberFlags.Ref ) {
                if ( current !== null ) {
                    safelyDetachRef( current, current.return );
                }
            }

            if ( supportsMutation ) {
                // TODO: ContentReset gets cleared by the children during the commit
                // phase. This is a refactor hazard because it means we must read
                // flags the flags after `commitReconciliationEffects` has already run;
                // the order matters. We should refactor so that ContentReset does not
                // rely on mutating the flag during commit. Like by setting a flag
                // during the render phase instead.
                if ( finishedWork.flags & FiberFlags.ContentReset ) {
                    const instance: Instance = finishedWork.stateNode;

                    try {
                        resetTextContent( instance );
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }

                if ( flags & FiberFlags.Update ) {
                    const instance: Instance = finishedWork.stateNode;

                    if ( instance != null ) {
                        // Commit the work prepared earlier.
                        const newProps = finishedWork.memoizedProps;
                        // For hydration we reuse the update path but we treat the oldProps
                        // as the newProps. The updatePayload will contain the real change in
                        // this case.
                        const oldProps = current !== null ? current.memoizedProps : newProps;
                        const type = finishedWork.type;
                        // TODO: Type the updateQueue to be specific to host components.
                        const updatePayload: null | UpdatePayload = ( finishedWork.updateQueue as any );
                        finishedWork.updateQueue = null;

                        try {
                            commitUpdate( instance, updatePayload, type, oldProps, newProps, finishedWork );
                        } catch ( error ) {
                            captureCommitPhaseError( finishedWork, finishedWork.return, error );
                        }
                    }
                }
            }

            return;
        }

        case WorkTag.HostText: {
            recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            commitReconciliationEffects( finishedWork );

            if ( flags & FiberFlags.Update ) {
                if ( supportsMutation ) {
                    if ( finishedWork.stateNode === null ) {
                        throw new Error( "This should have a text node initialized. This error is likely " + "caused by a bug in React. Please file an issue." );
                    }

                    const textInstance: TextInstance = finishedWork.stateNode;
                    const newText: string = finishedWork.memoizedProps;
                    // For hydration we reuse the update path but we treat the oldProps
                    // as the newProps. The updatePayload will contain the real change in
                    // this case.
                    const oldText: string = current !== null ? current.memoizedProps : newText;

                    try {
                        commitTextUpdate( textInstance, oldText, newText );
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            }

            return;
        }

        case WorkTag.HostRoot: {
            if ( enableFloat && supportsResources ) {
                prepareToCommitHoistables();
                const previousHoistableRoot = getCurrentHoistableRoot();
                setCurrentHoistableRoot( getHoistableRoot( root.containerInfo ) );
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
                setCurrentHoistableRoot( previousHoistableRoot );
                commitReconciliationEffects( finishedWork );
            } else {
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
                commitReconciliationEffects( finishedWork );
            }

            if ( flags & FiberFlags.Update ) {
                if ( supportsMutation && supportsHydration ) {
                    if ( current !== null ) {
                        const prevRootState: RootState = current.memoizedState;

                        if ( prevRootState.isDehydrated ) {
                            try {
                                commitHydratedContainer( root.containerInfo );
                            } catch ( error ) {
                                captureCommitPhaseError( finishedWork, finishedWork.return, error );
                            }
                        }
                    }
                }

                if ( supportsPersistence ) {
                    const containerInfo = root.containerInfo;
                    const pendingChildren = root.pendingChildren;

                    try {
                        replaceContainerChildren( containerInfo, pendingChildren );
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            }

            return;
        }

        case WorkTag.HostPortal: {
            if ( enableFloat && supportsResources ) {
                const previousHoistableRoot = getCurrentHoistableRoot();
                setCurrentHoistableRoot( getHoistableRoot( finishedWork.stateNode.containerInfo ) );
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
                commitReconciliationEffects( finishedWork );
                setCurrentHoistableRoot( previousHoistableRoot );
            } else {
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
                commitReconciliationEffects( finishedWork );
            }

            if ( flags & FiberFlags.Update ) {
                if ( supportsPersistence ) {
                    const portal = finishedWork.stateNode;
                    const containerInfo = portal.containerInfo;
                    const pendingChildren = portal.pendingChildren;

                    try {
                        replaceContainerChildren( containerInfo, pendingChildren );
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            }

            return;
        }

        case WorkTag.SuspenseComponent: {
            recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            commitReconciliationEffects( finishedWork );
            // TODO: We should mark a flag on the Suspense fiber itself, rather than
            // relying on the Offscreen fiber having a flag also being marked. The
            // reason is that this offscreen fiber might not be part of the work-in-
            // progress tree! It could have been reused from a previous render. This
            // doesn't lead to incorrect behavior because we don't rely on the flag
            // check alone; we also compare the states explicitly below. But for
            // modeling purposes, we _should_ be able to rely on the flag check alone.
            // So this is a bit fragile.
            //
            // Also, all this logic could/should move to the passive phase so it
            // doesn't block paint.
            const offscreenFiber: Fiber = ( finishedWork.child as any );

            if ( offscreenFiber.flags & FiberFlags.Visibility ) {
                // Throttle the appearance and disappearance of Suspense fallbacks.
                const isShowingFallback = ( finishedWork.memoizedState as SuspenseState | null ) !== null;
                const wasShowingFallback = current !== null && ( current.memoizedState as SuspenseState | null ) !== null;

                if ( alwaysThrottleRetries ) {
                    if ( isShowingFallback !== wasShowingFallback ) {
                        // A fallback is either appearing or disappearing.
                        markCommitTimeOfFallback();
                    }
                } else {
                    if ( isShowingFallback && ! wasShowingFallback ) {
                        // Old behavior. Only mark when a fallback appears, not when
                        // it disappears.
                        markCommitTimeOfFallback();
                    }
                }
            }

            if ( flags & FiberFlags.Update ) {
                try {
                    commitSuspenseCallback( finishedWork );
                } catch ( error ) {
                    captureCommitPhaseError( finishedWork, finishedWork.return, error );
                }

                const retryQueue: RetryQueue | null = ( finishedWork.updateQueue as any );

                if ( retryQueue !== null ) {
                    finishedWork.updateQueue = null;
                    attachSuspenseRetryListeners( finishedWork, retryQueue );
                }
            }

            return;
        }

        case WorkTag.OffscreenComponent: {
            if ( flags & FiberFlags.Ref ) {
                if ( current !== null ) {
                    safelyDetachRef( current, current.return );
                }
            }

            const newState: OffscreenState | null = finishedWork.memoizedState;
            const isHidden = newState !== null;
            const wasHidden = current !== null && current.memoizedState !== null;

            if ( finishedWork.mode & TypeOfMode.ConcurrentMode ) {
                // Before committing the children, track on the stack whether this
                // offscreen subtree was already hidden, so that we don't unmount the
                // effects again.
                const prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
                const prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || isHidden;
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wasHidden;
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
                offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
            } else {
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            }

            commitReconciliationEffects( finishedWork );
            const offscreenInstance: OffscreenInstance = finishedWork.stateNode;
            // TODO: Add explicit effect flag to set _current.
            offscreenInstance._current = finishedWork;
            // Offscreen stores pending changes to visibility in `_pendingVisibility`. This is
            // to support batching of `attach` and `detach` calls.
            offscreenInstance._visibility &= ~OffscreenDetached;
            offscreenInstance._visibility |= offscreenInstance._pendingVisibility & OffscreenDetached;

            if ( flags & FiberFlags.Visibility ) {
                // Track the current state on the Offscreen instance so we can
                // read it during an event
                if ( isHidden ) {
                    offscreenInstance._visibility &= ~OffscreenVisible;
                } else {
                    offscreenInstance._visibility |= OffscreenVisible;
                }

                if ( isHidden ) {
                    const isUpdate = current !== null;
                    const wasHiddenByAncestorOffscreen = offscreenSubtreeIsHidden || offscreenSubtreeWasHidden;

                    // Only trigger disapper layout effects if:
                    //   - This is an update, not first mount.
                    //   - This Offscreen was not hidden before.
                    //   - Ancestor Offscreen was not hidden in previous commit.
                    if ( isUpdate && ! wasHidden && ! wasHiddenByAncestorOffscreen ) {
                        if ( ( finishedWork.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode ) {
                            // Disappear the layout effects of all the children
                            recursivelyTraverseDisappearLayoutEffects( finishedWork );
                        }
                    }
                } else {
                    if ( wasHidden ) {// TODO: Move re-appear call here for symmetry?
                    }
                }

                // Offscreen with manual mode manages visibility manually.
                if ( supportsMutation && ! isOffscreenManual( finishedWork ) ) {
                    // TODO: This needs to run whenever there's an insertion or update
                    // inside a hidden Offscreen tree.
                    hideOrUnhideAllChildren( finishedWork, isHidden );
                }
            }

            // TODO: Move to passive phase
            if ( flags & FiberFlags.Update ) {
                const offscreenQueue: OffscreenQueue | null = ( finishedWork.updateQueue as any );

                if ( offscreenQueue !== null ) {
                    const retryQueue = offscreenQueue.retryQueue;

                    if ( retryQueue !== null ) {
                        offscreenQueue.retryQueue = null;
                        attachSuspenseRetryListeners( finishedWork, retryQueue );
                    }
                }
            }

            return;
        }

        case WorkTag.SuspenseListComponent: {
            recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            commitReconciliationEffects( finishedWork );

            if ( flags & FiberFlags.Update ) {
                const retryQueue: Set<Wakeable> | null = ( finishedWork.updateQueue as any );

                if ( retryQueue !== null ) {
                    finishedWork.updateQueue = null;
                    attachSuspenseRetryListeners( finishedWork, retryQueue );
                }
            }

            return;
        }

        case WorkTag.ScopeComponent: {
            if ( enableScopeAPI ) {
                recursivelyTraverseMutationEffects( root, finishedWork, lanes );
                commitReconciliationEffects( finishedWork );

                // TODO: This is a temporary solution that allowed us to transition away
                // from React Flare on www.
                if ( flags & FiberFlags.Ref ) {
                    if ( current !== null ) {
                        safelyDetachRef( finishedWork, finishedWork.return );
                    }

                    safelyAttachRef( finishedWork, finishedWork.return );
                }

                if ( flags & FiberFlags.Update ) {
                    const scopeInstance = finishedWork.stateNode;
                    prepareScopeUpdate( scopeInstance, finishedWork );
                }
            }

            return;
        }

        default: {
            recursivelyTraverseMutationEffects( root, finishedWork, lanes );
            commitReconciliationEffects( finishedWork );
            return;
        }
    }
}

export function commitBeforeMutationEffects( root: FiberRoot, firstChild: Fiber ): boolean {
    focusedInstanceHandle = prepareForCommit( root.containerInfo );

    setNextEffect( firstChild );

    commitBeforeMutationEffects_begin();
    // We no longer need to track the active instance fiber
    const shouldFire = shouldFireAfterActiveInstanceBlur;
    shouldFireAfterActiveInstanceBlur = false;
    focusedInstanceHandle = null;
    return shouldFire;
}

function commitBeforeMutationEffects_begin() {
    while ( hasNextEffect() ) {
        const fiber = getNextEffectSafe();

        // This phase is only used for beforeActiveInstanceBlur.
        // Let's skip the whole loop if it's off.
        if ( enableCreateEventHandleAPI ) {
            // TODO: Should wrap this in flags check, too, as optimization
            const deletions = fiber.deletions;

            if ( deletions !== null ) {
                for ( let i = 0 ; i < deletions.length ; i++ ) {
                    const deletion = deletions[ i ];
                    commitBeforeMutationEffectsDeletion( deletion );
                }
            }
        }

        const child = fiber.child;

        if ( ( fiber.subtreeFlags & FiberFlags.BeforeMutationMask ) !== FiberFlags.NoFlags && child !== null ) {
            child.return = fiber;
            setNextEffect( child );
        } else {
            commitBeforeMutationEffects_complete();
        }
    }
}

function commitBeforeMutationEffects_complete() {
    while ( hasNextEffect() ) {
        const fiber = getNextEffectSafe();
        setCurrentDebugFiberInDEV( fiber );

        try {
            commitBeforeMutationEffectsOnFiber( fiber );
        } catch ( error ) {
            captureCommitPhaseError( fiber, fiber.return, error );
        }

        resetCurrentDebugFiberInDEV();
        const sibling = fiber.sibling;

        if ( sibling !== null ) {
            sibling.return = fiber.return;
            setNextEffect( sibling );
            return;
        }

        setNextEffect( fiber.return );
    }
}

function commitBeforeMutationEffectsOnFiber( finishedWork: Fiber ) {
    const current = finishedWork.alternate;
    const flags = finishedWork.flags;

    if ( enableCreateEventHandleAPI ) {
        if ( ! shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null ) {
            // Check to see if the focused element was inside of a hidden (Suspense) subtree.
            // TODO: Move this out of the hot path using a dedicated effect tag.
            if ( finishedWork.tag === WorkTag.SuspenseComponent && isSuspenseBoundaryBeingHidden( current, finishedWork ) && // $FlowFixMe[incompatible-call] found when upgrading Flow
                doesFiberContain( finishedWork, focusedInstanceHandle ) ) {
                shouldFireAfterActiveInstanceBlur = true;
                beforeActiveInstanceBlur( finishedWork );
            }
        }
    }

    if ( ( flags & FiberFlags.Snapshot ) !== FiberFlags.NoFlags ) {
        setCurrentDebugFiberInDEV( finishedWork );
    }

    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent: {
            if ( enableUseEffectEventHook ) {
                if ( ( flags & FiberFlags.Update ) !== FiberFlags.NoFlags ) {
                    commitUseEffectEventMount( finishedWork );
                }
            }

            break;
        }

        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            break;
        }

        case WorkTag.ClassComponent: {
            if ( ( flags & FiberFlags.Snapshot ) !== FiberFlags.NoFlags ) {
                if ( current !== null ) {
                    const prevProps = current.memoizedProps;
                    const prevState = current.memoizedState;
                    const instance = finishedWork.stateNode;

                    // We could update instance props and state here,
                    // but instead we rely on them being set during last render.
                    // TODO: revisit this when we implement resuming.
                    if ( __DEV__ ) {
                        if ( finishedWork.type === finishedWork.elementType && ! didWarnAboutReassigningProps() ) {
                            if ( instance.props !== finishedWork.memoizedProps ) {
                                console.error( "Expected %s props to match memoized props before " + "getSnapshotBeforeUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                            }

                            if ( instance.state !== finishedWork.memoizedState ) {
                                console.error( "Expected %s state to match memoized state before " + "getSnapshotBeforeUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", reactGetComponentNameFromFiber( finishedWork ) || "instance" );
                            }
                        }
                    }

                    const snapshot = instance.getSnapshotBeforeUpdate( finishedWork.elementType === finishedWork.type ? prevProps : resolveDefaultProps( finishedWork.type, prevProps ), prevState );

                    if ( __DEV__ ) {
                        const didWarnSet = ( ( didWarnAboutUndefinedSnapshotBeforeUpdate as any ) as Set<unknown> );

                        if ( snapshot === undefined && ! didWarnSet.has( finishedWork.type ) ) {
                            didWarnSet.add( finishedWork.type );
                            console.error( "%s.getSnapshotBeforeUpdate(): A snapshot value (or null) " + "must be returned. You have returned undefined.", reactGetComponentNameFromFiber( finishedWork ) );
                        }
                    }

                    instance.__reactInternalSnapshotBeforeUpdate = snapshot;
                }
            }

            break;
        }

        case WorkTag.HostRoot: {
            if ( ( flags & FiberFlags.Snapshot ) !== FiberFlags.NoFlags ) {
                if ( supportsMutation ) {
                    const root = finishedWork.stateNode;
                    clearContainer( root.containerInfo );
                }
            }

            break;
        }

        case WorkTag.HostComponent:
        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostText:
        case WorkTag.HostPortal:
        case WorkTag.IncompleteClassComponent:
            // Nothing to do for these component types
            break;

        default: {
            if ( ( flags & FiberFlags.Snapshot ) !== FiberFlags.NoFlags ) {
                throw new Error( "This unit of work tag should not have side-effects. This error is " + "likely caused by a bug in React. Please file an issue." );
            }
        }
    }

    if ( ( flags & FiberFlags.Snapshot ) !== FiberFlags.NoFlags ) {
        resetCurrentDebugFiberInDEV();
    }
}

function commitBeforeMutationEffectsDeletion( deletion: Fiber ) {
    if ( enableCreateEventHandleAPI ) {
        // TODO (effects) It would be nice to avoid calling doesFiberContain()
        // Maybe we can repurpose one of the subtreeFlags positions for this instead?
        // Use it to store which part of the tree the focused instance is in?
        // This assumes we can safely determine that instance during the "render" phase.
        if ( doesFiberContain( deletion, ( ( focusedInstanceHandle as any ) as Fiber ) ) ) {
            shouldFireAfterActiveInstanceBlur = true;
            beforeActiveInstanceBlur( deletion );
        }
    }
}

function commitUseEffectEventMount( finishedWork: Fiber ) {
    const updateQueue: FunctionComponentUpdateQueue | null = ( finishedWork.updateQueue as any );
    const eventPayloads = updateQueue !== null ? updateQueue.events : null;

    if ( eventPayloads !== null ) {
        for ( let ii = 0 ; ii < eventPayloads.length ; ii++ ) {
            const {
                ref,
                nextImpl
            } = eventPayloads[ ii ];
            ref.impl = nextImpl;
        }
    }
}

function commitLayoutEffectOnFiber( finishedRoot: FiberRoot, current: Fiber | null, finishedWork: Fiber, committedLanes: Lanes ): void {
    // When updating this function, also update reappearLayoutEffects, which does
    // most of the same things when an offscreen tree goes from hidden -> visible.
    const flags = finishedWork.flags;

    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );

            if ( flags & FiberFlags.Update ) {
                commitHookLayoutEffects( finishedWork, HookFlags.Layout | HookFlags.HasEffect );
            }

            break;
        }

        case WorkTag.ClassComponent: {
            recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );

            if ( flags & FiberFlags.Update ) {
                commitClassLayoutLifecycles( finishedWork, current );
            }

            if ( flags & FiberFlags.Callback ) {
                commitClassCallbacks( finishedWork );
            }

            if ( flags & FiberFlags.Ref ) {
                safelyAttachRef( finishedWork, finishedWork.return );
            }

            break;
        }

        case WorkTag.HostRoot: {
            recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );

            if ( flags & FiberFlags.Callback ) {
                // TODO: I think this is now always non-null by the time it reaches the
                // commit phase. Consider removing the type check.
                const updateQueue: FiberUpdateQueue<unknown> | null = ( finishedWork.updateQueue as any );

                if ( updateQueue !== null ) {
                    let instance: Element | null = null;

                    if ( finishedWork.child !== null ) {
                        switch ( finishedWork.child.tag ) {
                            case WorkTag.HostSingleton:
                            case WorkTag.HostComponent:
                                instance = getPublicInstance( finishedWork.child.stateNode );
                                break;

                            case WorkTag.ClassComponent:
                                instance = finishedWork.child.stateNode;
                                break;
                        }
                    }

                    try {
                        commitCallbacks( updateQueue, instance );
                    } catch ( error ) {
                        captureCommitPhaseError( finishedWork, finishedWork.return, error );
                    }
                }
            }

            break;
        }

        case WorkTag.HostHoistable: {
            if ( enableFloat && supportsResources ) {
                recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );

                if ( flags & FiberFlags.Ref ) {
                    safelyAttachRef( finishedWork, finishedWork.return );
                }

                break;
            } // Fall through

        }

        case WorkTag.HostSingleton:
        case WorkTag.HostComponent: {
            recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );

            // Renderers may schedule work to be done after host components are mounted
            // (eg DOM renderer may schedule auto-focus for inputs and form controls).
            // These effects should only be committed when components are first mounted,
            // aka when there is no current/alternate.
            if ( current === null && flags & FiberFlags.Update ) {
                commitHostComponentMount( finishedWork );
            }

            if ( flags & FiberFlags.Ref ) {
                safelyAttachRef( finishedWork, finishedWork.return );
            }

            break;
        }

        case WorkTag.Profiler: {
            recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );

            // TODO: Should this fire inside an offscreen tree? Or should it wait to
            // fire when the tree becomes visible again.
            if ( flags & FiberFlags.Update ) {
                commitProfilerUpdate( finishedWork, current );
            }

            break;
        }

        case WorkTag.SuspenseComponent: {
            recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );

            if ( flags & FiberFlags.Update ) {
                commitSuspenseHydrationCallbacks( finishedRoot, finishedWork );
            }

            break;
        }

        case WorkTag.OffscreenComponent: {
            const isModernRoot = ( finishedWork.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;

            if ( isModernRoot ) {
                const isHidden = finishedWork.memoizedState !== null;
                const newOffscreenSubtreeIsHidden = isHidden || offscreenSubtreeIsHidden;

                if ( newOffscreenSubtreeIsHidden ) {// The Offscreen tree is hidden. Skip over its layout effects.
                } else {
                    // The Offscreen tree is visible.
                    const wasHidden = current !== null && current.memoizedState !== null;
                    const newOffscreenSubtreeWasHidden = wasHidden || offscreenSubtreeWasHidden;
                    const prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
                    const prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                    offscreenSubtreeIsHidden = newOffscreenSubtreeIsHidden;
                    offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden;

                    if ( offscreenSubtreeWasHidden && ! prevOffscreenSubtreeWasHidden ) {
                        // This is the root of a reappearing boundary. As we continue
                        // traversing the layout effects, we must also re-mount layout
                        // effects that were unmounted when the Offscreen subtree was
                        // hidden. So this is a superset of the normal commitLayoutEffects.
                        const includeWorkInProgressEffects = ( finishedWork.subtreeFlags & FiberFlags.LayoutMask ) !== FiberFlags.NoFlags;
                        recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );
                    } else {
                        recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );
                    }

                    offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
                    offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
                }
            } else {
                recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );
            }

            if ( flags & FiberFlags.Ref ) {
                const props: OffscreenProps = finishedWork.memoizedProps;

                if ( props.mode === "manual" ) {
                    safelyAttachRef( finishedWork, finishedWork.return );
                } else {
                    safelyDetachRef( finishedWork, finishedWork.return );
                }
            }

            break;
        }

        default: {
            recursivelyTraverseLayoutEffects( finishedRoot, finishedWork, committedLanes );
            break;
        }
    }
}

export function commitLayoutEffects( finishedWork: Fiber, root: FiberRoot, committedLanes: Lanes ): void {
    inProgressLanes = committedLanes;
    inProgressRoot = root;
    const current = finishedWork.alternate;
    commitLayoutEffectOnFiber( root, current, finishedWork, committedLanes );
    inProgressLanes = null;
    inProgressRoot = null;
}

function recursivelyTraverseLayoutEffects( root: FiberRoot, parentFiber: Fiber, lanes: Lanes ) {
    const prevDebugFiber = getCurrentDebugFiberInDEV();

    if ( parentFiber.subtreeFlags & FiberFlags.LayoutMask ) {
        let child = parentFiber.child;

        while ( child !== null ) {
            setCurrentDebugFiberInDEV( child );
            const current = child.alternate;
            commitLayoutEffectOnFiber( root, current, child, lanes );
            child = child.sibling;
        }
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

export function recursivelyTraverseDisappearLayoutEffects( parentFiber: Fiber ) {
    // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
    let child = parentFiber.child;

    while ( child !== null ) {
        disappearLayoutEffects( child );
        child = child.sibling;
    }
}

function recursivelyTraverseReappearLayoutEffects( finishedRoot: FiberRoot, parentFiber: Fiber, includeWorkInProgressEffects: boolean ) {
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    const childShouldIncludeWorkInProgressEffects =
        includeWorkInProgressEffects && ( parentFiber.subtreeFlags & FiberFlags.LayoutMask ) !== FiberFlags.NoFlags;
    // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
    const prevDebugFiber = getCurrentDebugFiberInDEV();
    let child = parentFiber.child;

    while ( child !== null ) {
        const current = child.alternate;
        reappearLayoutEffects( finishedRoot, current, child, childShouldIncludeWorkInProgressEffects );
        child = child.sibling;
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

function commitReconciliationEffects( finishedWork: Fiber ) {
    // Placement effects (insertions, reorders) can be scheduled on any fiber
    // type. They needs to happen after the children effects have fired, but
    // before the effects on this fiber have fired.
    const flags = finishedWork.flags;

    if ( flags & FiberFlags.Placement ) {
        try {
            commitPlacement( finishedWork );
        } catch ( error ) {
            captureCommitPhaseError( finishedWork, finishedWork.return, error );
        }

        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.
        finishedWork.flags &= ~FiberFlags.Placement;
    }

    if ( flags & FiberFlags.Hydrating ) {
        finishedWork.flags &= ~FiberFlags.Hydrating;
    }
}

export function disappearLayoutEffects( finishedWork: Fiber ) {
    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.MemoComponent:
        case WorkTag.SimpleMemoComponent: {
            // TODO (Offscreen) Check: flags & LayoutStatic
            if ( shouldProfile( finishedWork ) ) {
                try {
                    startLayoutEffectTimer();
                    commitHookEffectListUnmount( HookFlags.Layout, finishedWork, finishedWork.return );
                } finally {
                    recordLayoutEffectDuration( finishedWork );
                }
            } else {
                commitHookEffectListUnmount( HookFlags.Layout, finishedWork, finishedWork.return );
            }

            recursivelyTraverseDisappearLayoutEffects( finishedWork );
            break;
        }

        case WorkTag.ClassComponent: {
            // TODO (Offscreen) Check: flags & FiberFlags.RefStatic
            safelyDetachRef( finishedWork, finishedWork.return );
            const instance = finishedWork.stateNode;

            if ( typeof instance.componentWillUnmount === "function" ) {
                safelyCallComponentWillUnmount( finishedWork, finishedWork.return, instance );
            }

            recursivelyTraverseDisappearLayoutEffects( finishedWork );
            break;
        }

        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent: {
            // TODO (Offscreen) Check: flags & FiberFlags.RefStatic
            safelyDetachRef( finishedWork, finishedWork.return );
            recursivelyTraverseDisappearLayoutEffects( finishedWork );
            break;
        }

        case WorkTag.OffscreenComponent: {
            // TODO (Offscreen) Check: flags & FiberFlags.RefStatic
            safelyDetachRef( finishedWork, finishedWork.return );
            const isHidden = finishedWork.memoizedState !== null;

            if ( isHidden ) {// Nested Offscreen tree is already hidden. Don't disappear
                // its effects.
            } else {
                recursivelyTraverseDisappearLayoutEffects( finishedWork );
            }

            break;
        }

        default: {
            recursivelyTraverseDisappearLayoutEffects( finishedWork );
            break;
        }
    }
}

export function reappearLayoutEffects( finishedRoot: FiberRoot, current: Fiber | null, finishedWork: Fiber, // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    includeWorkInProgressEffects: boolean ) {
    // Turn on layout effects in a tree that previously disappeared.
    const flags = finishedWork.flags;

    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );
            // TODO: Check flags & LayoutStatic
            commitHookLayoutEffects( finishedWork, HookFlags.Layout );
            break;
        }

        case WorkTag.ClassComponent: {
            recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );
            // TODO: Check for LayoutStatic flag
            const instance = finishedWork.stateNode;

            if ( typeof instance.componentDidMount === "function" ) {
                try {
                    instance.componentDidMount();
                } catch ( error ) {
                    captureCommitPhaseError( finishedWork, finishedWork.return, error );
                }
            }

            // Commit any callbacks that would have fired while the component
            // was hidden.
            const updateQueue: FiberUpdateQueue<unknown> | null = ( finishedWork.updateQueue as any );

            if ( updateQueue !== null ) {
                commitHiddenCallbacks( updateQueue, instance );
            }

            // If this is newly finished work, check for setState callbacks
            if ( includeWorkInProgressEffects && flags & FiberFlags.Callback ) {
                commitClassCallbacks( finishedWork );
            }

            // TODO: Check flags & RefStatic
            safelyAttachRef( finishedWork, finishedWork.return );
            break;
        }

        // Unlike commitLayoutEffectsOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case WorkTag.HostRoot: {
        //  ...
        // }
        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent: {
            recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );

            // Renderers may schedule work to be done after host components are mounted
            // (eg DOM renderer may schedule auto-focus for inputs and form controls).
            // These effects should only be committed when components are first mounted,
            // aka when there is no current/alternate.
            if ( includeWorkInProgressEffects && current === null && flags & FiberFlags.Update ) {
                commitHostComponentMount( finishedWork );
            }

            // TODO: Check flags & Ref
            safelyAttachRef( finishedWork, finishedWork.return );
            break;
        }

        case WorkTag.Profiler: {
            recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );

            // TODO: Figure out how Profiler updates should work with Offscreen
            if ( includeWorkInProgressEffects && flags & FiberFlags.Update ) {
                commitProfilerUpdate( finishedWork, current );
            }

            break;
        }

        case WorkTag.SuspenseComponent: {
            recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );

            // TODO: Figure out how Suspense hydration callbacks should work
            // with Offscreen.
            if ( includeWorkInProgressEffects && flags & FiberFlags.Update ) {
                commitSuspenseHydrationCallbacks( finishedRoot, finishedWork );
            }

            break;
        }

        case WorkTag.OffscreenComponent: {
            const offscreenState: OffscreenState = finishedWork.memoizedState;
            const isHidden = offscreenState !== null;

            if ( isHidden ) {// Nested Offscreen tree is still hidden. Don't re-appear its effects.
            } else {
                recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );
            }

            // TODO: Check flags & Ref
            safelyAttachRef( finishedWork, finishedWork.return );
            break;
        }

        default: {
            recursivelyTraverseReappearLayoutEffects( finishedRoot, finishedWork, includeWorkInProgressEffects );
            break;
        }
    }
}
