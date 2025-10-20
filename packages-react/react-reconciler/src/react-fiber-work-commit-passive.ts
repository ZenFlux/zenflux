import {
    enableCache,
    enableLegacyHidden,
    enableProfilerCommitHooks,
    enableProfilerNestedUpdatePhase,
    enableProfilerTimer,
    enableTransitionTracing
} from "@zenflux/react-shared/src/react-feature-flags";

import { OffscreenPassiveEffectsConnected } from "@zenflux/react-shared/src/react-internal-constants/offscreen";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";
import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";
import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";
import { TracingMarkerTag } from "@zenflux/react-shared/src/react-internal-constants/transition";

import { shouldProfile } from "@zenflux/react-reconciler/src/react-fiber-commit-work";

import {
    clearNextEffect,
    getNextEffectSafe,
    hasNextEffect,
    setNextEffect
} from "@zenflux/react-reconciler/src/react-fiber-commit-next-effect";

import { hasExecutionCommitContext } from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import {
    getCommitTime,
    isCurrentUpdateNested,
    recordPassiveEffectDuration,
    startPassiveEffectTimer
} from "@zenflux/react-reconciler/src/react-profile-timer";

import {
    getCurrentFiber as getCurrentDebugFiberInDEV,
    resetCurrentFiber as resetCurrentDebugFiberInDEV,
    setCurrentFiber as setCurrentDebugFiberInDEV
} from "@zenflux/react-reconciler/src/react-current-fiber";

import { releaseCache, retainCache } from "@zenflux/react-reconciler/src/react-fiber-cache-component";
import {
    addMarkerCompleteCallbackToPendingTransition,
    addMarkerIncompleteCallbackToPendingTransition,
    addMarkerProgressCallbackToPendingTransition,
    addTransitionCompleteCallbackToPendingTransition,
    addTransitionProgressCallbackToPendingTransition,
    addTransitionStartCallbackToPendingTransition
} from "@zenflux/react-reconciler/src/react-fiber-work-current-transaction";
import { clearTransitionsForLanes } from "@zenflux/react-reconciler/src/react-fiber-lane";

import { captureCommitPhaseError } from "@zenflux/react-reconciler/src/react-fiber-commit-phase-error";
import {
    commitHookEffectListMount,
    commitHookEffectListUnmount
} from "@zenflux/react-reconciler/src/react-fiber-commit-hook-effect";

import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { Instance } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

