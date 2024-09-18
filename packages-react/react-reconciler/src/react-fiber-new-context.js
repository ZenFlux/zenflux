"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readContextDuringReconcilation = exports.readContext = exports.prepareToReadContext = exports.checkIfContextChanged = exports.propagateParentContextChangesToDeferredTree = exports.lazilyPropagateParentContextChanges = exports.propagateContextChange = exports.scheduleContextWorkOnParentPath = exports.popProvider = exports.pushProvider = exports.resetContextDependencies = void 0;
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_fiber_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-stack");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_host_context_1 = require("@zenflux/react-reconciler/src/react-fiber-host-context");
var react_fiber_work_in_progress_receive_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update");
var react_fiber_new_context_disallowed_in_dev_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context-disallowed-in-dev");
var isPrimaryRenderer = globalThis.__RECONCILER__CONFIG__.isPrimaryRenderer;
var valueCursor = (0, react_fiber_stack_1.createCursor)(null);
var rendererCursorDEV;
if (__DEV__) {
    rendererCursorDEV = (0, react_fiber_stack_1.createCursor)(null);
}
var renderer2CursorDEV;
if (__DEV__) {
    renderer2CursorDEV = (0, react_fiber_stack_1.createCursor)(null);
}
var rendererSigil;
if (__DEV__) {
    // Use this to detect multiple renderers using the same context
    rendererSigil = {};
}
var currentlyRenderingFiber = null;
var lastContextDependency = null;
var lastFullyObservedContext = null;
function resetContextDependencies() {
    // This is called right before React yields execution, to ensure `readContext`
    // cannot be called outside the render phase.
    currentlyRenderingFiber = null;
    lastContextDependency = null;
    lastFullyObservedContext = null;
    (0, react_fiber_new_context_disallowed_in_dev_1.exitDisallowedContextReadInDEV)();
}
exports.resetContextDependencies = resetContextDependencies;
function pushProvider(providerFiber, context, nextValue) {
    if (isPrimaryRenderer) {
        (0, react_fiber_stack_1.push)(valueCursor, context._currentValue, providerFiber);
        context._currentValue = nextValue;
        if (__DEV__) {
            (0, react_fiber_stack_1.push)(rendererCursorDEV, context._currentRenderer, providerFiber);
            if (context._currentRenderer !== undefined && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
                console.error("Detected multiple renderers concurrently rendering the " + "same context provider. This is currently unsupported.");
            }
            context._currentRenderer = rendererSigil;
        }
    }
    else {
        (0, react_fiber_stack_1.push)(valueCursor, context._currentValue2, providerFiber);
        context._currentValue2 = nextValue;
        if (__DEV__) {
            (0, react_fiber_stack_1.push)(renderer2CursorDEV, context._currentRenderer2, providerFiber);
            if (context._currentRenderer2 !== undefined && context._currentRenderer2 !== null && context._currentRenderer2 !== rendererSigil) {
                console.error("Detected multiple renderers concurrently rendering the " + "same context provider. This is currently unsupported.");
            }
            context._currentRenderer2 = rendererSigil;
        }
    }
}
exports.pushProvider = pushProvider;
function popProvider(context, providerFiber) {
    var currentValue = valueCursor.current;
    if (isPrimaryRenderer) {
        if (react_feature_flags_1.enableServerContext && currentValue === react_symbols_1.REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED) {
            context._currentValue = context._defaultValue;
        }
        else {
            context._currentValue = currentValue;
        }
        if (__DEV__) {
            var currentRenderer = rendererCursorDEV.current;
            (0, react_fiber_stack_1.pop)(rendererCursorDEV, providerFiber);
            context._currentRenderer = currentRenderer;
        }
    }
    else {
        if (react_feature_flags_1.enableServerContext && currentValue === react_symbols_1.REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED) {
            context._currentValue2 = context._defaultValue;
        }
        else {
            context._currentValue2 = currentValue;
        }
        if (__DEV__) {
            var currentRenderer2 = renderer2CursorDEV.current;
            (0, react_fiber_stack_1.pop)(renderer2CursorDEV, providerFiber);
            context._currentRenderer2 = currentRenderer2;
        }
    }
    (0, react_fiber_stack_1.pop)(valueCursor, providerFiber);
}
exports.popProvider = popProvider;
function scheduleContextWorkOnParentPath(parent, renderLanes, propagationRoot) {
    // Update the child lanes of all the ancestors, including the alternates.
    var node = parent;
    while (node !== null) {
        var alternate = node.alternate;
        if (!(0, react_fiber_lane_1.isSubsetOfLanes)(node.childLanes, renderLanes)) {
            node.childLanes = (0, react_fiber_lane_1.mergeLanes)(node.childLanes, renderLanes);
            if (alternate !== null) {
                alternate.childLanes = (0, react_fiber_lane_1.mergeLanes)(alternate.childLanes, renderLanes);
            }
        }
        else if (alternate !== null && !(0, react_fiber_lane_1.isSubsetOfLanes)(alternate.childLanes, renderLanes)) {
            alternate.childLanes = (0, react_fiber_lane_1.mergeLanes)(alternate.childLanes, renderLanes);
        }
        else { // Neither alternate was updated.
            // Normally, this would mean that the rest of the
            // ancestor path already has sufficient priority.
            // However, this is not necessarily true inside offscreen
            // or fallback trees because childLanes may be inconsistent
            // with the surroundings. This is why we continue the loop.
        }
        if (node === propagationRoot) {
            break;
        }
        node = node.return;
    }
    if (__DEV__) {
        if (node !== propagationRoot) {
            console.error("Expected to find the propagation root when scheduling context work. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
    }
}
exports.scheduleContextWorkOnParentPath = scheduleContextWorkOnParentPath;
function propagateContextChange(workInProgress, context, renderLanes) {
    if (react_feature_flags_1.enableLazyContextPropagation) {
        // TODO: This path is only used by Cache components. Update
        // lazilyPropagateParentContextChanges to look for Cache components so they
        // can take advantage of lazy propagation.
        var forcePropagateEntireTree = true;
        propagateContextChanges(workInProgress, [context], renderLanes, forcePropagateEntireTree);
    }
    else {
        propagateContextChange_eager(workInProgress, context, renderLanes);
    }
}
exports.propagateContextChange = propagateContextChange;
function propagateContextChange_eager(workInProgress, context, renderLanes) {
    // Only used by eager implementation
    if (react_feature_flags_1.enableLazyContextPropagation) {
        return;
    }
    var fiber = workInProgress.child;
    if (fiber !== null) {
        // Set the return pointer of the child to the work-in-progress fiber.
        fiber.return = workInProgress;
    }
    while (fiber !== null) {
        var nextFiber = void 0;
        // Visit this fiber.
        var list = fiber.dependencies;
        if (list !== null) {
            nextFiber = fiber.child;
            var dependency = list.firstContext;
            while (dependency !== null) {
                // Check if the context matches.
                if (dependency.context === context) {
                    // Match! Schedule an update on this fiber.
                    if (fiber.tag === work_tags_1.WorkTag.ClassComponent) {
                        // Schedule a force update on the work-in-progress.
                        var lane = (0, react_fiber_lane_1.pickArbitraryLane)(renderLanes);
                        var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
                        update.tag = react_fiber_class_update_queue_1.ForceUpdate;
                        // TODO: Because we don't have a work-in-progress, this will add the
                        // update to the current fiber, too, which means it will persist even if
                        // this render is thrown away. Since it's a race condition, not sure it's
                        // worth fixing.
                        // Inlined `enqueueUpdate` to remove interleaved update check
                        var updateQueue = fiber.updateQueue;
                        if (updateQueue === null) { // Only occurs if the fiber has been unmounted.
                        }
                        else {
                            var sharedQueue = updateQueue.shared;
                            var pending_1 = sharedQueue.pending;
                            if (pending_1 === null) {
                                // This is the first update. Create a circular list.
                                update.next = update;
                            }
                            else {
                                update.next = pending_1.next;
                                pending_1.next = update;
                            }
                            sharedQueue.pending = update;
                        }
                    }
                    fiber.lanes = (0, react_fiber_lane_1.mergeLanes)(fiber.lanes, renderLanes);
                    var alternate = fiber.alternate;
                    if (alternate !== null) {
                        alternate.lanes = (0, react_fiber_lane_1.mergeLanes)(alternate.lanes, renderLanes);
                    }
                    scheduleContextWorkOnParentPath(fiber.return, renderLanes, workInProgress);
                    // Mark the updated lanes on the list, too.
                    list.lanes = (0, react_fiber_lane_1.mergeLanes)(list.lanes, renderLanes);
                    // Since we already found a match, we can stop traversing the
                    // dependency list.
                    break;
                }
                dependency = dependency.next;
            }
        }
        else if (fiber.tag === work_tags_1.WorkTag.ContextProvider) {
            // Don't scan deeper if this is a matching provider
            nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
        }
        else if (fiber.tag === work_tags_1.WorkTag.DehydratedFragment) {
            // If a dehydrated suspense boundary is in this subtree, we don't know
            // if it will have any context consumers in it. The best we can do is
            // mark it as having updates.
            var parentSuspense = fiber.return;
            if (parentSuspense === null) {
                throw new Error("We just came from a parent so we must have had a parent. This is a bug in React.");
            }
            parentSuspense.lanes = (0, react_fiber_lane_1.mergeLanes)(parentSuspense.lanes, renderLanes);
            var alternate = parentSuspense.alternate;
            if (alternate !== null) {
                alternate.lanes = (0, react_fiber_lane_1.mergeLanes)(alternate.lanes, renderLanes);
            }
            // This is intentionally passing this fiber as the parent
            // because we want to schedule this fiber as having work
            // on its children. We'll use the childLanes on
            // this fiber to indicate that a context has changed.
            scheduleContextWorkOnParentPath(parentSuspense, renderLanes, workInProgress);
            nextFiber = fiber.sibling;
        }
        else {
            // Traverse down.
            nextFiber = fiber.child;
        }
        if (nextFiber !== null) {
            // Set the return pointer of the child to the work-in-progress fiber.
            nextFiber.return = fiber;
        }
        else {
            // No child. Traverse to next sibling.
            nextFiber = fiber;
            while (nextFiber !== null) {
                if (nextFiber === workInProgress) {
                    // We're back to the root of this subtree. Exit.
                    nextFiber = null;
                    break;
                }
                var sibling = nextFiber.sibling;
                if (sibling !== null) {
                    // Set the return pointer of the sibling to the work-in-progress fiber.
                    sibling.return = nextFiber.return;
                    nextFiber = sibling;
                    break;
                }
                // No more siblings. Traverse up.
                nextFiber = nextFiber.return;
            }
        }
        fiber = nextFiber;
    }
}
function propagateContextChanges(workInProgress, contexts, renderLanes, forcePropagateEntireTree) {
    // Only used by lazy implementation
    if (!react_feature_flags_1.enableLazyContextPropagation) {
        return;
    }
    var fiber = workInProgress.child;
    if (fiber !== null) {
        // Set the return pointer of the child to the work-in-progress fiber.
        fiber.return = workInProgress;
    }
    while (fiber !== null) {
        var nextFiber = void 0;
        // Visit this fiber.
        var list = fiber.dependencies;
        if (list !== null) {
            nextFiber = fiber.child;
            var dep = list.firstContext;
            findChangedDep: while (dep !== null) {
                // Assigning these to constants to help Flow
                var dependency = dep;
                var consumer = fiber;
                for (var i = 0; i < contexts.length; i++) {
                    var context = contexts[i];
                    // Check if the context matches.
                    // TODO: Compare selected values to bail out early.
                    if (dependency.context === context) {
                        // Match! Schedule an update on this fiber.
                        // In the lazy implementation, don't mark a dirty flag on the
                        // dependency itself. Not all changes are propagated, so we can't
                        // rely on the propagation function alone to determine whether
                        // something has changed; the consumer will check. In the future, we
                        // could add back a dirty flag as an optimization to avoid double
                        // checking, but until we have selectors it's not really worth
                        // the trouble.
                        consumer.lanes = (0, react_fiber_lane_1.mergeLanes)(consumer.lanes, renderLanes);
                        var alternate = consumer.alternate;
                        if (alternate !== null) {
                            alternate.lanes = (0, react_fiber_lane_1.mergeLanes)(alternate.lanes, renderLanes);
                        }
                        scheduleContextWorkOnParentPath(consumer.return, renderLanes, workInProgress);
                        if (!forcePropagateEntireTree) {
                            // During lazy propagation, when we find a match, we can defer
                            // propagating changes to the children, because we're going to
                            // visit them during render. We should continue propagating the
                            // siblings, though
                            nextFiber = null;
                        }
                        // Since we already found a match, we can stop traversing the
                        // dependency list.
                        break findChangedDep;
                    }
                }
                dep = dependency.next;
            }
        }
        else if (fiber.tag === work_tags_1.WorkTag.DehydratedFragment) {
            // If a dehydrated suspense boundary is in this subtree, we don't know
            // if it will have any context consumers in it. The best we can do is
            // mark it as having updates.
            var parentSuspense = fiber.return;
            if (parentSuspense === null) {
                throw new Error("We just came from a parent so we must have had a parent. This is a bug in React.");
            }
            parentSuspense.lanes = (0, react_fiber_lane_1.mergeLanes)(parentSuspense.lanes, renderLanes);
            var alternate = parentSuspense.alternate;
            if (alternate !== null) {
                alternate.lanes = (0, react_fiber_lane_1.mergeLanes)(alternate.lanes, renderLanes);
            }
            // This is intentionally passing this fiber as the parent
            // because we want to schedule this fiber as having work
            // on its children. We'll use the childLanes on
            // this fiber to indicate that a context has changed.
            scheduleContextWorkOnParentPath(parentSuspense, renderLanes, workInProgress);
            nextFiber = null;
        }
        else {
            // Traverse down.
            nextFiber = fiber.child;
        }
        if (nextFiber !== null) {
            // Set the return pointer of the child to the work-in-progress fiber.
            nextFiber.return = fiber;
        }
        else {
            // No child. Traverse to next sibling.
            nextFiber = fiber;
            while (nextFiber !== null) {
                if (nextFiber === workInProgress) {
                    // We're back to the root of this subtree. Exit.
                    nextFiber = null;
                    break;
                }
                var sibling = nextFiber.sibling;
                if (sibling !== null) {
                    // Set the return pointer of the sibling to the work-in-progress fiber.
                    sibling.return = nextFiber.return;
                    nextFiber = sibling;
                    break;
                }
                // No more siblings. Traverse up.
                nextFiber = nextFiber.return;
            }
        }
        fiber = nextFiber;
    }
}
function lazilyPropagateParentContextChanges(current, workInProgress, renderLanes) {
    var forcePropagateEntireTree = false;
    propagateParentContextChanges(current, workInProgress, renderLanes, forcePropagateEntireTree);
}
exports.lazilyPropagateParentContextChanges = lazilyPropagateParentContextChanges;
// Used for propagating a deferred tree (Suspense, Offscreen). We must propagate
// to the entire subtree, because we won't revisit it until after the current
// render has completed, at which point we'll have lost track of which providers
// have changed.
function propagateParentContextChangesToDeferredTree(current, workInProgress, renderLanes) {
    var forcePropagateEntireTree = true;
    propagateParentContextChanges(current, workInProgress, renderLanes, forcePropagateEntireTree);
}
exports.propagateParentContextChangesToDeferredTree = propagateParentContextChangesToDeferredTree;
function propagateParentContextChanges(current, workInProgress, renderLanes, forcePropagateEntireTree) {
    if (!react_feature_flags_1.enableLazyContextPropagation) {
        return;
    }
    // Collect all the parent providers that changed. Since this is usually small
    // number, we use an Array instead of Set.
    var contexts = null;
    var parent = workInProgress;
    var isInsidePropagationBailout = false;
    while (parent !== null) {
        if (!isInsidePropagationBailout) {
            if ((parent.flags & fiber_flags_1.FiberFlags.NeedsPropagation) !== fiber_flags_1.FiberFlags.NoFlags) {
                isInsidePropagationBailout = true;
            }
            else if ((parent.flags & fiber_flags_1.FiberFlags.DidPropagateContext) !== fiber_flags_1.FiberFlags.NoFlags) {
                break;
            }
        }
        if (parent.tag === work_tags_1.WorkTag.ContextProvider) {
            var currentParent = parent.alternate;
            if (currentParent === null) {
                throw new Error("Should have a current fiber. This is a bug in React.");
            }
            var oldProps = currentParent.memoizedProps;
            if (oldProps !== null) {
                var providerType = parent.type;
                var context = providerType._context;
                var newProps = parent.pendingProps;
                var newValue = newProps.value;
                var oldValue = oldProps.value;
                if (!(0, object_is_1.default)(newValue, oldValue)) {
                    if (contexts !== null) {
                        contexts.push(context);
                    }
                    else {
                        contexts = [context];
                    }
                }
            }
        }
        else if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions && parent === (0, react_fiber_host_context_1.getHostTransitionProvider)()) {
            // During a host transition, a host component can act like a context
            // provider. E.g. in React DOM, this would be a <form />.
            var currentParent = parent.alternate;
            if (currentParent === null) {
                throw new Error("Should have a current fiber. This is a bug in React.");
            }
            var oldStateHook = currentParent.memoizedState;
            var oldState = oldStateHook.memoizedState;
            var newStateHook = parent.memoizedState;
            var newState = newStateHook.memoizedState;
            // This uses regular equality instead of Object.is because we assume that
            // host transition state doesn't include NaN as a valid type.
            if (oldState !== newState) {
                if (contexts !== null) {
                    contexts.push(react_fiber_host_context_1.HostTransitionContext);
                }
                else {
                    contexts = [react_fiber_host_context_1.HostTransitionContext];
                }
            }
        }
        parent = parent.return;
    }
    if (contexts !== null) {
        // If there were any changed providers, search through the children and
        // propagate their changes.
        propagateContextChanges(workInProgress, contexts, renderLanes, forcePropagateEntireTree);
    }
    // This is an optimization so that we only propagate once per subtree. If a
    // deeply nested child bails out, and it calls this propagation function, it
    // uses this flag to know that the remaining ancestor providers have already
    // been propagated.
    //
    // NOTE: This optimization is only necessary because we sometimes enter the
    // begin phase of nodes that don't have any work scheduled on them —
    // specifically, the siblings of a node that _does_ have scheduled work. The
    // siblings will bail out and call this function again, even though we already
    // propagated content changes to it and its subtree. So we use this flag to
    // mark that the parent providers already propagated.
    //
    // Unfortunately, though, we need to ignore this flag when we're inside a
    // tree whose context propagation was deferred — that's what the
    // `NeedsPropagation` flag is for.
    //
    // If we could instead bail out before entering the siblings' begin phase,
    // then we could remove both `DidPropagateContext` and `NeedsPropagation`.
    // Consider this as part of the next refactor to the fiber tree structure.
    workInProgress.flags |= fiber_flags_1.FiberFlags.DidPropagateContext;
}
function checkIfContextChanged(currentDependencies) {
    if (!react_feature_flags_1.enableLazyContextPropagation) {
        return false;
    }
    // Iterate over the current dependencies to see if something changed. This
    // only gets called if props and state has already bailed out, so it's a
    // relatively uncommon path, except at the root of a changed subtree.
    // Alternatively, we could move these comparisons into `readContext`, but
    // that's a much hotter path, so I think this is an appropriate trade off.
    var dependency = currentDependencies.firstContext;
    while (dependency !== null) {
        var context = dependency.context;
        var newValue = isPrimaryRenderer ? context._currentValue : context._currentValue2;
        var oldValue = dependency.memoizedValue;
        if (!(0, object_is_1.default)(newValue, oldValue)) {
            return true;
        }
        dependency = dependency.next;
    }
    return false;
}
exports.checkIfContextChanged = checkIfContextChanged;
function prepareToReadContext(workInProgress, renderLanes) {
    currentlyRenderingFiber = workInProgress;
    lastContextDependency = null;
    lastFullyObservedContext = null;
    var dependencies = workInProgress.dependencies;
    if (dependencies !== null) {
        if (react_feature_flags_1.enableLazyContextPropagation) {
            // Reset the work-in-progress list
            dependencies.firstContext = null;
        }
        else {
            var firstContext = dependencies.firstContext;
            if (firstContext !== null) {
                if ((0, react_fiber_lane_1.includesSomeLane)(dependencies.lanes, renderLanes)) {
                    // Context list has a pending update. Mark that this fiber performed work.
                    (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
                }
                // Reset the work-in-progress list
                dependencies.firstContext = null;
            }
        }
    }
}
exports.prepareToReadContext = prepareToReadContext;
function readContext(context) {
    if ((0, react_fiber_new_context_disallowed_in_dev_1.isDisallowedContextReadInDEV)()) {
        // This warning would fire if you read context inside a Hook like useMemo.
        // Unlike the class check below, it's not enforced in production for perf.
        console.error("Context can only be read while React is rendering. " + "In classes, you can read it in the render method or getDerivedStateFromProps. " + "In function components, you can read it directly in the function body, but not " + "inside Hooks like useReducer() or useMemo().");
    }
    return readContextForConsumer(currentlyRenderingFiber, context);
}
exports.readContext = readContext;
function readContextDuringReconcilation(consumer, context, renderLanes) {
    if (currentlyRenderingFiber === null) {
        prepareToReadContext(consumer, renderLanes);
    }
    return readContextForConsumer(consumer, context);
}
exports.readContextDuringReconcilation = readContextDuringReconcilation;
function readContextForConsumer(consumer, context) {
    var value = isPrimaryRenderer ? context._currentValue : context._currentValue2;
    if (lastFullyObservedContext === context) { // Nothing to do. We already observe everything in this context.
    }
    else {
        var contextItem = {
            context: context,
            memoizedValue: value,
            next: null
        };
        if (lastContextDependency === null) {
            if (consumer === null) {
                throw new Error("Context can only be read while React is rendering. " + "In classes, you can read it in the render method or getDerivedStateFromProps. " + "In function components, you can read it directly in the function body, but not " + "inside Hooks like useReducer() or useMemo().");
            }
            // This is the first dependency for this component. Create a new list.
            lastContextDependency = contextItem;
            consumer.dependencies = {
                lanes: fiber_lane_constants_1.NoLanes,
                firstContext: contextItem
            };
            if (react_feature_flags_1.enableLazyContextPropagation) {
                consumer.flags |= fiber_flags_1.FiberFlags.NeedsPropagation;
            }
        }
        else {
            // Append a new context item.
            lastContextDependency = lastContextDependency.next = contextItem;
        }
    }
    return value;
}
