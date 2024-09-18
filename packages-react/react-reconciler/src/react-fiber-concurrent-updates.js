"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsafe_markUpdateLaneFromFiberToRoot = exports.enqueueConcurrentRenderForLane = exports.enqueueConcurrentClassUpdate = exports.enqueueConcurrentHookUpdateAndEagerlyBailout = exports.enqueueConcurrentHookUpdate = exports.getConcurrentlyUpdatedLanes = exports.finishQueueingConcurrentUpdates = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var offscreen_1 = require("@zenflux/react-shared/src/react-internal-constants/offscreen");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_nested_count_1 = require("@zenflux/react-reconciler/src/react-fiber-work-nested-count");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
// If a render is in progress, and we receive an update from a concurrent event,
// we wait until the current render is over (either finished or interrupted)
// before adding it to the fiber/hook queue. Push to this array so we can
// access the queue, fiber, update, et al later.
var concurrentQueues = [];
var concurrentQueuesIndex = 0;
var concurrentlyUpdatedLanes = fiber_lane_constants_1.NoLanes;
function finishQueueingConcurrentUpdates() {
    var endIndex = concurrentQueuesIndex;
    concurrentQueuesIndex = 0;
    concurrentlyUpdatedLanes = fiber_lane_constants_1.NoLanes;
    var i = 0;
    while (i < endIndex) {
        var fiber = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var queue = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var update = concurrentQueues[i];
        concurrentQueues[i++] = null;
        var lane = concurrentQueues[i];
        concurrentQueues[i++] = null;
        if (queue !== null && update !== null) {
            var pending_1 = queue.pending;
            if (pending_1 === null) {
                // This is the first update. Create a circular list.
                update.next = update;
            }
            else {
                update.next = pending_1.next;
                pending_1.next = update;
            }
            queue.pending = update;
        }
        if (lane !== fiber_lane_constants_1.NoLane) {
            markUpdateLaneFromFiberToRoot(fiber, update, lane);
        }
    }
}
exports.finishQueueingConcurrentUpdates = finishQueueingConcurrentUpdates;
function getConcurrentlyUpdatedLanes() {
    return concurrentlyUpdatedLanes;
}
exports.getConcurrentlyUpdatedLanes = getConcurrentlyUpdatedLanes;
function enqueueUpdate(fiber, queue, update, lane) {
    // Don't update the `childLanes` on the return path yet. If we already in
    // the middle of rendering, wait until after it has completed.
    concurrentQueues[concurrentQueuesIndex++] = fiber;
    concurrentQueues[concurrentQueuesIndex++] = queue;
    concurrentQueues[concurrentQueuesIndex++] = update;
    concurrentQueues[concurrentQueuesIndex++] = lane;
    concurrentlyUpdatedLanes = (0, react_fiber_lane_1.mergeLanes)(concurrentlyUpdatedLanes, lane);
    // The fiber's `lane` field is used in some places to check if any work is
    // scheduled, to perform an eager bailout, so we need to update it immediately.
    // TODO: We should probably move this to the "shared" queue instead.
    fiber.lanes = (0, react_fiber_lane_1.mergeLanes)(fiber.lanes, lane);
    var alternate = fiber.alternate;
    if (alternate !== null) {
        alternate.lanes = (0, react_fiber_lane_1.mergeLanes)(alternate.lanes, lane);
    }
}
function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
    var concurrentQueue = queue;
    var concurrentUpdate = update;
    enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
    return getRootForUpdatedFiber(fiber);
}
exports.enqueueConcurrentHookUpdate = enqueueConcurrentHookUpdate;
function enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update) {
    // This function is used to queue an update that doesn't need a rerender. The
    // only reason we queue it is in case there's a subsequent higher priority
    // update that causes it to be rebased.
    var lane = fiber_lane_constants_1.NoLane;
    var concurrentQueue = queue;
    var concurrentUpdate = update;
    enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
    // Usually we can rely on the upcoming render phase to process the concurrent
    // queue. However, since this is a bail out, we're not scheduling any work
    // here. So the update we just queued will leak until something else happens
    // to schedule work (if ever).
    //
    // Check if we're currently in the middle of rendering a tree, and if not,
    // process the queue immediately to prevent a leak.
    var isConcurrentlyRendering = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() !== null;
    if (!isConcurrentlyRendering) {
        finishQueueingConcurrentUpdates();
    }
}
exports.enqueueConcurrentHookUpdateAndEagerlyBailout = enqueueConcurrentHookUpdateAndEagerlyBailout;
function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
    var concurrentQueue = queue;
    var concurrentUpdate = update;
    enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
    return getRootForUpdatedFiber(fiber);
}
exports.enqueueConcurrentClassUpdate = enqueueConcurrentClassUpdate;
function enqueueConcurrentRenderForLane(fiber, lane) {
    enqueueUpdate(fiber, null, null, lane);
    return getRootForUpdatedFiber(fiber);
}
exports.enqueueConcurrentRenderForLane = enqueueConcurrentRenderForLane;
// Calling this function outside this module should only be done for backwards
// compatibility and should always be accompanied by a warning.
function unsafe_markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
    // NOTE: For Hyrum's Law reasons, if an infinite update loop is detected, it
    // should throw before `markUpdateLaneFromFiberToRoot` is called. But this is
    // undefined behavior and we can change it if we need to; it just so happens
    // that, at the time of this writing, there's an internal product test that
    // happens to rely on this.
    var root = getRootForUpdatedFiber(sourceFiber);
    markUpdateLaneFromFiberToRoot(sourceFiber, null, lane);
    return root;
}
exports.unsafe_markUpdateLaneFromFiberToRoot = unsafe_markUpdateLaneFromFiberToRoot;
function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
    // Update the source fiber's lanes
    sourceFiber.lanes = (0, react_fiber_lane_1.mergeLanes)(sourceFiber.lanes, lane);
    var alternate = sourceFiber.alternate;
    if (alternate !== null) {
        alternate.lanes = (0, react_fiber_lane_1.mergeLanes)(alternate.lanes, lane);
    }
    // Walk the parent path to the root and update the child lanes.
    var isHidden = false;
    var parent = sourceFiber.return;
    var node = sourceFiber;
    while (parent !== null) {
        parent.childLanes = (0, react_fiber_lane_1.mergeLanes)(parent.childLanes, lane);
        alternate = parent.alternate;
        if (alternate !== null) {
            alternate.childLanes = (0, react_fiber_lane_1.mergeLanes)(alternate.childLanes, lane);
        }
        if (parent.tag === work_tags_1.WorkTag.OffscreenComponent) {
            // Check if this offscreen boundary is currently hidden.
            //
            // The instance may be null if the Offscreen parent was unmounted. Usually
            // the parent wouldn't be reachable in that case because we disconnect
            // fibers from the tree when they are deleted. However, there's a weird
            // edge case where setState is called on a fiber that was interrupted
            // before it ever mounted. Because it never mounts, it also never gets
            // deleted. Because it never gets deleted, its return pointer never gets
            // disconnected. Which means it may be attached to a deleted Offscreen
            // parent node. (This discovery suggests it may be better for memory usage
            // if we don't attach the `return` pointer until the commit phase, though
            // in order to do that we'd need some other way to track the return
            // pointer during the initial render, like on the stack.)
            //
            // This case is always accompanied by a warning, but we still need to
            // account for it. (There may be other cases that we haven't discovered,
            // too.)
            var offscreenInstance = parent.stateNode;
            if (offscreenInstance !== null && !(offscreenInstance._visibility & offscreen_1.OffscreenVisible)) {
                isHidden = true;
            }
        }
        node = parent;
        parent = parent.return;
    }
    if (isHidden && update !== null && node.tag === work_tags_1.WorkTag.HostRoot) {
        var root = node.stateNode;
        (0, react_fiber_lane_1.markHiddenUpdate)(root, update, lane);
    }
}
function getRootForUpdatedFiber(sourceFiber) {
    // TODO: We will detect and infinite update loop and throw even if this fiber
    // has already unmounted. This isn't really necessary but it happens to be the
    // current behavior we've used for several release cycles. Consider not
    // performing this check if the updated fiber already unmounted, since it's
    // not possible for that to cause an infinite update loop.
    (0, react_fiber_work_nested_count_1.throwIfInfiniteUpdateLoopDetected)();
    // When a setState happens, we must ensure the root is scheduled. Because
    // update queues do not have a backpointer to the root, the only way to do
    // this currently is to walk up the return path. This used to not be a big
    // deal because we would have to walk up the return path to set
    // the `childLanes`, anyway, but now those two traversals happen at
    // different times.
    // TODO: Consider adding a `root` backpointer on the update queue.
    detectUpdateOnUnmountedFiber(sourceFiber, sourceFiber);
    var node = sourceFiber;
    var parent = node.return;
    while (parent !== null) {
        detectUpdateOnUnmountedFiber(sourceFiber, node);
        node = parent;
        parent = node.return;
    }
    return node.tag === work_tags_1.WorkTag.HostRoot ? node.stateNode : null;
}
var didWarnStateUpdateForNotYetMountedComponent = null;
function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {
    if (__DEV__) {
        if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderDeactivate)()) {
            // We let the other warning about render phase updates deal with this one.
            return;
        }
        if (!(fiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode)) {
            return;
        }
        var tag = fiber.tag;
        if (tag !== work_tags_1.WorkTag.IndeterminateComponent && tag !== work_tags_1.WorkTag.HostRoot && tag !== work_tags_1.WorkTag.ClassComponent && tag !== work_tags_1.WorkTag.FunctionComponent && tag !== work_tags_1.WorkTag.ForwardRef && tag !== work_tags_1.WorkTag.MemoComponent && tag !== work_tags_1.WorkTag.SimpleMemoComponent) {
            // Only warn for user-defined components, not internal ones like Suspense.
            return;
        }
        // We show the whole stack but dedupe on the top component's name because
        // the problematic code almost always lies inside that component.
        var componentName = (0, react_get_component_name_from_fiber_1.default)(fiber) || "ReactComponent";
        if (didWarnStateUpdateForNotYetMountedComponent !== null) {
            if (didWarnStateUpdateForNotYetMountedComponent.has(componentName)) {
                return;
            }
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            didWarnStateUpdateForNotYetMountedComponent.add(componentName);
        }
        else {
            didWarnStateUpdateForNotYetMountedComponent = new Set([componentName]);
        }
        var previousFiber = react_current_fiber_1.current;
        try {
            (0, react_current_fiber_1.setCurrentFiber)(fiber);
            console.error("Can't perform a React state update on a component that hasn't mounted yet. " + "This indicates that you have a side-effect in your render function that " + "asynchronously later calls tries to update the component. Move this work to " + "useEffect instead.");
        }
        finally {
            if (previousFiber) {
                (0, react_current_fiber_1.setCurrentFiber)(fiber);
            }
            else {
                (0, react_current_fiber_1.resetCurrentFiber)();
            }
        }
    }
}
function detectUpdateOnUnmountedFiber(sourceFiber, parent) {
    if (__DEV__) {
        var alternate = parent.alternate;
        if (alternate === null && (parent.flags & (fiber_flags_1.FiberFlags.Placement | fiber_flags_1.FiberFlags.Hydrating)) !== fiber_flags_1.FiberFlags.NoFlags) {
            warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
        }
    }
}