import type { Cache, Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

import type {
    OffscreenInstance,
    OffscreenQueue,
    OffscreenState
} from "@zenflux/react-shared/src/react-internal-types/offscreen";
import type { Transition, TransitionAbort } from "@zenflux/react-shared/src/react-internal-types/transition";
import type { TracingMarkerInstance } from "@zenflux/react-shared/src/react-internal-types/tracing";

const {
    detachDeletedInstance
} = globalThis.__RECONCILER__CONFIG__;

function commitTransitionProgress( offscreenFiber: Fiber ) {
    if ( enableTransitionTracing ) {
        // This function adds suspense boundaries to the root
        // or tracing marker's pendingBoundaries map.
        // When a suspense boundary goes from a resolved to a fallback
        // state we add the boundary to the map, and when it goes from
        // a fallback to a resolved state, we remove the boundary from
        // the map.
        // We use stateNode on the Offscreen component as a stable object
        // that doesnt change from render to render. This way we can
        // distinguish between different Offscreen instances (vs. the same
        // Offscreen instance with different fibers)
        const offscreenInstance: OffscreenInstance = offscreenFiber.stateNode;
        let prevState: SuspenseState | null = null;
        const previousFiber = offscreenFiber.alternate;

        if ( previousFiber !== null && previousFiber.memoizedState !== null ) {
            prevState = previousFiber.memoizedState;
        }

        const nextState: SuspenseState | null = offscreenFiber.memoizedState;
        const wasHidden = prevState !== null;
        const isHidden = nextState !== null;
        const pendingMarkers = offscreenInstance._pendingMarkers;
        // If there is a name on the suspense boundary, store that in
        // the pending boundaries.
        let name: any = null;
        const parent = offscreenFiber.return;

        if ( parent !== null && parent.tag === WorkTag.SuspenseComponent && parent.memoizedProps.unstable_name ) {
            name = parent.memoizedProps.unstable_name;
        }

        if ( ! wasHidden && isHidden ) {
            // The suspense boundaries was just hidden. Add the boundary
            // to the pending boundary set if it's there
            if ( pendingMarkers !== null ) {
                pendingMarkers.forEach( markerInstance => {
                    const pendingBoundaries = markerInstance.pendingBoundaries;
                    const transitions = markerInstance.transitions;
                    const markerName = markerInstance.name;

                    if ( pendingBoundaries !== null && ! pendingBoundaries.has( offscreenInstance ) ) {
                        pendingBoundaries.set( offscreenInstance, {
                            name
                        } );

                        if ( transitions !== null ) {
                            if ( markerInstance.tag === TracingMarkerTag.TransitionTracingMarker && markerName !== null ) {
                                addMarkerProgressCallbackToPendingTransition( markerName, transitions, pendingBoundaries );
                            } else if ( markerInstance.tag === TracingMarkerTag.TransitionRoot ) {
                                transitions.forEach( transition => {
                                    addTransitionProgressCallbackToPendingTransition( transition, pendingBoundaries );
                                } );
                            }
                        }
                    }
                } );
            }
        } else if ( wasHidden && ! isHidden ) {
            // The suspense boundary went from hidden to visible. Remove
            // the boundary from the pending suspense boundaries set
            // if it's there
            if ( pendingMarkers !== null ) {
                pendingMarkers.forEach( markerInstance => {
                    const pendingBoundaries = markerInstance.pendingBoundaries;
                    const transitions = markerInstance.transitions;
                    const markerName = markerInstance.name;

                    if ( pendingBoundaries !== null && pendingBoundaries.has( offscreenInstance ) ) {
                        pendingBoundaries.delete( offscreenInstance );

                        if ( transitions !== null ) {
                            if ( markerInstance.tag === TracingMarkerTag.TransitionTracingMarker && markerName !== null ) {
                                addMarkerProgressCallbackToPendingTransition( markerName, transitions, pendingBoundaries );

                                // If there are no more unresolved suspense boundaries, the interaction
                                // is considered finished
                                if ( pendingBoundaries.size === 0 ) {
                                    if ( markerInstance.aborts === null ) {
                                        addMarkerCompleteCallbackToPendingTransition( markerName, transitions );
                                    }

                                    markerInstance.transitions = null;
                                    markerInstance.pendingBoundaries = null;
                                    markerInstance.aborts = null;
                                }
                            } else if ( markerInstance.tag === TracingMarkerTag.TransitionRoot ) {
                                transitions.forEach( transition => {
                                    addTransitionProgressCallbackToPendingTransition( transition, pendingBoundaries );
                                } );
                            }
                        }
                    }
                } );
            }
        }
    }
}

function commitOffscreenPassiveMountEffects( current: Fiber | null, finishedWork: Fiber, instance: OffscreenInstance ) {
    if ( enableCache ) {
        let previousCache: Cache | null = null;

        if ( current !== null && current.memoizedState !== null && current.memoizedState.cachePool !== null ) {
            previousCache = current.memoizedState.cachePool.pool;
        }

        let nextCache: Cache | null = null;

        if ( finishedWork.memoizedState !== null && finishedWork.memoizedState.cachePool !== null ) {
            nextCache = finishedWork.memoizedState.cachePool.pool;
        }

        // Retain/release the cache used for pending (suspended) nodes.
        // Note that this is only reached in the non-suspended/visible case:
        // when the content is suspended/hidden, the retain/release occurs
        // via the parent Suspense component (see case above).
        if ( nextCache !== previousCache ) {
            if ( nextCache != null ) {
                retainCache( nextCache );
            }

            if ( previousCache != null ) {
                releaseCache( previousCache );
            }
        }
    }

    if ( enableTransitionTracing ) {
        // TODO: Pre-rendering should not be counted as part of a transition. We
        // may add separate logs for pre-rendering, but it's not part of the
        // primary metrics.
        const offscreenState: OffscreenState = finishedWork.memoizedState;
        const queue: OffscreenQueue | null = ( finishedWork.updateQueue as any );
        const isHidden = offscreenState !== null;

        if ( queue !== null ) {
            if ( isHidden ) {
                const transitions = queue.transitions;

                if ( transitions !== null ) {
                    transitions.forEach( transition => {
                        // Add all the transitions saved in the update queue during
                        // the render phase (ie the transitions associated with this boundary)
                        // into the transitions set.
                        if ( instance._transitions === null ) {
                            instance._transitions = new Set();
                        }

                        instance._transitions.add( transition );
                    } );
                }

                const markerInstances = queue.markerInstances;

                if ( markerInstances !== null ) {
                    markerInstances.forEach( markerInstance => {
                        const markerTransitions = markerInstance.transitions;

                        // There should only be a few tracing marker transitions because
                        // they should be only associated with the transition that
                        // caused them
                        if ( markerTransitions !== null ) {
                            markerTransitions.forEach( transition => {
                                if ( instance._transitions === null ) {
                                    instance._transitions = new Set();
                                } else if ( instance._transitions.has( transition ) ) {
                                    if ( markerInstance.pendingBoundaries === null ) {
                                        markerInstance.pendingBoundaries = new Map();
                                    }

                                    if ( instance._pendingMarkers === null ) {
                                        instance._pendingMarkers = new Set();
                                    }

                                    instance._pendingMarkers.add( markerInstance );
                                }
                            } );
                        }
                    } );
                }
            }

            finishedWork.updateQueue = null;
        }

        commitTransitionProgress( finishedWork );

        // TODO: Refactor this into an if/else branch
        if ( ! isHidden ) {
            instance._transitions = null;
            instance._pendingMarkers = null;
        }
    }
}

function commitCachePassiveMountEffect( current: Fiber | null, finishedWork: Fiber ) {
    if ( enableCache ) {
        let previousCache: Cache | null = null;

        if ( finishedWork.alternate !== null ) {
            previousCache = finishedWork.alternate.memoizedState.cache;
        }

        const nextCache = finishedWork.memoizedState.cache;

        // Retain/release the cache. In theory the cache component
        // could be "borrowing" a cache instance owned by some parent,
        // in which case we could avoid retaining/releasing. But it
        // is non-trivial to determine when that is the case, so we
        // always retain/release.
        if ( nextCache !== previousCache ) {
            retainCache( nextCache );

            if ( previousCache != null ) {
                releaseCache( previousCache );
            }
        }
    }
}

function recursivelyTraverseAtomicPassiveEffects( finishedRoot: FiberRoot, parentFiber: Fiber, committedLanes: Lanes, committedTransitions: Array<Transition> | null ) {
    // "Atomic" effects are ones that need to fire on every commit, even during
    // pre-rendering. We call this function when traversing a hidden tree whose
    // regular effects are currently disconnected.
    const prevDebugFiber = getCurrentDebugFiberInDEV();

    // TODO: Add special flag for atomic effects
    if ( parentFiber.subtreeFlags & FiberFlags.PassiveMask ) {
        let child = parentFiber.child;

        while ( child !== null ) {
            setCurrentDebugFiberInDEV( child );
            commitAtomicPassiveEffects( finishedRoot, child, committedLanes, committedTransitions );
            child = child.sibling;
        }
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

function commitAtomicPassiveEffects( finishedRoot: FiberRoot, finishedWork: Fiber, committedLanes: Lanes, committedTransitions: Array<Transition> | null ) {
    // "Atomic" effects are ones that need to fire on every commit, even during
    // pre-rendering. We call this function when traversing a hidden tree whose
    // regular effects are currently disconnected.
    const flags = finishedWork.flags;

    switch ( finishedWork.tag ) {
        case WorkTag.OffscreenComponent: {
            recursivelyTraverseAtomicPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );

            if ( flags & FiberFlags.Passive ) {
                // TODO: Pass `current` as argument to this function
                const current = finishedWork.alternate;
                const instance: OffscreenInstance = finishedWork.stateNode;
                commitOffscreenPassiveMountEffects( current, finishedWork, instance );
            }

            break;
        }

        case WorkTag.CacheComponent: {
            recursivelyTraverseAtomicPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );

            if ( flags & FiberFlags.Passive ) {
                // TODO: Pass `current` as argument to this function
                const current = finishedWork.alternate;
                commitCachePassiveMountEffect( current, finishedWork );
            }

            break;
        }

        default: {
            recursivelyTraverseAtomicPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );
            break;
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abortRootTransitions( root: FiberRoot, abort: TransitionAbort, deletedTransitions: Set<Transition>, deletedOffscreenInstance: OffscreenInstance | null, isInDeletedTree: boolean ) {
    if ( enableTransitionTracing ) {
        const rootTransitions = root.incompleteTransitions;
        deletedTransitions.forEach( transition => {
            if ( rootTransitions.has( transition ) ) {
                const transitionInstance: TracingMarkerInstance = ( rootTransitions.get( transition ) as any );

                if ( transitionInstance.aborts === null ) {
                    transitionInstance.aborts = [];
                }

                transitionInstance.aborts.push( abort );

                if ( deletedOffscreenInstance !== null ) {
                    if ( transitionInstance.pendingBoundaries !== null && transitionInstance.pendingBoundaries.has( deletedOffscreenInstance ) ) {
                        // $FlowFixMe[incompatible-use] found when upgrading Flow
                        transitionInstance.pendingBoundaries.delete( deletedOffscreenInstance );
                    }
                }
            }
        } );
    }
}

function abortTracingMarkerTransitions( abortedFiber: Fiber, abort: TransitionAbort, deletedTransitions: Set<Transition>, deletedOffscreenInstance: OffscreenInstance | null, isInDeletedTree: boolean ) {
    if ( enableTransitionTracing ) {
        const markerInstance: TracingMarkerInstance = abortedFiber.stateNode;
        const markerTransitions = markerInstance.transitions;
        const pendingBoundaries = markerInstance.pendingBoundaries;

        if ( markerTransitions !== null ) {
            // TODO: Refactor this code. Is there a way to move this code to
            // the deletions phase instead of calculating it here while making sure
            // complete is called appropriately?
            deletedTransitions.forEach( transition => {
                // If one of the transitions on the tracing marker is a transition
                // that was in an aborted subtree, we will abort that tracing marker
                if ( abortedFiber !== null && markerTransitions.has( transition ) && ( markerInstance.aborts === null || ! markerInstance.aborts.includes( abort ) ) ) {
                    if ( markerInstance.transitions !== null ) {
                        if ( markerInstance.aborts === null ) {
                            markerInstance.aborts = [ abort ];
                            addMarkerIncompleteCallbackToPendingTransition( abortedFiber.memoizedProps.name, markerInstance.transitions, markerInstance.aborts );
                        } else {
                            markerInstance.aborts.push( abort );
                        }

                        // We only want to call onTransitionProgress when the marker hasn't been
                        // deleted
                        if ( deletedOffscreenInstance !== null && ! isInDeletedTree && pendingBoundaries !== null && pendingBoundaries.has( deletedOffscreenInstance ) ) {
                            pendingBoundaries.delete( deletedOffscreenInstance );
                            addMarkerProgressCallbackToPendingTransition( abortedFiber.memoizedProps.name, deletedTransitions, pendingBoundaries );
                        }
                    }
                }
            } );
        }
    }
}

function abortParentMarkerTransitionsForDeletedFiber( abortedFiber: Fiber, abort: TransitionAbort, deletedTransitions: Set<Transition>, deletedOffscreenInstance: OffscreenInstance | null, isInDeletedTree: boolean ) {
    if ( enableTransitionTracing ) {
        // Find all pending markers that are waiting on child suspense boundaries in the
        // aborted subtree and cancels them
        let fiber: null | Fiber = abortedFiber;

        while ( fiber !== null ) {
            switch ( fiber.tag ) {
                case WorkTag.TracingMarkerComponent:
                    abortTracingMarkerTransitions( fiber, abort, deletedTransitions, deletedOffscreenInstance, isInDeletedTree );
                    break;

                case WorkTag.HostRoot:
                    const root = fiber.stateNode;
                    abortRootTransitions( root, abort, deletedTransitions, deletedOffscreenInstance, isInDeletedTree );
                    break;

                default:
                    break;
            }

            fiber = fiber.return;
        }
    }
}

function detachFiberAfterEffects( fiber: Fiber ) {
    const alternate = fiber.alternate;

    if ( alternate !== null ) {
        fiber.alternate = null;
        detachFiberAfterEffects( alternate );
    }

    // Clear cyclical Fiber fields. This level alone is designed to roughly
    // approximate the planned Fiber refactor. In that world, `setState` will be
    // bound to a special "instance" object instead of a Fiber. The Instance
    // object will not have any of these fields. It will only be connected to
    // the fiber tree via a single link at the root. So if this level alone is
    // sufficient to fix memory issues, that bodes well for our plans.
    fiber.child = null;
    fiber.deletions = null;
    fiber.sibling = null;

    // The `stateNode` is cyclical because on host nodes it points to the host
    // tree, which has its own pointers to children, parents, and siblings.
    // The other host nodes also point back to fibers, so we should detach that
    // one, too.
    if ( fiber.tag === WorkTag.HostComponent ) {
        const hostInstance: Instance = fiber.stateNode;

        if ( hostInstance !== null ) {
            detachDeletedInstance( hostInstance );
        }
    }

    fiber.stateNode = null;

    if ( __DEV__ ) {
        fiber._debugSource = null;
        fiber._debugOwner = null;
    }

    // Theoretically, nothing in here should be necessary, because we already
    // disconnected the fiber from the tree. So even if something leaks this
    // particular fiber, it won't leak anything else.
    fiber.return = null;
    fiber.dependencies = null;
    fiber.memoizedProps = null;
    fiber.memoizedState = null;
    fiber.pendingProps = null;
    fiber.stateNode = null;
    // TODO: Move to `commitPassiveUnmountInsideDeletedTreeOnFiber` instead.
    fiber.updateQueue = null;
}

function detachAlternateSiblings( parentFiber: Fiber ) {
    // A fiber was deleted from this parent fiber, but it's still part of the
    // previous (alternate) parent fiber's list of children. Because children
    // are a linked list, an earlier sibling that's still alive will be
    // connected to the deleted fiber via its `alternate`:
    //
    //   live fiber --alternate--> previous live fiber --sibling--> deleted
    //   fiber
    //
    // We can't disconnect `alternate` on nodes that haven't been deleted yet,
    // but we can disconnect the `sibling` and `child` pointers.
    const previousFiber = parentFiber.alternate;

    if ( previousFiber !== null ) {
        let detachedChild = previousFiber.child;

        if ( detachedChild !== null ) {
            previousFiber.child = null;

            do {
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                const detachedSibling: Fiber | null = detachedChild.sibling;
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                detachedChild.sibling = null;
                detachedChild = detachedSibling;
            } while ( detachedChild !== null );
        }
    }
}

function commitHookPassiveUnmountEffects( finishedWork: Fiber, nearestMountedAncestor: null | Fiber, hookFlags: HookFlags ) {
    if ( shouldProfile( finishedWork ) ) {
        startPassiveEffectTimer();
        commitHookEffectListUnmount( hookFlags, finishedWork, nearestMountedAncestor );
        recordPassiveEffectDuration( finishedWork );
    } else {
        commitHookEffectListUnmount( hookFlags, finishedWork, nearestMountedAncestor );
    }
}

function commitPassiveUnmountOnFiber( finishedWork: Fiber ): void {
    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            recursivelyTraversePassiveUnmountEffects( finishedWork );

            if ( finishedWork.flags & FiberFlags.Passive ) {
                commitHookPassiveUnmountEffects( finishedWork, finishedWork.return, HookFlags.Passive | HookFlags.HasEffect );
            }

            break;
        }

        case WorkTag.OffscreenComponent: {
            const instance: OffscreenInstance = finishedWork.stateNode;
            const nextState: OffscreenState | null = finishedWork.memoizedState;
            const isHidden = nextState !== null;

            if ( isHidden && instance._visibility & OffscreenPassiveEffectsConnected && ( // For backwards compatibility, don't unmount when a tree suspends. In
                // the future we may change this to unmount after a delay.
                finishedWork.return === null || finishedWork.return.tag !== WorkTag.SuspenseComponent ) ) {
                // The effects are currently connected. Disconnect them.
                // TODO: Add option or heuristic to delay before disconnecting the
                // effects. Then if the tree reappears before the delay has elapsed, we
                // can skip toggling the effects entirely.
                instance._visibility &= ~OffscreenPassiveEffectsConnected;
                recursivelyTraverseDisconnectPassiveEffects( finishedWork );
            } else {
                recursivelyTraversePassiveUnmountEffects( finishedWork );
            }

            break;
        }

        default: {
            recursivelyTraversePassiveUnmountEffects( finishedWork );
            break;
        }
    }
}

function commitPassiveMountOnFiber( finishedRoot: FiberRoot, finishedWork: Fiber, committedLanes: Lanes, committedTransitions: Array<Transition> | null ): void {
    // When updating this function, also update reconnectPassiveEffects, which does
    // most of the same things when an offscreen tree goes from hidden -> visible,
    // or when toggling effects inside a hidden tree.
    const flags = finishedWork.flags;

    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );

            if ( flags & FiberFlags.Passive ) {
                commitHookPassiveMountEffects( finishedWork, HookFlags.Passive | HookFlags.HasEffect );
            }

            break;
        }

        case WorkTag.HostRoot: {
            recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );

            if ( flags & FiberFlags.Passive ) {
                if ( enableCache ) {
                    let previousCache: Cache | null = null;

                    if ( finishedWork.alternate !== null ) {
                        previousCache = finishedWork.alternate.memoizedState.cache;
                    }

                    const nextCache = finishedWork.memoizedState.cache;

                    // Retain/release the root cache.
                    // Note that on initial mount, previousCache and nextCache will be the same
                    // and this retain won't occur. To counter this, we instead retain the HostRoot's
                    // initial cache when creating the root itself (see createFiberRoot() in
                    // ReactFiberRoot.js). Subsequent updates that change the cache are reflected
                    // here, such that previous/next caches are retained correctly.
                    if ( nextCache !== previousCache ) {
                        retainCache( nextCache );

                        if ( previousCache != null ) {
                            releaseCache( previousCache );
                        }
                    }
                }

                if ( enableTransitionTracing ) {
                    // Get the transitions that were initiatized during the render
                    // and add a start transition callback for each of them
                    const root: FiberRoot = finishedWork.stateNode;
                    const incompleteTransitions = root.incompleteTransitions;

                    // Initial render
                    if ( committedTransitions !== null ) {
                        committedTransitions.forEach( transition => {
                            addTransitionStartCallbackToPendingTransition( transition );
                        } );
                        clearTransitionsForLanes( finishedRoot, committedLanes );
                    }

                    incompleteTransitions.forEach( ( markerInstance, transition ) => {
                        const pendingBoundaries = markerInstance.pendingBoundaries;

                        if ( pendingBoundaries === null || pendingBoundaries.size === 0 ) {
                            if ( markerInstance.aborts === null ) {
                                addTransitionCompleteCallbackToPendingTransition( transition );
                            }

                            incompleteTransitions.delete( transition );
                        }
                    } );
                    clearTransitionsForLanes( finishedRoot, committedLanes );
                }
            }

            break;
        }

        case WorkTag.LegacyHiddenComponent: {
            if ( enableLegacyHidden ) {
                recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );

                if ( flags & FiberFlags.Passive ) {
                    const current = finishedWork.alternate;
                    const instance: OffscreenInstance = finishedWork.stateNode;
                    commitOffscreenPassiveMountEffects( current, finishedWork, instance );
                }
            }

            break;
        }

        case WorkTag.OffscreenComponent: {
            // TODO: Pass `current` as argument to this function
            const instance: OffscreenInstance = finishedWork.stateNode;
            const nextState: OffscreenState | null = finishedWork.memoizedState;
            const isHidden = nextState !== null;

            if ( isHidden ) {
                if ( instance._visibility & OffscreenPassiveEffectsConnected ) {
                    // The effects are currently connected. Update them.
                    recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );
                } else {
                    if ( finishedWork.mode & TypeOfMode.ConcurrentMode ) {
                        // The effects are currently disconnected. Since the tree is hidden,
                        // don't connect them. This also applies to the initial render.
                        if ( enableCache || enableTransitionTracing ) {
                            // "Atomic" effects are ones that need to fire on every commit,
                            // even during pre-rendering. An example is updating the reference
                            // count on cache instances.
                            recursivelyTraverseAtomicPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );
                        }
                    } else {
                        // Legacy Mode: Fire the effects even if the tree is hidden.
                        instance._visibility |= OffscreenPassiveEffectsConnected;
                        recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );
                    }
                }
            } else {
                // Tree is visible
                if ( instance._visibility & OffscreenPassiveEffectsConnected ) {
                    // The effects are currently connected. Update them.
                    recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );
                } else {
                    // The effects are currently disconnected. Reconnect them, while also
                    // firing effects inside newly mounted trees. This also applies to
                    // the initial render.
                    instance._visibility |= OffscreenPassiveEffectsConnected;
                    const includeWorkInProgressEffects = ( finishedWork.subtreeFlags & FiberFlags.PassiveMask ) !== FiberFlags.NoFlags;
                    recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );
                }
            }

            if ( flags & FiberFlags.Passive ) {
                const current = finishedWork.alternate;
                commitOffscreenPassiveMountEffects( current, finishedWork, instance );
            }

            break;
        }

        case WorkTag.CacheComponent: {
            recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );

            if ( flags & FiberFlags.Passive ) {
                // TODO: Pass `current` as argument to this function
                const current = finishedWork.alternate;
                commitCachePassiveMountEffect( current, finishedWork );
            }

            break;
        }

        case WorkTag.TracingMarkerComponent: {
            if ( enableTransitionTracing ) {
                recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );

                if ( flags & FiberFlags.Passive ) {
                    commitTracingMarkerPassiveMountEffect( finishedWork );
                }

                break;
            } // Intentional fallthrough to next branch

        }

        default: {
            recursivelyTraversePassiveMountEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );
            break;
        }
    }
}

