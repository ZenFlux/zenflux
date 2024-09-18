"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSuspenseComponent = void 0;
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_fiber_suspense_context_1 = require("@zenflux/react-reconciler/src/react-fiber-suspense-context");
var react_fiber_work_in_progress_render_did_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-render-did");
var react_fiber_thenable_1 = require("@zenflux/react-reconciler/src/react-fiber-thenable");
var react_fiber_work_in_progress_ping_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-ping");
var react_fiber_throw_suspense_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-suspense-boundary");
function handleSuspenseComponent(sourceFiber, returnFiber, suspenseBoundary, root, rootRenderLanes, wakeable) {
    // If this suspense boundary is not already showing a fallback, mark
    // the in-progress render as suspended. We try to perform this logic
    // as soon as soon as possible during the render phase, so the work
    // loop can know things like whether it's OK to switch to other tasks,
    // or whether it can wait for data to resolve before continuing.
    // TODO: Most of these checks are already performed when entering a
    // Suspense boundary. We should track the information on the stack so
    // we don't have to recompute it on demand. This would also allow us
    // to unify with `use` which needs to perform this logic even sooner,
    // before `throwException` is called.
    if (sourceFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
        if ((0, react_fiber_suspense_context_1.getShellBoundary)() === null) {
            // Suspended in the "shell" of the app. This is an undesirable
            // loading state. We should avoid committing this tree.
            (0, react_fiber_work_in_progress_render_did_1.renderDidSuspendDelayIfPossible)();
        }
        else {
            // If we suspended deeper than the shell, we don't need to delay
            // the commmit. However, we still call renderDidSuspend if this is
            // a new boundary, to tell the work loop that a new fallback has
            // appeared during this render.
            // TODO: Theoretically we should be able to delete this branch.
            // It's currently used for two things: 1) to throttle the
            // appearance of successive loading states, and 2) in
            // SuspenseList, to determine whether the children include any
            // pending fallbacks. For 1, we should apply throttling to all
            // retries, not just ones that render an additional fallback. For
            // 2, we should check subtreeFlags instead. Then we can delete
            // this branch.
            var current = suspenseBoundary.alternate;
            if (current === null) {
                (0, react_fiber_work_in_progress_render_did_1.renderDidSuspend)();
            }
        }
    }
    suspenseBoundary.flags &= ~fiber_flags_1.FiberFlags.ForceClientRender;
    (0, react_fiber_throw_suspense_boundary_1.markSuspenseBoundaryShouldCapture)(suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes);
    // Retry listener
    //
    // If the fallback does commit, we need to attach a different type of
    // listener. This one schedules an update on the Suspense boundary to
    // turn the fallback state off.
    //
    // Stash the wakeable on the boundary fiber so we can access it in the
    // commit phase.
    //
    // When the wakeable resolves, we'll attempt to render the boundary
    // again ("retry").
    // Check if this is a Suspensey resource. We do not attach retry
    // listeners to these, because we don't actually need them for
    // rendering. Only for committing. Instead, if a fallback commits
    // and the only thing that suspended was a Suspensey resource, we
    // retry immediately.
    // TODO: Refactor throwException so that we don't have to do this type
    // check. The caller already knows what the cause was.
    var isSuspenseyResource = wakeable === react_fiber_thenable_1.noopSuspenseyCommitThenable;
    if (isSuspenseyResource) {
        suspenseBoundary.flags |= fiber_flags_1.FiberFlags.ScheduleRetry;
    }
    else {
        var retryQueue = suspenseBoundary.updateQueue;
        if (retryQueue === null) {
            suspenseBoundary.updateQueue = new Set([wakeable]);
        }
        else {
            retryQueue.add(wakeable);
        }
        // We only attach ping listeners in concurrent mode. Legacy
        // Suspense always commits fallbacks synchronously, so there are
        // no pings.
        if (suspenseBoundary.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
            (0, react_fiber_work_in_progress_ping_1.attachPingListener)(root, wakeable, rootRenderLanes);
        }
    }
}
exports.handleSuspenseComponent = handleSuspenseComponent;
