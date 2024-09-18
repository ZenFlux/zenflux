"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitPassiveUnmountEffects = exports.reconnectPassiveEffects = exports.disconnectPassiveEffect = exports.commitPassiveMountEffects = exports.commitPassiveEffectDurations = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var offscreen_1 = require("@zenflux/react-shared/src/react-internal-constants/offscreen");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var transition_1 = require("@zenflux/react-shared/src/react-internal-constants/transition");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var react_fiber_commit_next_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-next-effect");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
var react_fiber_work_current_transaction_1 = require("@zenflux/react-reconciler/src/react-fiber-work-current-transaction");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_commit_phase_error_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-phase-error");
var react_fiber_commit_hook_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-hook-effect");
var detachDeletedInstance = globalThis.__RECONCILER__CONFIG__.detachDeletedInstance;
function commitTransitionProgress(offscreenFiber) {
    if (react_feature_flags_1.enableTransitionTracing) {
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
        var offscreenInstance_1 = offscreenFiber.stateNode;
        var prevState = null;
        var previousFiber = offscreenFiber.alternate;
        if (previousFiber !== null && previousFiber.memoizedState !== null) {
            prevState = previousFiber.memoizedState;
        }
        var nextState = offscreenFiber.memoizedState;
        var wasHidden = prevState !== null;
        var isHidden = nextState !== null;
        var pendingMarkers = offscreenInstance_1._pendingMarkers;
        // If there is a name on the suspense boundary, store that in
        // the pending boundaries.
        var name_1 = null;
        var parent_1 = offscreenFiber.return;
        if (parent_1 !== null && parent_1.tag === work_tags_1.WorkTag.SuspenseComponent && parent_1.memoizedProps.unstable_name) {
            name_1 = parent_1.memoizedProps.unstable_name;
        }
        if (!wasHidden && isHidden) {
            // The suspense boundaries was just hidden. Add the boundary
            // to the pending boundary set if it's there
            if (pendingMarkers !== null) {
                pendingMarkers.forEach(function (markerInstance) {
                    var pendingBoundaries = markerInstance.pendingBoundaries;
                    var transitions = markerInstance.transitions;
                    var markerName = markerInstance.name;
                    if (pendingBoundaries !== null && !pendingBoundaries.has(offscreenInstance_1)) {
                        pendingBoundaries.set(offscreenInstance_1, {
                            name: name_1
                        });
                        if (transitions !== null) {
                            if (markerInstance.tag === transition_1.TracingMarkerTag.TransitionTracingMarker && markerName !== null) {
                                (0, react_fiber_work_current_transaction_1.addMarkerProgressCallbackToPendingTransition)(markerName, transitions, pendingBoundaries);
                            }
                            else if (markerInstance.tag === transition_1.TracingMarkerTag.TransitionRoot) {
                                transitions.forEach(function (transition) {
                                    (0, react_fiber_work_current_transaction_1.addTransitionProgressCallbackToPendingTransition)(transition, pendingBoundaries);
                                });
                            }
                        }
                    }
                });
            }
        }
        else if (wasHidden && !isHidden) {
            // The suspense boundary went from hidden to visible. Remove
            // the boundary from the pending suspense boundaries set
            // if it's there
            if (pendingMarkers !== null) {
                pendingMarkers.forEach(function (markerInstance) {
                    var pendingBoundaries = markerInstance.pendingBoundaries;
                    var transitions = markerInstance.transitions;
                    var markerName = markerInstance.name;
                    if (pendingBoundaries !== null && pendingBoundaries.has(offscreenInstance_1)) {
                        pendingBoundaries.delete(offscreenInstance_1);
                        if (transitions !== null) {
                            if (markerInstance.tag === transition_1.TracingMarkerTag.TransitionTracingMarker && markerName !== null) {
                                (0, react_fiber_work_current_transaction_1.addMarkerProgressCallbackToPendingTransition)(markerName, transitions, pendingBoundaries);
                                // If there are no more unresolved suspense boundaries, the interaction
                                // is considered finished
                                if (pendingBoundaries.size === 0) {
                                    if (markerInstance.aborts === null) {
                                        (0, react_fiber_work_current_transaction_1.addMarkerCompleteCallbackToPendingTransition)(markerName, transitions);
                                    }
                                    markerInstance.transitions = null;
                                    markerInstance.pendingBoundaries = null;
                                    markerInstance.aborts = null;
                                }
                            }
                            else if (markerInstance.tag === transition_1.TracingMarkerTag.TransitionRoot) {
                                transitions.forEach(function (transition) {
                                    (0, react_fiber_work_current_transaction_1.addTransitionProgressCallbackToPendingTransition)(transition, pendingBoundaries);
                                });
                            }
                        }
                    }
                });
            }
        }
    }
}
function commitOffscreenPassiveMountEffects(current, finishedWork, instance) {
    if (react_feature_flags_1.enableCache) {
        var previousCache = null;
        if (current !== null && current.memoizedState !== null && current.memoizedState.cachePool !== null) {
            previousCache = current.memoizedState.cachePool.pool;
        }
        var nextCache = null;
        if (finishedWork.memoizedState !== null && finishedWork.memoizedState.cachePool !== null) {
            nextCache = finishedWork.memoizedState.cachePool.pool;
        }
        // Retain/release the cache used for pending (suspended) nodes.
        // Note that this is only reached in the non-suspended/visible case:
        // when the content is suspended/hidden, the retain/release occurs
        // via the parent Suspense component (see case above).
        if (nextCache !== previousCache) {
            if (nextCache != null) {
                (0, react_fiber_cache_component_1.retainCache)(nextCache);
            }
            if (previousCache != null) {
                (0, react_fiber_cache_component_1.releaseCache)(previousCache);
            }
        }
    }
    if (react_feature_flags_1.enableTransitionTracing) {
        // TODO: Pre-rendering should not be counted as part of a transition. We
        // may add separate logs for pre-rendering, but it's not part of the
        // primary metrics.
        var offscreenState = finishedWork.memoizedState;
        var queue = finishedWork.updateQueue;
        var isHidden = offscreenState !== null;
        if (queue !== null) {
            if (isHidden) {
                var transitions = queue.transitions;
                if (transitions !== null) {
                    transitions.forEach(function (transition) {
                        // Add all the transitions saved in the update queue during
                        // the render phase (ie the transitions associated with this boundary)
                        // into the transitions set.
                        if (instance._transitions === null) {
                            instance._transitions = new Set();
                        }
                        instance._transitions.add(transition);
                    });
                }
                var markerInstances = queue.markerInstances;
                if (markerInstances !== null) {
                    markerInstances.forEach(function (markerInstance) {
                        var markerTransitions = markerInstance.transitions;
                        // There should only be a few tracing marker transitions because
                        // they should be only associated with the transition that
                        // caused them
                        if (markerTransitions !== null) {
                            markerTransitions.forEach(function (transition) {
                                if (instance._transitions === null) {
                                    instance._transitions = new Set();
                                }
                                else if (instance._transitions.has(transition)) {
                                    if (markerInstance.pendingBoundaries === null) {
                                        markerInstance.pendingBoundaries = new Map();
                                    }
                                    if (instance._pendingMarkers === null) {
                                        instance._pendingMarkers = new Set();
                                    }
                                    instance._pendingMarkers.add(markerInstance);
                                }
                            });
                        }
                    });
                }
            }
            finishedWork.updateQueue = null;
        }
        commitTransitionProgress(finishedWork);
        // TODO: Refactor this into an if/else branch
        if (!isHidden) {
            instance._transitions = null;
            instance._pendingMarkers = null;
        }
    }
}
function commitCachePassiveMountEffect(current, finishedWork) {
    if (react_feature_flags_1.enableCache) {
        var previousCache = null;
        if (finishedWork.alternate !== null) {
            previousCache = finishedWork.alternate.memoizedState.cache;
        }
        var nextCache = finishedWork.memoizedState.cache;
        // Retain/release the cache. In theory the cache component
        // could be "borrowing" a cache instance owned by some parent,
        // in which case we could avoid retaining/releasing. But it
        // is non-trivial to determine when that is the case, so we
        // always retain/release.
        if (nextCache !== previousCache) {
            (0, react_fiber_cache_component_1.retainCache)(nextCache);
            if (previousCache != null) {
                (0, react_fiber_cache_component_1.releaseCache)(previousCache);
            }
        }
    }
}
function recursivelyTraverseAtomicPassiveEffects(finishedRoot, parentFiber, committedLanes, committedTransitions) {
    // "Atomic" effects are ones that need to fire on every commit, even during
    // pre-rendering. We call this function when traversing a hidden tree whose
    // regular effects are currently disconnected.
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    // TODO: Add special flag for atomic effects
    if (parentFiber.subtreeFlags & fiber_flags_1.FiberFlags.PassiveMask) {
        var child = parentFiber.child;
        while (child !== null) {
            (0, react_current_fiber_1.setCurrentFiber)(child);
            commitAtomicPassiveEffects(finishedRoot, child, committedLanes, committedTransitions);
            child = child.sibling;
        }
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function commitAtomicPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions) {
    // "Atomic" effects are ones that need to fire on every commit, even during
    // pre-rendering. We call this function when traversing a hidden tree whose
    // regular effects are currently disconnected.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.OffscreenComponent: {
            recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            if (flags & fiber_flags_1.FiberFlags.Passive) {
                // TODO: Pass `current` as argument to this function
                var current = finishedWork.alternate;
                var instance = finishedWork.stateNode;
                commitOffscreenPassiveMountEffects(current, finishedWork, instance);
            }
            break;
        }
        case work_tags_1.WorkTag.CacheComponent: {
            recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            if (flags & fiber_flags_1.FiberFlags.Passive) {
                // TODO: Pass `current` as argument to this function
                var current = finishedWork.alternate;
                commitCachePassiveMountEffect(current, finishedWork);
            }
            break;
        }
        default: {
            recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            break;
        }
    }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abortRootTransitions(root, abort, deletedTransitions, deletedOffscreenInstance, isInDeletedTree) {
    if (react_feature_flags_1.enableTransitionTracing) {
        var rootTransitions_1 = root.incompleteTransitions;
        deletedTransitions.forEach(function (transition) {
            if (rootTransitions_1.has(transition)) {
                var transitionInstance = rootTransitions_1.get(transition);
                if (transitionInstance.aborts === null) {
                    transitionInstance.aborts = [];
                }
                transitionInstance.aborts.push(abort);
                if (deletedOffscreenInstance !== null) {
                    if (transitionInstance.pendingBoundaries !== null && transitionInstance.pendingBoundaries.has(deletedOffscreenInstance)) {
                        // $FlowFixMe[incompatible-use] found when upgrading Flow
                        transitionInstance.pendingBoundaries.delete(deletedOffscreenInstance);
                    }
                }
            }
        });
    }
}
function abortTracingMarkerTransitions(abortedFiber, abort, deletedTransitions, deletedOffscreenInstance, isInDeletedTree) {
    if (react_feature_flags_1.enableTransitionTracing) {
        var markerInstance_1 = abortedFiber.stateNode;
        var markerTransitions_1 = markerInstance_1.transitions;
        var pendingBoundaries_1 = markerInstance_1.pendingBoundaries;
        if (markerTransitions_1 !== null) {
            // TODO: Refactor this code. Is there a way to move this code to
            // the deletions phase instead of calculating it here while making sure
            // complete is called appropriately?
            deletedTransitions.forEach(function (transition) {
                // If one of the transitions on the tracing marker is a transition
                // that was in an aborted subtree, we will abort that tracing marker
                if (abortedFiber !== null && markerTransitions_1.has(transition) && (markerInstance_1.aborts === null || !markerInstance_1.aborts.includes(abort))) {
                    if (markerInstance_1.transitions !== null) {
                        if (markerInstance_1.aborts === null) {
                            markerInstance_1.aborts = [abort];
                            (0, react_fiber_work_current_transaction_1.addMarkerIncompleteCallbackToPendingTransition)(abortedFiber.memoizedProps.name, markerInstance_1.transitions, markerInstance_1.aborts);
                        }
                        else {
                            markerInstance_1.aborts.push(abort);
                        }
                        // We only want to call onTransitionProgress when the marker hasn't been
                        // deleted
                        if (deletedOffscreenInstance !== null && !isInDeletedTree && pendingBoundaries_1 !== null && pendingBoundaries_1.has(deletedOffscreenInstance)) {
                            pendingBoundaries_1.delete(deletedOffscreenInstance);
                            (0, react_fiber_work_current_transaction_1.addMarkerProgressCallbackToPendingTransition)(abortedFiber.memoizedProps.name, deletedTransitions, pendingBoundaries_1);
                        }
                    }
                }
            });
        }
    }
}
function abortParentMarkerTransitionsForDeletedFiber(abortedFiber, abort, deletedTransitions, deletedOffscreenInstance, isInDeletedTree) {
    if (react_feature_flags_1.enableTransitionTracing) {
        // Find all pending markers that are waiting on child suspense boundaries in the
        // aborted subtree and cancels them
        var fiber = abortedFiber;
        while (fiber !== null) {
            switch (fiber.tag) {
                case work_tags_1.WorkTag.TracingMarkerComponent:
                    abortTracingMarkerTransitions(fiber, abort, deletedTransitions, deletedOffscreenInstance, isInDeletedTree);
                    break;
                case work_tags_1.WorkTag.HostRoot:
                    var root = fiber.stateNode;
                    abortRootTransitions(root, abort, deletedTransitions, deletedOffscreenInstance, isInDeletedTree);
                    break;
                default:
                    break;
            }
            fiber = fiber.return;
        }
    }
}
function detachFiberAfterEffects(fiber) {
    var alternate = fiber.alternate;
    if (alternate !== null) {
        fiber.alternate = null;
        detachFiberAfterEffects(alternate);
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
    if (fiber.tag === work_tags_1.WorkTag.HostComponent) {
        var hostInstance = fiber.stateNode;
        if (hostInstance !== null) {
            detachDeletedInstance(hostInstance);
        }
    }
    fiber.stateNode = null;
    if (__DEV__) {
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
function detachAlternateSiblings(parentFiber) {
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
    var previousFiber = parentFiber.alternate;
    if (previousFiber !== null) {
        var detachedChild = previousFiber.child;
        if (detachedChild !== null) {
            previousFiber.child = null;
            do {
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                var detachedSibling = detachedChild.sibling;
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                detachedChild.sibling = null;
                detachedChild = detachedSibling;
            } while (detachedChild !== null);
        }
    }
}
function commitHookPassiveUnmountEffects(finishedWork, nearestMountedAncestor, hookFlags) {
    if ((0, react_fiber_commit_work_1.shouldProfile)(finishedWork)) {
        (0, react_profile_timer_1.startPassiveEffectTimer)();
        (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hookFlags, finishedWork, nearestMountedAncestor);
        (0, react_profile_timer_1.recordPassiveEffectDuration)(finishedWork);
    }
    else {
        (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hookFlags, finishedWork, nearestMountedAncestor);
    }
}
function commitPassiveUnmountOnFiber(finishedWork) {
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            if (finishedWork.flags & fiber_flags_1.FiberFlags.Passive) {
                commitHookPassiveUnmountEffects(finishedWork, finishedWork.return, hook_flags_1.HookFlags.Passive | hook_flags_1.HookFlags.HasEffect);
            }
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            var instance = finishedWork.stateNode;
            var nextState = finishedWork.memoizedState;
            var isHidden = nextState !== null;
            if (isHidden && instance._visibility & offscreen_1.OffscreenPassiveEffectsConnected && ( // For backwards compatibility, don't unmount when a tree suspends. In
            // the future we may change this to unmount after a delay.
            finishedWork.return === null || finishedWork.return.tag !== work_tags_1.WorkTag.SuspenseComponent)) {
                // The effects are currently connected. Disconnect them.
                // TODO: Add option or heuristic to delay before disconnecting the
                // effects. Then if the tree reappears before the delay has elapsed, we
                // can skip toggling the effects entirely.
                instance._visibility &= ~offscreen_1.OffscreenPassiveEffectsConnected;
                recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            }
            else {
                recursivelyTraversePassiveUnmountEffects(finishedWork);
            }
            break;
        }
        default: {
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
        }
    }
}
function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
    // When updating this function, also update reconnectPassiveEffects, which does
    // most of the same things when an offscreen tree goes from hidden -> visible,
    // or when toggling effects inside a hidden tree.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            if (flags & fiber_flags_1.FiberFlags.Passive) {
                commitHookPassiveMountEffects(finishedWork, hook_flags_1.HookFlags.Passive | hook_flags_1.HookFlags.HasEffect);
            }
            break;
        }
        case work_tags_1.WorkTag.HostRoot: {
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            if (flags & fiber_flags_1.FiberFlags.Passive) {
                if (react_feature_flags_1.enableCache) {
                    var previousCache = null;
                    if (finishedWork.alternate !== null) {
                        previousCache = finishedWork.alternate.memoizedState.cache;
                    }
                    var nextCache = finishedWork.memoizedState.cache;
                    // Retain/release the root cache.
                    // Note that on initial mount, previousCache and nextCache will be the same
                    // and this retain won't occur. To counter this, we instead retain the HostRoot's
                    // initial cache when creating the root itself (see createFiberRoot() in
                    // ReactFiberRoot.js). Subsequent updates that change the cache are reflected
                    // here, such that previous/next caches are retained correctly.
                    if (nextCache !== previousCache) {
                        (0, react_fiber_cache_component_1.retainCache)(nextCache);
                        if (previousCache != null) {
                            (0, react_fiber_cache_component_1.releaseCache)(previousCache);
                        }
                    }
                }
                if (react_feature_flags_1.enableTransitionTracing) {
                    // Get the transitions that were initiatized during the render
                    // and add a start transition callback for each of them
                    var root = finishedWork.stateNode;
                    var incompleteTransitions_1 = root.incompleteTransitions;
                    // Initial render
                    if (committedTransitions !== null) {
                        committedTransitions.forEach(function (transition) {
                            (0, react_fiber_work_current_transaction_1.addTransitionStartCallbackToPendingTransition)(transition);
                        });
                        (0, react_fiber_lane_1.clearTransitionsForLanes)(finishedRoot, committedLanes);
                    }
                    incompleteTransitions_1.forEach(function (markerInstance, transition) {
                        var pendingBoundaries = markerInstance.pendingBoundaries;
                        if (pendingBoundaries === null || pendingBoundaries.size === 0) {
                            if (markerInstance.aborts === null) {
                                (0, react_fiber_work_current_transaction_1.addTransitionCompleteCallbackToPendingTransition)(transition);
                            }
                            incompleteTransitions_1.delete(transition);
                        }
                    });
                    (0, react_fiber_lane_1.clearTransitionsForLanes)(finishedRoot, committedLanes);
                }
            }
            break;
        }
        case work_tags_1.WorkTag.LegacyHiddenComponent: {
            if (react_feature_flags_1.enableLegacyHidden) {
                recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
                if (flags & fiber_flags_1.FiberFlags.Passive) {
                    var current = finishedWork.alternate;
                    var instance = finishedWork.stateNode;
                    commitOffscreenPassiveMountEffects(current, finishedWork, instance);
                }
            }
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            // TODO: Pass `current` as argument to this function
            var instance = finishedWork.stateNode;
            var nextState = finishedWork.memoizedState;
            var isHidden = nextState !== null;
            if (isHidden) {
                if (instance._visibility & offscreen_1.OffscreenPassiveEffectsConnected) {
                    // The effects are currently connected. Update them.
                    recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
                }
                else {
                    if (finishedWork.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
                        // The effects are currently disconnected. Since the tree is hidden,
                        // don't connect them. This also applies to the initial render.
                        if (react_feature_flags_1.enableCache || react_feature_flags_1.enableTransitionTracing) {
                            // "Atomic" effects are ones that need to fire on every commit,
                            // even during pre-rendering. An example is updating the reference
                            // count on cache instances.
                            recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
                        }
                    }
                    else {
                        // Legacy Mode: Fire the effects even if the tree is hidden.
                        instance._visibility |= offscreen_1.OffscreenPassiveEffectsConnected;
                        recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
                    }
                }
            }
            else {
                // Tree is visible
                if (instance._visibility & offscreen_1.OffscreenPassiveEffectsConnected) {
                    // The effects are currently connected. Update them.
                    recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
                }
                else {
                    // The effects are currently disconnected. Reconnect them, while also
                    // firing effects inside newly mounted trees. This also applies to
                    // the initial render.
                    instance._visibility |= offscreen_1.OffscreenPassiveEffectsConnected;
                    var includeWorkInProgressEffects = (finishedWork.subtreeFlags & fiber_flags_1.FiberFlags.PassiveMask) !== fiber_flags_1.FiberFlags.NoFlags;
                    recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
                }
            }
            if (flags & fiber_flags_1.FiberFlags.Passive) {
                var current = finishedWork.alternate;
                commitOffscreenPassiveMountEffects(current, finishedWork, instance);
            }
            break;
        }
        case work_tags_1.WorkTag.CacheComponent: {
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            if (flags & fiber_flags_1.FiberFlags.Passive) {
                // TODO: Pass `current` as argument to this function
                var current = finishedWork.alternate;
                commitCachePassiveMountEffect(current, finishedWork);
            }
            break;
        }
        case work_tags_1.WorkTag.TracingMarkerComponent: {
            if (react_feature_flags_1.enableTransitionTracing) {
                recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
                if (flags & fiber_flags_1.FiberFlags.Passive) {
                    commitTracingMarkerPassiveMountEffect(finishedWork);
                }
                break;
            } // Intentional fallthrough to next branch
        }
        default: {
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
            break;
        }
    }
}
function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
    while ((0, react_fiber_commit_next_effect_1.hasNextEffect)()) {
        var fiber = (0, react_fiber_commit_next_effect_1.getNextEffectSafe)();
        // Deletion effects fire in parent -> child order
        // TODO: Check if fiber has a PassiveStatic flag
        (0, react_current_fiber_1.setCurrentFiber)(fiber);
        commitPassiveUnmountInsideDeletedTreeOnFiber(fiber, nearestMountedAncestor);
        (0, react_current_fiber_1.resetCurrentFiber)();
        var child = fiber.child;
        // TODO: Only traverse subtree if it has a PassiveStatic flag.
        if (child !== null) {
            child.return = fiber;
            (0, react_fiber_commit_next_effect_1.setNextEffect)(child);
        }
        else {
            commitPassiveUnmountEffectsInsideOfDeletedTree_complete(deletedSubtreeRoot);
        }
    }
}
function commitPassiveUnmountEffectsInsideOfDeletedTree_complete(deletedSubtreeRoot) {
    while ((0, react_fiber_commit_next_effect_1.hasNextEffect)()) {
        var fiber = (0, react_fiber_commit_next_effect_1.getNextEffectSafe)();
        var sibling = fiber.sibling;
        var returnFiber = fiber.return;
        // Recursively traverse the entire deleted tree and clean up fiber fields.
        // This is more aggressive than ideal, and the long term goal is to only
        // have to detach the deleted tree at the root.
        detachFiberAfterEffects(fiber);
        if (fiber === deletedSubtreeRoot) {
            return (0, react_fiber_commit_next_effect_1.clearNextEffect)();
        }
        if (sibling !== null) {
            sibling.return = returnFiber;
            return (0, react_fiber_commit_next_effect_1.setNextEffect)(sibling);
        }
        (0, react_fiber_commit_next_effect_1.setNextEffect)(returnFiber);
    }
}
function commitPassiveUnmountInsideDeletedTreeOnFiber(current, nearestMountedAncestor) {
    switch (current.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            commitHookPassiveUnmountEffects(current, nearestMountedAncestor, hook_flags_1.HookFlags.Passive);
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
        case work_tags_1.WorkTag.LegacyHiddenComponent:
        case work_tags_1.WorkTag.OffscreenComponent: {
            if (react_feature_flags_1.enableCache) {
                if (current.memoizedState !== null && current.memoizedState.cachePool !== null) {
                    var cache = current.memoizedState.cachePool.pool;
                    // Retain/release the cache used for pending (suspended) nodes.
                    // Note that this is only reached in the non-suspended/visible case:
                    // when the content is suspended/hidden, the retain/release occurs
                    // via the parent Suspense component (see case above).
                    if (cache != null) {
                        (0, react_fiber_cache_component_1.retainCache)(cache);
                    }
                }
            }
            break;
        }
        case work_tags_1.WorkTag.SuspenseComponent: {
            if (react_feature_flags_1.enableTransitionTracing) {
                // We need to mark this fiber's parents as deleted
                var offscreenFiber = current.child;
                var instance = offscreenFiber.stateNode;
                var transitions = instance._transitions;
                if (transitions !== null) {
                    var abortReason = {
                        reason: "suspense",
                        name: current.memoizedProps.unstable_name || null
                    };
                    if (current.memoizedState === null || current.memoizedState.dehydrated === null) {
                        abortParentMarkerTransitionsForDeletedFiber(offscreenFiber, abortReason, transitions, instance, true);
                        if (nearestMountedAncestor !== null) {
                            abortParentMarkerTransitionsForDeletedFiber(nearestMountedAncestor, abortReason, transitions, instance, false);
                        }
                    }
                }
            }
            break;
        }
        case work_tags_1.WorkTag.CacheComponent: {
            if (react_feature_flags_1.enableCache) {
                var cache = current.memoizedState.cache;
                (0, react_fiber_cache_component_1.releaseCache)(cache);
            }
            break;
        }
        case work_tags_1.WorkTag.TracingMarkerComponent: {
            if (react_feature_flags_1.enableTransitionTracing) {
                // We need to mark this fiber's parents as deleted
                var instance = current.stateNode;
                var transitions = instance.transitions;
                if (transitions !== null) {
                    var abortReason = {
                        reason: "marker",
                        name: current.memoizedProps.name
                    };
                    abortParentMarkerTransitionsForDeletedFiber(current, abortReason, transitions, null, true);
                    if (nearestMountedAncestor !== null) {
                        abortParentMarkerTransitionsForDeletedFiber(nearestMountedAncestor, abortReason, transitions, null, false);
                    }
                }
            }
            break;
        }
    }
}
function commitTracingMarkerPassiveMountEffect(finishedWork) {
    // Get the transitions that were initiatized during the render
    // and add a start transition callback for each of them
    // We will only call this on initial mount of the tracing marker
    // only if there are no suspense children
    var instance = finishedWork.stateNode;
    if (instance.transitions !== null && instance.pendingBoundaries === null) {
        (0, react_fiber_work_current_transaction_1.addMarkerCompleteCallbackToPendingTransition)(finishedWork.memoizedProps.name, instance.transitions);
        instance.transitions = null;
        instance.pendingBoundaries = null;
        instance.aborts = null;
        instance.name = null;
    }
}
function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects have fired.
    var deletions = parentFiber.deletions;
    if ((parentFiber.flags & fiber_flags_1.FiberFlags.ChildDeletion) !== fiber_flags_1.FiberFlags.NoFlags) {
        if (deletions !== null) {
            for (var i = 0; i < deletions.length; i++) {
                var childToDelete = deletions[i];
                // TODO: Convert this to use recursion
                (0, react_fiber_commit_next_effect_1.setNextEffect)(childToDelete);
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
            }
        }
        detachAlternateSiblings(parentFiber);
    }
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    // TODO: Check PassiveStatic flag
    var child = parentFiber.child;
    while (child !== null) {
        (0, react_current_fiber_1.setCurrentFiber)(child);
        disconnectPassiveEffect(child);
        child = child.sibling;
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function recursivelyTraversePassiveMountEffects(root, parentFiber, committedLanes, committedTransitions) {
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    if (parentFiber.subtreeFlags & fiber_flags_1.FiberFlags.PassiveMask) {
        var child = parentFiber.child;
        while (child !== null) {
            (0, react_current_fiber_1.setCurrentFiber)(child);
            commitPassiveMountOnFiber(root, child, committedLanes, committedTransitions);
            child = child.sibling;
        }
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects have fired.
    var deletions = parentFiber.deletions;
    if ((parentFiber.flags & fiber_flags_1.FiberFlags.ChildDeletion) !== fiber_flags_1.FiberFlags.NoFlags) {
        if (deletions !== null) {
            for (var i = 0; i < deletions.length; i++) {
                var childToDelete = deletions[i];
                // TODO: Convert this to use recursion
                (0, react_fiber_commit_next_effect_1.setNextEffect)(childToDelete);
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
            }
        }
        detachAlternateSiblings(parentFiber);
    }
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    // TODO: Split PassiveMask into separate masks for mount and unmount?
    if (parentFiber.subtreeFlags & fiber_flags_1.FiberFlags.PassiveMask) {
        var child = parentFiber.child;
        while (child !== null) {
            (0, react_current_fiber_1.setCurrentFiber)(child);
            commitPassiveUnmountOnFiber(child);
            child = child.sibling;
        }
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function recursivelyTraverseReconnectPassiveEffects(finishedRoot, parentFiber, committedLanes, committedTransitions, includeWorkInProgressEffects) {
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    var childShouldIncludeWorkInProgressEffects = includeWorkInProgressEffects && (parentFiber.subtreeFlags & fiber_flags_1.FiberFlags.PassiveMask) !== fiber_flags_1.FiberFlags.NoFlags;
    // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    var child = parentFiber.child;
    while (child !== null) {
        reconnectPassiveEffects(finishedRoot, child, committedLanes, committedTransitions, childShouldIncludeWorkInProgressEffects);
        child = child.sibling;
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
    if ((0, react_fiber_commit_work_1.shouldProfile)(finishedWork)) {
        (0, react_profile_timer_1.startPassiveEffectTimer)();
        try {
            (0, react_fiber_commit_hook_effect_1.commitHookEffectListMount)(hookFlags, finishedWork);
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
        }
        (0, react_profile_timer_1.recordPassiveEffectDuration)(finishedWork);
    }
    else {
        try {
            (0, react_fiber_commit_hook_effect_1.commitHookEffectListMount)(hookFlags, finishedWork);
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
        }
    }
}
function commitPassiveEffectDurations(finishedRoot, finishedWork) {
    if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerCommitHooks && (0, react_fiber_work_excution_context_1.hasExecutionCommitContext)()) {
        // Only Profilers with work in their subtree will have an Update effect scheduled.
        if ((finishedWork.flags & fiber_flags_1.FiberFlags.Update) !== fiber_flags_1.FiberFlags.NoFlags) {
            switch (finishedWork.tag) {
                case work_tags_1.WorkTag.Profiler: {
                    var passiveEffectDuration = finishedWork.stateNode.passiveEffectDuration;
                    var _a = finishedWork.memoizedProps, id = _a.id, onPostCommit = _a.onPostCommit;
                    // This value will still reflect the previous commit phase.
                    // It does not get reset until the start of the next commit phase.
                    var commitTime = (0, react_profile_timer_1.getCommitTime)();
                    var phase = finishedWork.alternate === null ? "mount" : "update";
                    if (react_feature_flags_1.enableProfilerNestedUpdatePhase) {
                        if ((0, react_profile_timer_1.isCurrentUpdateNested)()) {
                            phase = "nested-update";
                        }
                    }
                    if (typeof onPostCommit === "function") {
                        onPostCommit(id, phase, passiveEffectDuration, commitTime);
                    }
                    // Bubble times to the next nearest ancestor Profiler.
                    // After we process that Profiler, we'll bubble further up.
                    var parentFiber = finishedWork.return;
                    outer: while (parentFiber !== null) {
                        switch (parentFiber.tag) {
                            case work_tags_1.WorkTag.HostRoot:
                                var root = parentFiber.stateNode;
                                root.passiveEffectDuration += passiveEffectDuration;
                                break outer;
                            case work_tags_1.WorkTag.Profiler:
                                var parentStateNode = parentFiber.stateNode;
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
exports.commitPassiveEffectDurations = commitPassiveEffectDurations;
function commitPassiveMountEffects(root, finishedWork, committedLanes, committedTransitions) {
    (0, react_current_fiber_1.setCurrentFiber)(finishedWork);
    commitPassiveMountOnFiber(root, finishedWork, committedLanes, committedTransitions);
    (0, react_current_fiber_1.resetCurrentFiber)();
}
exports.commitPassiveMountEffects = commitPassiveMountEffects;
function disconnectPassiveEffect(finishedWork) {
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            // TODO: Check PassiveStatic flag
            commitHookPassiveUnmountEffects(finishedWork, finishedWork.return, hook_flags_1.HookFlags.Passive);
            // When disconnecting passive effects, we fire the effects in the same
            // order as during a deletiong: parent before child
            recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            var instance = finishedWork.stateNode;
            if (instance._visibility & offscreen_1.OffscreenPassiveEffectsConnected) {
                instance._visibility &= ~offscreen_1.OffscreenPassiveEffectsConnected;
                recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            }
            else { // The effects are already disconnected.
            }
            break;
        }
        default: {
            recursivelyTraverseDisconnectPassiveEffects(finishedWork);
            break;
        }
    }
}
exports.disconnectPassiveEffect = disconnectPassiveEffect;
function reconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, // This function visits both newly finished work and nodes that were re-used
// from a previously committed tree. We cannot check non-static flags if the
// node was reused.
includeWorkInProgressEffects) {
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
            // TODO: Check for PassiveStatic flag
            commitHookPassiveMountEffects(finishedWork, hook_flags_1.HookFlags.Passive);
            break;
        }
        // Unlike commitPassiveMountOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case WorkTag.HostRoot: {
        //  ...
        // }
        case work_tags_1.WorkTag.LegacyHiddenComponent: {
            if (react_feature_flags_1.enableLegacyHidden) {
                recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
                if (includeWorkInProgressEffects && flags & fiber_flags_1.FiberFlags.Passive) {
                    // TODO: Pass `current` as argument to this function
                    var current = finishedWork.alternate;
                    var instance = finishedWork.stateNode;
                    commitOffscreenPassiveMountEffects(current, finishedWork, instance);
                }
            }
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            var instance = finishedWork.stateNode;
            var nextState = finishedWork.memoizedState;
            var isHidden = nextState !== null;
            if (isHidden) {
                if (instance._visibility & offscreen_1.OffscreenPassiveEffectsConnected) {
                    // The effects are currently connected. Update them.
                    recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
                }
                else {
                    if (finishedWork.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
                        // The effects are currently disconnected. Since the tree is hidden,
                        // don't connect them. This also applies to the initial render.
                        if (react_feature_flags_1.enableCache || react_feature_flags_1.enableTransitionTracing) {
                            // "Atomic" effects are ones that need to fire on every commit,
                            // even during pre-rendering. An example is updating the reference
                            // count on cache instances.
                            recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
                        }
                    }
                    else {
                        // Legacy Mode: Fire the effects even if the tree is hidden.
                        instance._visibility |= offscreen_1.OffscreenPassiveEffectsConnected;
                        recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
                    }
                }
            }
            else {
                // Tree is visible
                // Since we're already inside a reconnecting tree, it doesn't matter
                // whether the effects are currently connected. In either case, we'll
                // continue traversing the tree and firing all the effects.
                //
                // We do need to set the "connected" flag on the instance, though.
                instance._visibility |= offscreen_1.OffscreenPassiveEffectsConnected;
                recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
            }
            if (includeWorkInProgressEffects && flags & fiber_flags_1.FiberFlags.Passive) {
                // TODO: Pass `current` as argument to this function
                var current = finishedWork.alternate;
                commitOffscreenPassiveMountEffects(current, finishedWork, instance);
            }
            break;
        }
        case work_tags_1.WorkTag.CacheComponent: {
            recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
            if (includeWorkInProgressEffects && flags & fiber_flags_1.FiberFlags.Passive) {
                // TODO: Pass `current` as argument to this function
                var current = finishedWork.alternate;
                commitCachePassiveMountEffect(current, finishedWork);
            }
            break;
        }
        case work_tags_1.WorkTag.TracingMarkerComponent: {
            if (react_feature_flags_1.enableTransitionTracing) {
                recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
                if (includeWorkInProgressEffects && flags & fiber_flags_1.FiberFlags.Passive) {
                    commitTracingMarkerPassiveMountEffect(finishedWork);
                }
                break;
            } // Intentional fallthrough to next branch
        }
        default: {
            recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
            break;
        }
    }
}
exports.reconnectPassiveEffects = reconnectPassiveEffects;
function commitPassiveUnmountEffects(finishedWork) {
    (0, react_current_fiber_1.setCurrentFiber)(finishedWork);
    commitPassiveUnmountOnFiber(finishedWork);
    (0, react_current_fiber_1.resetCurrentFiber)();
}
exports.commitPassiveUnmountEffects = commitPassiveUnmountEffects;