function commitPassiveUnmountEffectsInsideOfDeletedTree_begin( deletedSubtreeRoot: Fiber, nearestMountedAncestor: Fiber | null ) {
    while ( hasNextEffect() ) {
        const fiber = getNextEffectSafe();
        // Deletion effects fire in parent -> child order
        // TODO: Check if fiber has a PassiveStatic flag
        setCurrentDebugFiberInDEV( fiber );
        commitPassiveUnmountInsideDeletedTreeOnFiber( fiber, nearestMountedAncestor );
        resetCurrentDebugFiberInDEV();
        const child = fiber.child;

        // TODO: Only traverse subtree if it has a PassiveStatic flag.
        if ( child !== null ) {
            child.return = fiber;
            setNextEffect( child );
        } else {
            commitPassiveUnmountEffectsInsideOfDeletedTree_complete( deletedSubtreeRoot );
        }
    }
}

function commitPassiveUnmountEffectsInsideOfDeletedTree_complete( deletedSubtreeRoot: Fiber ) {
    while ( hasNextEffect() ) {
        const fiber = getNextEffectSafe();
        const sibling = fiber.sibling;
        const returnFiber = fiber.return;
        // Recursively traverse the entire deleted tree and clean up fiber fields.
        // This is more aggressive than ideal, and the long term goal is to only
        // have to detach the deleted tree at the root.
        detachFiberAfterEffects( fiber );

        if ( fiber === deletedSubtreeRoot ) {
            return clearNextEffect();
        }

        if ( sibling !== null ) {
            sibling.return = returnFiber;

            return setNextEffect( sibling );
        }

        setNextEffect( returnFiber );
    }
}

