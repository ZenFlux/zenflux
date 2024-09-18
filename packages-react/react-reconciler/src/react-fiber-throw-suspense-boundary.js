"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markSuspenseBoundaryShouldCapture = void 0;
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
function markSuspenseBoundaryShouldCapture(suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes) {
    // This marks a Suspense boundary so that when we're unwinding the stack,
    // it captures the suspended "exception" and does a second (fallback) pass.
    if ((suspenseBoundary.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
        // Legacy Mode Suspense
        //
        // If the boundary is in legacy mode, we should *not*
        // suspend the commit. Pretend as if the suspended component rendered
        // null and keep rendering. When the Suspense boundary completes,
        // we'll do a second pass to render the fallback.
        if (suspenseBoundary === returnFiber) {
            // Special case where we suspended while reconciling the children of
            // a Suspense boundary's inner Offscreen wrapper fiber. This happens
            // when a React.lazy component is a direct child of a
            // Suspense boundary.
            //
            // Suspense boundaries are implemented as multiple fibers, but they
            // are a single conceptual unit. The legacy mode behavior where we
            // pretend the suspended fiber committed as `null` won't work,
            // because in this case the "suspended" fiber is the inner
            // Offscreen wrapper.
            //
            // Because the contents of the boundary haven't started rendering
            // yet (i.e. nothing in the tree has partially rendered) we can
            // switch to the regular, concurrent mode behavior: mark the
            // boundary with ShouldCapture and enter the unwind phase.
            suspenseBoundary.flags |= fiber_flags_1.FiberFlags.ShouldCapture;
        }
        else {
            suspenseBoundary.flags |= fiber_flags_1.FiberFlags.DidCapture;
            sourceFiber.flags |= fiber_flags_1.FiberFlags.ForceUpdateForLegacySuspense;
            // We're going to commit this fiber even though it didn't complete.
            // But we shouldn't call any lifecycle methods or callbacks. Remove
            // all lifecycle effect tags.
            sourceFiber.flags &= ~(fiber_flags_1.FiberFlags.LifecycleEffectMask | fiber_flags_1.FiberFlags.Incomplete);
            if (sourceFiber.tag === work_tags_1.WorkTag.ClassComponent) {
                var currentSourceFiber = sourceFiber.alternate;
                if (currentSourceFiber === null) {
                    // This is a new mount. Change the tag so it's not mistaken for a
                    // completed class component. For example, we should not call
                    // componentWillUnmount if it is deleted.
                    sourceFiber.tag = work_tags_1.WorkTag.IncompleteClassComponent;
                }
                else {
                    // When we try rendering again, we should not reuse the current fiber,
                    // since it's known to be in an inconsistent state. Use a force update to
                    // prevent a bail out.
                    var update = (0, react_fiber_class_update_queue_1.createUpdate)(fiber_lane_constants_1.SyncLane);
                    update.tag = react_fiber_class_update_queue_1.ForceUpdate;
                    (0, react_fiber_class_update_queue_1.enqueueUpdate)(sourceFiber, update, fiber_lane_constants_1.SyncLane);
                }
            }
            // The source fiber did not complete. Mark it with Sync priority to
            // indicate that it still has pending work.
            sourceFiber.lanes = (0, react_fiber_lane_1.mergeLanes)(sourceFiber.lanes, fiber_lane_constants_1.SyncLane);
        }
        return suspenseBoundary;
    }
    // Confirmed that the boundary is in a concurrent mode tree. Continue
    // with the normal suspend path.
    //
    // After this we'll use a set of heuristics to determine whether this
    // render pass will run to completion or restart or "suspend" the commit.
    // The actual logic for this is spread out in different places.
    //
    // This first principle is that if we're going to suspend when we complete
    // a root, then we should also restart if we get an update or ping that
    // might unsuspend it, and vice versa. The only reason to suspend is
    // because you think you might want to restart before committing. However,
    // it doesn't make sense to restart only while in the period we're suspended.
    //
    // Restarting too aggressively is also not good because it starves out any
    // intermediate loading state. So we use heuristics to determine when.
    // Suspense Heuristics
    //
    // If nothing threw a Promise or all the same fallbacks are already showing,
    // then don't suspend/restart.
    //
    // If this is an initial render of a new tree of Suspense boundaries and
    // those trigger a fallback, then don't suspend/restart. We want to ensure
    // that we can show the initial loading state as quickly as possible.
    //
    // If we hit a "Delayed" case, such as when we'd switch from content back into
    // a fallback, then we should always suspend/restart. Transitions apply
    // to this case. If none is defined, JND is used instead.
    //
    // If we're already showing a fallback and it gets "retried", allowing us to show
    // another level, but there's still an inner boundary that would show a fallback,
    // then we suspend/restart for 500ms since the last time we showed a fallback
    // anywhere in the tree. This effectively throttles progressive loading into a
    // consistent train of commits. This also gives us an opportunity to restart to
    // get to the completed state slightly earlier.
    //
    // If there's ambiguity due to batching it's resolved in preference of:
    // 1) "delayed", 2) "initial render", 3) "retry".
    //
    // We want to ensure that a "busy" state doesn't get force committed. We want to
    // ensure that new initial loading states can commit as soon as possible.
    suspenseBoundary.flags |= fiber_flags_1.FiberFlags.ShouldCapture;
    // TODO: I think we can remove this, since we now use `DidCapture` in
    // the begin phase to prevent an early bailout.
    suspenseBoundary.lanes = rootRenderLanes;
    return suspenseBoundary;
}
exports.markSuspenseBoundaryShouldCapture = markSuspenseBoundaryShouldCapture;
