"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitCallbacks = exports.commitHiddenCallbacks = exports.deferHiddenCallbacks = exports.checkHasForceUpdateAfterProcessing = exports.resetHasForceUpdateBeforeProcessing = exports.processUpdateQueue = exports.enqueueCapturedUpdate = exports.entangleTransitions = exports.enqueueUpdate = exports.createUpdate = exports.cloneUpdateQueue = exports.initializeUpdateQueue = exports.resetCurrentlyProcessingQueue = exports.CaptureUpdate = exports.ForceUpdate = exports.ReplaceState = exports.UpdateState = void 0;
// UpdateQueue is a linked list of prioritized updates.
//
// Like fibers, update queues come in pairs: a current queue, which represents
// the visible state of the screen, and a work-in-progress queue, which can be
// mutated and processed asynchronously before it is committed — a form of
// double buffering. If a work-in-progress render is discarded before finishing,
// we create a new work-in-progress by cloning the current queue.
//
// Both queues share a persistent, singly-linked list structure. To schedule an
// update, we append it to the end of both queues. Each queue maintains a
// pointer to first update in the persistent list that hasn't been processed.
// The work-in-progress pointer always has a position equal to or greater than
// the current queue, since we always work on that one. The current queue's
// pointer is only updated during the commit phase, when we swap in the
// work-in-progress.
//
// For example:
//
//   Current pointer:           A - B - C - D - E - F
//   Work-in-progress pointer:              D - E - F
//                                          ^
//                                          The work-in-progress queue has
//                                          processed more updates than current.
//
// The reason we append to both queues is because otherwise we might drop
// updates without ever processing them. For example, if we only add updates to
// the work-in-progress queue, some updates could be lost whenever a work-in
// -progress render restarts by cloning from current. Similarly, if we only add
// updates to the current queue, the updates will be lost whenever an already
// in-progress queue commits and swaps with the current queue. However, by
// adding to both queues, we guarantee that the update will be part of the next
// work-in-progress. (And because the work-in-progress queue becomes the
// current queue once it commits, there's no danger of applying the same
// update twice.)
//
// Prioritization
// --------------
//
// Updates are not sorted by priority, but by insertion; new updates are always
// appended to the end of the list.
//
// The priority is still important, though. When processing the update queue
// during the render phase, only the updates with sufficient priority are
// included in the result. If we skip an update because it has insufficient
// priority, it remains in the queue to be processed later, during a lower
// priority render. Crucially, all updates subsequent to a skipped update also
// remain in the queue *regardless of their priority*. That means high priority
// updates are sometimes processed twice, at two separate priorities. We also
// keep track of a base state, that represents the state before the first
// update in the queue is applied.
//
// For example:
//
//   Given a base state of '', and the following queue of updates
//
//     A1 - B2 - C1 - D2
//
//   where the number indicates the priority, and the update is applied to the
//   previous state by appending a letter, React will process these updates as
//   two separate renders, one per distinct priority level:
//
//   First render, at priority 1:
//     Base state: ''
//     Updates: [A1, C1]
//     Result state: 'AC'
//
//   Second render, at priority 2:
//     Base state: 'A'            <-  The base state does not include C1,
//                                    because B2 was skipped.
//     Updates: [B2, C1, D2]      <-  C1 was rebased on top of B2
//     Result state: 'ABCD'
//
// Because we process updates in insertion order, and rebase high priority
// updates when preceding updates are skipped, the final result is deterministic
// regardless of priority. Intermediate state may vary according to system
// resources, but the final state is always the same.
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_entangled_lane_1 = require("@zenflux/react-reconciler/src/react-entangled-lane");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_new_context_disallowed_in_dev_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context-disallowed-in-dev");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
exports.UpdateState = 0;
exports.ReplaceState = 1;
exports.ForceUpdate = 2;
exports.CaptureUpdate = 3;
// Global state that is reset at the beginning of calling `processUpdateQueue`.
// It should only be read right after calling `processUpdateQueue`, via
// `checkHasForceUpdateAfterProcessing`.
var hasForceUpdate = false;
var didWarnUpdateInsideUpdate;
var currentlyProcessingQueue;
if (__DEV__) {
    didWarnUpdateInsideUpdate = false;
    currentlyProcessingQueue = null;
    exports.resetCurrentlyProcessingQueue = function () {
        currentlyProcessingQueue = null;
    };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isUnsafeClassRenderPhaseUpdate(fiber) {
    // Check if this is a render phase update. Only called by class components,
    // which special (deprecated) behavior for UNSAFE_componentWillReceive props.
    return (0, react_fiber_work_excution_context_1.isExecutionContextRenderDeactivate)();
}
function initializeUpdateQueue(fiber) {
    var queue = {
        baseState: fiber.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
            pending: null,
            lanes: fiber_lane_constants_1.NoLanes,
            hiddenCallbacks: null
        },
        callbacks: null
    };
    fiber.updateQueue = queue;
}
exports.initializeUpdateQueue = initializeUpdateQueue;
function cloneUpdateQueue(current, workInProgress) {
    // Clone the update queue from current. Unless it's already a clone.
    var queue = workInProgress.updateQueue;
    var currentQueue = current.updateQueue;
    if (queue === currentQueue) {
        var clone = {
            baseState: currentQueue.baseState,
            firstBaseUpdate: currentQueue.firstBaseUpdate,
            lastBaseUpdate: currentQueue.lastBaseUpdate,
            shared: currentQueue.shared,
            callbacks: null
        };
        workInProgress.updateQueue = clone;
    }
}
exports.cloneUpdateQueue = cloneUpdateQueue;
function createUpdate(lane) {
    var update = {
        lane: lane,
        tag: exports.UpdateState,
        payload: null,
        callback: null,
        next: null
    };
    return update;
}
exports.createUpdate = createUpdate;
function enqueueUpdate(fiber, update, lane) {
    var updateQueue = fiber.updateQueue;
    if (updateQueue === null) {
        // Only occurs if the fiber has been unmounted.
        return null;
    }
    var sharedQueue = updateQueue.shared;
    if (__DEV__) {
        if (currentlyProcessingQueue === sharedQueue && !didWarnUpdateInsideUpdate) {
            var componentName = (0, react_get_component_name_from_fiber_1.default)(fiber);
            console.error("An update (setState, replaceState, or forceUpdate) was scheduled " + "from inside an update function. Update functions should be pure, " + "with zero side-effects. Consider using componentDidUpdate or a " + "callback.\n\nPlease update the following component: %s", componentName);
            didWarnUpdateInsideUpdate = true;
        }
    }
    if (isUnsafeClassRenderPhaseUpdate(fiber)) {
        // This is an unsafe render phase update. Add directly to the update
        // queue so we can process it immediately during the current render.
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
        // Update the childLanes even though we're most likely already rendering
        // this fiber. This is for backwards compatibility in the case where you
        // update a different component during render phase than the one that is
        // currently renderings (a pattern that is accompanied by a warning).
        return (0, react_fiber_concurrent_updates_1.unsafe_markUpdateLaneFromFiberToRoot)(fiber, lane);
    }
    else {
        return (0, react_fiber_concurrent_updates_1.enqueueConcurrentClassUpdate)(fiber, sharedQueue, update, lane);
    }
}
exports.enqueueUpdate = enqueueUpdate;
function entangleTransitions(root, fiber, lane) {
    var updateQueue = fiber.updateQueue;
    if (updateQueue === null) {
        // Only occurs if the fiber has been unmounted.
        return;
    }
    var sharedQueue = updateQueue.shared;
    if ((0, fiber_lane_constants_1.isTransitionLane)(lane)) {
        var queueLanes = sharedQueue.lanes;
        // If any entangled lanes are no longer pending on the root, then they must
        // have finished. We can remove them from the shared queue, which represents
        // a superset of the actually pending lanes. In some cases we may entangle
        // more than we need to, but that's OK. In fact it's worse if we *don't*
        // entangle when we should.
        queueLanes = (0, react_fiber_lane_1.intersectLanes)(queueLanes, root.pendingLanes);
        // Entangle the new transition lane with the other transition lanes.
        var newQueueLanes = (0, react_fiber_lane_1.mergeLanes)(queueLanes, lane);
        sharedQueue.lanes = newQueueLanes;
        // Even if queue.lanes already include lane, we don't know for certain if
        // the lane finished since the last time we entangled it. So we need to
        // entangle it again, just to be sure.
        (0, react_entangled_lane_1.markRootEntangled)(root, newQueueLanes);
    }
}
exports.entangleTransitions = entangleTransitions;
function enqueueCapturedUpdate(workInProgress, capturedUpdate) {
    // Captured updates are updates that are thrown by a child during the render
    // phase. They should be discarded if the render is aborted. Therefore,
    // we should only put them on the work-in-progress queue, not the current one.
    var queue = workInProgress.updateQueue;
    // Check if the work-in-progress queue is a clone.
    var current = workInProgress.alternate;
    if (current !== null) {
        var currentQueue = current.updateQueue;
        if (queue === currentQueue) {
            // The work-in-progress queue is the same as current. This happens when
            // we bail out on a parent fiber that then captures an error thrown by
            // a child. Since we want to append the update only to the work-in
            // -progress queue, we need to clone the updates. We usually clone during
            // processUpdateQueue, but that didn't happen in this case because we
            // skipped over the parent when we bailed out.
            var newFirst = null;
            var newLast = null;
            var firstBaseUpdate = queue.firstBaseUpdate;
            if (firstBaseUpdate !== null) {
                // Loop through the updates and clone them.
                var update = firstBaseUpdate;
                do {
                    var clone = {
                        lane: update.lane,
                        tag: update.tag,
                        payload: update.payload,
                        // When this update is rebased, we should not fire its
                        // callback again.
                        callback: null,
                        next: null
                    };
                    if (newLast === null) {
                        newFirst = newLast = clone;
                    }
                    else {
                        newLast.next = clone;
                        newLast = clone;
                    }
                    // $FlowFixMe[incompatible-type] we bail out when we get a null
                    // @ts-ignore
                    update = update.next;
                } while (update !== null);
                // Append the captured update the end of the cloned list.
                if (newLast === null) {
                    newFirst = newLast = capturedUpdate;
                }
                else {
                    newLast.next = capturedUpdate;
                    newLast = capturedUpdate;
                }
            }
            else {
                // There are no base updates.
                newFirst = newLast = capturedUpdate;
            }
            queue = {
                baseState: currentQueue.baseState,
                firstBaseUpdate: newFirst,
                lastBaseUpdate: newLast,
                shared: currentQueue.shared,
                callbacks: currentQueue.callbacks
            };
            workInProgress.updateQueue = queue;
            return;
        }
    }
    // Append the update to the end of the list.
    var lastBaseUpdate = queue.lastBaseUpdate;
    if (lastBaseUpdate === null) {
        queue.firstBaseUpdate = capturedUpdate;
    }
    else {
        lastBaseUpdate.next = capturedUpdate;
    }
    queue.lastBaseUpdate = capturedUpdate;
}
exports.enqueueCapturedUpdate = enqueueCapturedUpdate;
function getStateFromUpdate(workInProgress, queue, update, prevState, nextProps, instance) {
    switch (update.tag) {
        case exports.ReplaceState: {
            var payload = update.payload;
            if (typeof payload === "function") {
                // Updater function
                if (__DEV__) {
                    (0, react_fiber_new_context_disallowed_in_dev_1.enterDisallowedContextReadInDEV)();
                }
                var nextState = payload.call(instance, prevState, nextProps);
                if (__DEV__) {
                    if (react_feature_flags_1.debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
                        (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(true);
                        try {
                            payload.call(instance, prevState, nextProps);
                        }
                        finally {
                            (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(false);
                        }
                    }
                    (0, react_fiber_new_context_disallowed_in_dev_1.exitDisallowedContextReadInDEV)();
                }
                return nextState;
            }
            // State object
            return payload;
        }
        case exports.CaptureUpdate: {
            workInProgress.flags = workInProgress.flags & ~fiber_flags_1.FiberFlags.ShouldCapture | fiber_flags_1.FiberFlags.DidCapture;
        }
        // Intentional fallthrough
        case exports.UpdateState: {
            var payload = update.payload;
            var partialState = void 0;
            if (typeof payload === "function") {
                // Updater function
                if (__DEV__) {
                    (0, react_fiber_new_context_disallowed_in_dev_1.enterDisallowedContextReadInDEV)();
                }
                partialState = payload.call(instance, prevState, nextProps);
                if (__DEV__) {
                    if (react_feature_flags_1.debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
                        (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(true);
                        try {
                            payload.call(instance, prevState, nextProps);
                        }
                        finally {
                            (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(false);
                        }
                    }
                    (0, react_fiber_new_context_disallowed_in_dev_1.exitDisallowedContextReadInDEV)();
                }
            }
            else {
                // Partial state object
                partialState = payload;
            }
            if (partialState === null || partialState === undefined) {
                // Null and undefined are treated as no-ops.
                return prevState;
            }
            // Merge the partial state and the previous state.
            return Object.assign({}, prevState, partialState);
        }
        case exports.ForceUpdate: {
            hasForceUpdate = true;
            return prevState;
        }
    }
    return prevState;
}
function processUpdateQueue(workInProgress, props, instance, renderLanes) {
    // This is always non-null on a ClassComponent or HostRoot
    var queue = workInProgress.updateQueue;
    hasForceUpdate = false;
    if (__DEV__) {
        currentlyProcessingQueue = queue.shared;
    }
    var firstBaseUpdate = queue.firstBaseUpdate;
    var lastBaseUpdate = queue.lastBaseUpdate;
    // Check if there are pending updates. If so, transfer them to the base queue.
    var pendingQueue = queue.shared.pending;
    if (pendingQueue !== null) {
        queue.shared.pending = null;
        // The pending queue is circular. Disconnect the pointer between first
        // and last so that it's non-circular.
        var lastPendingUpdate = pendingQueue;
        var firstPendingUpdate = lastPendingUpdate.next;
        lastPendingUpdate.next = null;
        // Append pending updates to base queue
        if (lastBaseUpdate === null) {
            firstBaseUpdate = firstPendingUpdate;
        }
        else {
            lastBaseUpdate.next = firstPendingUpdate;
        }
        lastBaseUpdate = lastPendingUpdate;
        // If there's a current queue, and it's different from the base queue, then
        // we need to transfer the updates to that queue, too. Because the base
        // queue is a singly-linked list with no cycles, we can append to both
        // lists and take advantage of structural sharing.
        // TODO: Pass `current` as argument
        var current = workInProgress.alternate;
        if (current !== null) {
            // This is always non-null on a ClassComponent or HostRoot
            var currentQueue = current.updateQueue;
            var currentLastBaseUpdate = currentQueue.lastBaseUpdate;
            if (currentLastBaseUpdate !== lastBaseUpdate) {
                if (currentLastBaseUpdate === null) {
                    currentQueue.firstBaseUpdate = firstPendingUpdate;
                }
                else {
                    currentLastBaseUpdate.next = firstPendingUpdate;
                }
                currentQueue.lastBaseUpdate = lastPendingUpdate;
            }
        }
    }
    // These values may change as we process the queue.
    if (firstBaseUpdate !== null) {
        // Iterate through the list of updates to compute the result.
        var newState = queue.baseState;
        // TODO: Don't need to accumulate this. Instead, we can remove renderLanes
        // from the original lanes.
        var newLanes = fiber_lane_constants_1.NoLanes;
        var newBaseState = null;
        var newFirstBaseUpdate = null;
        var newLastBaseUpdate = null;
        var update = firstBaseUpdate;
        do {
            // An extra OffscreenLane bit is added to updates that were made to
            // a hidden tree, so that we can distinguish them from updates that were
            // already there when the tree was hidden.
            var updateLane = (0, react_fiber_lane_1.removeLanes)(update.lane, fiber_lane_constants_1.OffscreenLane);
            var isHiddenUpdate = updateLane !== update.lane;
            // Check if this update was made while the tree was hidden. If so, then
            // it's not a "base" update, and we should disregard the extra base lanes
            // that were added to renderLanes when we entered the Offscreen tree.
            var shouldSkipUpdate = isHiddenUpdate ?
                !(0, react_fiber_lane_1.isSubsetOfLanes)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)(), updateLane) :
                !(0, react_fiber_lane_1.isSubsetOfLanes)(renderLanes, updateLane);
            if (shouldSkipUpdate) {
                // Priority is insufficient. Skip this update. If this is the first
                // skipped update, the previous update/state is the new base
                // update/state.
                var clone = {
                    lane: updateLane,
                    tag: update.tag,
                    payload: update.payload,
                    callback: update.callback,
                    next: null
                };
                if (newLastBaseUpdate === null) {
                    newFirstBaseUpdate = newLastBaseUpdate = clone;
                    newBaseState = newState;
                }
                else {
                    // @ts-ignore
                    newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }
                // Update the remaining priority in the queue.
                newLanes = (0, react_fiber_lane_1.mergeLanes)(newLanes, updateLane);
            }
            else {
                // This update does have sufficient priority.
                if (newLastBaseUpdate !== null) {
                    var clone = {
                        // This update is going to be committed so we never want uncommit
                        // it. Using NoLane works because 0 is a subset of all bitmasks, so
                        // this will never be skipped by the check above.
                        lane: fiber_lane_constants_1.NoLane,
                        tag: update.tag,
                        payload: update.payload,
                        // When this update is rebased, we should not fire its
                        // callback again.
                        callback: null,
                        next: null
                    };
                    // @ts-ignore
                    newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }
                // Process this update.
                newState = getStateFromUpdate(workInProgress, queue, update, newState, props, instance);
                var callback = update.callback;
                if (callback !== null) {
                    workInProgress.flags |= fiber_flags_1.FiberFlags.Callback;
                    if (isHiddenUpdate) {
                        workInProgress.flags |= fiber_flags_1.FiberFlags.Visibility;
                    }
                    var callbacks = queue.callbacks;
                    if (callbacks === null) {
                        queue.callbacks = [callback];
                    }
                    else {
                        callbacks.push(callback);
                    }
                }
            }
            // $FlowFixMe[incompatible-type] we bail out when we get a null
            // @ts-ignore
            update = update.next;
            if (update === null) {
                pendingQueue = queue.shared.pending;
                if (pendingQueue === null) {
                    break;
                }
                else {
                    // An update was scheduled from inside a reducer. Add the new
                    // pending updates to the end of the list and keep processing.
                    var lastPendingUpdate = pendingQueue;
                    // Intentionally unsound. Pending updates form a circular list, but we
                    // unravel them when transferring them to the base queue.
                    var firstPendingUpdate = lastPendingUpdate.next;
                    lastPendingUpdate.next = null;
                    update = firstPendingUpdate;
                    queue.lastBaseUpdate = lastPendingUpdate;
                    queue.shared.pending = null;
                }
            }
        } while (true);
        if (newLastBaseUpdate === null) {
            newBaseState = newState;
        }
        queue.baseState = newBaseState;
        queue.firstBaseUpdate = newFirstBaseUpdate;
        queue.lastBaseUpdate = newLastBaseUpdate;
        if (firstBaseUpdate === null) {
            // `queue.lanes` is used for entangling transitions. We can set it back to
            // zero once the queue is empty.
            queue.shared.lanes = fiber_lane_constants_1.NoLanes;
        }
        // Set the remaining expiration time to be whatever is remaining in the queue.
        // This should be fine because the only two other things that contribute to
        // expiration time are props and context. We're already in the middle of the
        // begin phase by the time we start processing the queue, so we've already
        // dealt with the props. Context in components that specify
        // shouldComponentUpdate is tricky; but we'll have to account for
        // that regardless.
        (0, react_fiber_work_in_progress_1.markSkippedUpdateLanes)(newLanes);
        workInProgress.lanes = newLanes;
        workInProgress.memoizedState = newState;
    }
    if (__DEV__) {
        currentlyProcessingQueue = null;
    }
}
exports.processUpdateQueue = processUpdateQueue;
function callCallback(callback, context) {
    if (typeof callback !== "function") {
        throw new Error("Invalid argument passed as callback. Expected a function. Instead " + "received: ".concat(callback));
    }
    callback.call(context);
}
function resetHasForceUpdateBeforeProcessing() {
    hasForceUpdate = false;
}
exports.resetHasForceUpdateBeforeProcessing = resetHasForceUpdateBeforeProcessing;
function checkHasForceUpdateAfterProcessing() {
    return hasForceUpdate;
}
exports.checkHasForceUpdateAfterProcessing = checkHasForceUpdateAfterProcessing;
function deferHiddenCallbacks(updateQueue) {
    // When an update finishes on a hidden component, its callback should not
    // be fired until/unless the component is made visible again. Stash the
    // callback on the shared queue object so it can be fired later.
    var newHiddenCallbacks = updateQueue.callbacks;
    if (newHiddenCallbacks !== null) {
        var existingHiddenCallbacks = updateQueue.shared.hiddenCallbacks;
        if (existingHiddenCallbacks === null) {
            updateQueue.shared.hiddenCallbacks = newHiddenCallbacks;
        }
        else {
            updateQueue.shared.hiddenCallbacks = existingHiddenCallbacks.concat(newHiddenCallbacks);
        }
    }
}
exports.deferHiddenCallbacks = deferHiddenCallbacks;
function commitHiddenCallbacks(updateQueue, context) {
    // This component is switching from hidden -> visible. Commit any callbacks
    // that were previously deferred.
    var hiddenCallbacks = updateQueue.shared.hiddenCallbacks;
    if (hiddenCallbacks !== null) {
        updateQueue.shared.hiddenCallbacks = null;
        for (var i = 0; i < hiddenCallbacks.length; i++) {
            var callback = hiddenCallbacks[i];
            callCallback(callback, context);
        }
    }
}
exports.commitHiddenCallbacks = commitHiddenCallbacks;
function commitCallbacks(updateQueue, context) {
    var callbacks = updateQueue.callbacks;
    if (callbacks !== null) {
        updateQueue.callbacks = null;
        for (var i = 0; i < callbacks.length; i++) {
            var callback = callbacks[i];
            callCallback(callback, context);
        }
    }
}
exports.commitCallbacks = commitCallbacks;