function commitPassiveUnmountInsideDeletedTreeOnFiber( current: Fiber, nearestMountedAncestor: Fiber | null ): void {
    switch ( current.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            commitHookPassiveUnmountEffects(
                current,
                nearestMountedAncestor,
                HookFlags.Passive
            );
            break;
        }

        // TODO: run passive unmount effects when unmounting a root.
        // Because passive unmount effects are not currently run,
        // the cache instance owned by the root will never be freed.
        // When effects are run, the cache should be freed here:
        // case WorkTag.HostRoot: {
        //   if (enableCache) {
        //     const cache = current.memoizedState.cache;
        //     releaseCache(cache);
        //   }
        //   break;
        // }
        case WorkTag.LegacyHiddenComponent:
        case WorkTag.OffscreenComponent: {
            if ( enableCache ) {
                if ( current.memoizedState !== null && current.memoizedState.cachePool !== null ) {
                    const cache: Cache = current.memoizedState.cachePool.pool;

                    // Retain/release the cache used for pending (suspended) nodes.
                    // Note that this is only reached in the non-suspended/visible case:
                    // when the content is suspended/hidden, the retain/release occurs
                    // via the parent Suspense component (see case above).
                    if ( cache != null ) {
                        retainCache( cache );
                    }
                }
            }

            break;
        }

        case WorkTag.SuspenseComponent: {
            if ( enableTransitionTracing ) {
                // We need to mark this fiber's parents as deleted
                const offscreenFiber: Fiber = ( current.child as any );
                const instance: OffscreenInstance = offscreenFiber.stateNode;
                const transitions = instance._transitions;

                if ( transitions !== null ) {
                    const abortReason: TransitionAbort = {
                        reason: "suspense",
                        name: current.memoizedProps.unstable_name || null
                    };

                    if ( current.memoizedState === null || current.memoizedState.dehydrated === null ) {
                        abortParentMarkerTransitionsForDeletedFiber(
                            offscreenFiber,
                            abortReason,
                            transitions,
                            instance,
                            true
                        );

                        if ( nearestMountedAncestor !== null ) {
                            abortParentMarkerTransitionsForDeletedFiber(
                                nearestMountedAncestor,
                                abortReason,
                                transitions,
                                instance,
                                false
                            );
                        }
                    }
                }
            }

            break;
        }

        case WorkTag.CacheComponent: {
            if ( enableCache ) {
                const cache = current.memoizedState.cache;
                releaseCache( cache );
            }

            break;
        }

        case WorkTag.TracingMarkerComponent: {
            if ( enableTransitionTracing ) {
                // We need to mark this fiber's parents as deleted
                const instance: TracingMarkerInstance = current.stateNode;
                const transitions = instance.transitions;

                if ( transitions !== null ) {
                    const abortReason: TransitionAbort = {
                        reason: "marker",
                        name: current.memoizedProps.name
                    };
                    abortParentMarkerTransitionsForDeletedFiber(
                        current,
                        abortReason,
                        transitions,
                        null,
                        true
                    );

                    if ( nearestMountedAncestor !== null ) {
                        abortParentMarkerTransitionsForDeletedFiber(
                            nearestMountedAncestor, abortReason,
                            transitions,
                            null,
                            false
                        );
                    }
                }
            }

            break;
        }
    }
}

function commitTracingMarkerPassiveMountEffect( finishedWork: Fiber ) {
    // Get the transitions that were initiatized during the render
    // and add a start transition callback for each of them
    // We will only call this on initial mount of the tracing marker
    // only if there are no suspense children
    const instance = finishedWork.stateNode;

    if ( instance.transitions !== null && instance.pendingBoundaries === null ) {
        addMarkerCompleteCallbackToPendingTransition( finishedWork.memoizedProps.name, instance.transitions );
        instance.transitions = null;
        instance.pendingBoundaries = null;
        instance.aborts = null;
        instance.name = null;
    }
}

function recursivelyTraverseDisconnectPassiveEffects( parentFiber: Fiber ): void {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects have fired.
    const deletions = parentFiber.deletions;

    if ( ( parentFiber.flags & FiberFlags.ChildDeletion ) !== FiberFlags.NoFlags ) {
        if ( deletions !== null ) {
            for ( let i = 0 ; i < deletions.length ; i++ ) {
                const childToDelete = deletions[ i ];
                // TODO: Convert this to use recursion
                setNextEffect( childToDelete );
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin( childToDelete, parentFiber );
            }
        }

        detachAlternateSiblings( parentFiber );
    }

    const prevDebugFiber = getCurrentDebugFiberInDEV();
    // TODO: Check PassiveStatic flag
    let child = parentFiber.child;

    while ( child !== null ) {
        setCurrentDebugFiberInDEV( child );
        disconnectPassiveEffect( child );
        child = child.sibling;
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

function recursivelyTraversePassiveMountEffects( root: FiberRoot, parentFiber: Fiber, committedLanes: Lanes, committedTransitions: Array<Transition> | null ) {
    const prevDebugFiber = getCurrentDebugFiberInDEV();

    if ( parentFiber.subtreeFlags & FiberFlags.PassiveMask ) {
        let child = parentFiber.child;

        while ( child !== null ) {
            setCurrentDebugFiberInDEV( child );
            commitPassiveMountOnFiber( root, child, committedLanes, committedTransitions );
            child = child.sibling;
        }
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

function recursivelyTraversePassiveUnmountEffects( parentFiber: Fiber ): void {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects have fired.
    const deletions = parentFiber.deletions;

    if ( ( parentFiber.flags & FiberFlags.ChildDeletion ) !== FiberFlags.NoFlags ) {
        if ( deletions !== null ) {
            for ( let i = 0 ; i < deletions.length ; i++ ) {
                const childToDelete = deletions[ i ];
                // TODO: Convert this to use recursion
                setNextEffect( childToDelete );
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin( childToDelete, parentFiber );
            }
        }

        detachAlternateSiblings( parentFiber );
    }

    const prevDebugFiber = getCurrentDebugFiberInDEV();

    // TODO: Split PassiveMask into separate masks for mount and unmount?
    if ( parentFiber.subtreeFlags & FiberFlags.PassiveMask ) {
        let child = parentFiber.child;

        while ( child !== null ) {
            setCurrentDebugFiberInDEV( child );
            commitPassiveUnmountOnFiber( child );
            child = child.sibling;
        }
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

function recursivelyTraverseReconnectPassiveEffects( finishedRoot: FiberRoot, parentFiber: Fiber, committedLanes: Lanes, committedTransitions: Array<Transition> | null, includeWorkInProgressEffects: boolean ) {
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    const childShouldIncludeWorkInProgressEffects =
        includeWorkInProgressEffects && ( parentFiber.subtreeFlags & FiberFlags.PassiveMask ) !== FiberFlags.NoFlags;

    // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
    const prevDebugFiber = getCurrentDebugFiberInDEV();
    let child = parentFiber.child;

    while ( child !== null ) {
        reconnectPassiveEffects( finishedRoot, child, committedLanes, committedTransitions, childShouldIncludeWorkInProgressEffects );
        child = child.sibling;
    }

    setCurrentDebugFiberInDEV( prevDebugFiber );
}

function commitHookPassiveMountEffects( finishedWork: Fiber, hookFlags: HookFlags ) {
    if ( shouldProfile( finishedWork ) ) {
        startPassiveEffectTimer();

        try {
            commitHookEffectListMount( hookFlags, finishedWork );
        } catch ( error ) {
            captureCommitPhaseError( finishedWork, finishedWork.return, error );
        }

        recordPassiveEffectDuration( finishedWork );
    } else {
        try {
            commitHookEffectListMount( hookFlags, finishedWork );
        } catch ( error ) {
            captureCommitPhaseError( finishedWork, finishedWork.return, error );
        }
    }
}

export function commitPassiveEffectDurations( finishedRoot: FiberRoot, finishedWork: Fiber ): void {
    if ( enableProfilerTimer && enableProfilerCommitHooks && hasExecutionCommitContext() ) {
        // Only Profilers with work in their subtree will have an Update effect scheduled.
        if ( ( finishedWork.flags & FiberFlags.Update ) !== FiberFlags.NoFlags ) {
            switch ( finishedWork.tag ) {
                case WorkTag.Profiler: {
                    const {
                        passiveEffectDuration
                    } = finishedWork.stateNode;
                    const {
                        id,
                        onPostCommit
                    } = finishedWork.memoizedProps;
                    // This value will still reflect the previous commit phase.
                    // It does not get reset until the start of the next commit phase.
                    const commitTime = getCommitTime();
                    let phase = finishedWork.alternate === null ? "mount" : "update";

                    if ( enableProfilerNestedUpdatePhase ) {
                        if ( isCurrentUpdateNested() ) {
                            phase = "nested-update";
                        }
                    }

                    if ( typeof onPostCommit === "function" ) {
                        onPostCommit( id, phase, passiveEffectDuration, commitTime );
                    }

                    // Bubble times to the next nearest ancestor Profiler.
                    // After we process that Profiler, we'll bubble further up.
                    let parentFiber = finishedWork.return;

                    outer: while ( parentFiber !== null ) {
                        switch ( parentFiber.tag ) {
                            case WorkTag.HostRoot:
                                const root = parentFiber.stateNode;
                                root.passiveEffectDuration += passiveEffectDuration;
                                break outer;

                            case WorkTag.Profiler:
                                const parentStateNode = parentFiber.stateNode;
                                parentStateNode.passiveEffectDuration += passiveEffectDuration;
                                break outer;
                        }

                        parentFiber = parentFiber.return;
                    }

                    break;
                }

                default:
                    break;
            }
        }
    }
}

export function commitPassiveMountEffects( root: FiberRoot, finishedWork: Fiber, committedLanes: Lanes, committedTransitions: Array<Transition> | null ): void {
    setCurrentDebugFiberInDEV( finishedWork );
    commitPassiveMountOnFiber( root, finishedWork, committedLanes, committedTransitions );
    resetCurrentDebugFiberInDEV();
}

export function disconnectPassiveEffect( finishedWork: Fiber ): void {
    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            // TODO: Check PassiveStatic flag
            commitHookPassiveUnmountEffects( finishedWork, finishedWork.return, HookFlags.Passive );
            // When disconnecting passive effects, we fire the effects in the same
            // order as during a deletiong: parent before child
            recursivelyTraverseDisconnectPassiveEffects( finishedWork );
            break;
        }

        case WorkTag.OffscreenComponent: {
            const instance: OffscreenInstance = finishedWork.stateNode;

            if ( instance._visibility & OffscreenPassiveEffectsConnected ) {
                instance._visibility &= ~OffscreenPassiveEffectsConnected;
                recursivelyTraverseDisconnectPassiveEffects( finishedWork );
            } else {// The effects are already disconnected.
            }

            break;
        }

        default: {
            recursivelyTraverseDisconnectPassiveEffects( finishedWork );
            break;
        }
    }
}

export function reconnectPassiveEffects( finishedRoot: FiberRoot, finishedWork: Fiber, committedLanes: Lanes, committedTransitions: Array<Transition> | null, // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    includeWorkInProgressEffects: boolean ) {
    const flags = finishedWork.flags;

    switch ( finishedWork.tag ) {
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.SimpleMemoComponent: {
            recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );
            // TODO: Check for PassiveStatic flag
            commitHookPassiveMountEffects( finishedWork, HookFlags.Passive );
            break;
        }

        // Unlike commitPassiveMountOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case WorkTag.HostRoot: {
        //  ...
        // }
        case WorkTag.LegacyHiddenComponent: {
            if ( enableLegacyHidden ) {
                recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );

                if ( includeWorkInProgressEffects && flags & FiberFlags.Passive ) {
                    // TODO: Pass `current` as argument to this function
                    const current: Fiber | null = finishedWork.alternate;
                    const instance: OffscreenInstance = finishedWork.stateNode;
                    commitOffscreenPassiveMountEffects( current, finishedWork, instance );
                }
            }

            break;
        }

        case WorkTag.OffscreenComponent: {
            const instance: OffscreenInstance = finishedWork.stateNode;
            const nextState: OffscreenState | null = finishedWork.memoizedState;
            const isHidden = nextState !== null;

            if ( isHidden ) {
                if ( instance._visibility & OffscreenPassiveEffectsConnected ) {
                    // The effects are currently connected. Update them.
                    recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );
                } else {
                    if ( finishedWork.mode & TypeOfMode.ConcurrentMode ) {
                        // The effects are currently disconnected. Since the tree is hidden,
                        // don't connect them. This also applies to the initial render.
                        if ( enableCache || enableTransitionTracing ) {
                            // "Atomic" effects are ones that need to fire on every commit,
                            // even during pre-rendering. An example is updating the reference
                            // count on cache instances.
                            recursivelyTraverseAtomicPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions );
                        }
                    } else {
                        // Legacy Mode: Fire the effects even if the tree is hidden.
                        instance._visibility |= OffscreenPassiveEffectsConnected;
                        recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );
                    }
                }
            } else {
                // Tree is visible
                // Since we're already inside a reconnecting tree, it doesn't matter
                // whether the effects are currently connected. In either case, we'll
                // continue traversing the tree and firing all the effects.
                //
                // We do need to set the "connected" flag on the instance, though.
                instance._visibility |= OffscreenPassiveEffectsConnected;
                recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );
            }

            if ( includeWorkInProgressEffects && flags & FiberFlags.Passive ) {
                // TODO: Pass `current` as argument to this function
                const current: Fiber | null = finishedWork.alternate;
                commitOffscreenPassiveMountEffects( current, finishedWork, instance );
            }

            break;
        }

        case WorkTag.CacheComponent: {
            recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );

            if ( includeWorkInProgressEffects && flags & FiberFlags.Passive ) {
                // TODO: Pass `current` as argument to this function
                const current = finishedWork.alternate;
                commitCachePassiveMountEffect( current, finishedWork );
            }

            break;
        }

        case WorkTag.TracingMarkerComponent: {
            if ( enableTransitionTracing ) {
                recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );

                if ( includeWorkInProgressEffects && flags & FiberFlags.Passive ) {
                    commitTracingMarkerPassiveMountEffect( finishedWork );
                }

                break;
            } // Intentional fallthrough to next branch

        }

        default: {
            recursivelyTraverseReconnectPassiveEffects( finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects );
            break;
        }
    }
}

export function commitPassiveUnmountEffects( finishedWork: Fiber ): void {
    setCurrentDebugFiberInDEV( finishedWork );
    commitPassiveUnmountOnFiber( finishedWork );
    resetCurrentDebugFiberInDEV();
}
