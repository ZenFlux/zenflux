"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDidError = exports.renderDidSuspendDelayIfPossible = exports.renderDidSuspend = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
function renderDidSuspend() {
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)() === root_exit_status_1.RootExitStatus.RootInProgress) {
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootSuspended);
    }
}
exports.renderDidSuspend = renderDidSuspend;
function renderDidSuspendDelayIfPossible() {
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootSuspendedWithDelay);
    // Check if there are updates that we skipped tree that might have unblocked
    // this render.
    if (((0, fiber_lane_constants_1.includesNonIdleWork)((0, react_fiber_work_in_progress_1.getWorkInProgressRootSkippedLanes)()) ||
        (0, fiber_lane_constants_1.includesNonIdleWork)((0, react_fiber_work_in_progress_1.getWorkInProgressRootInterleavedUpdatedLanes)()))
        && (0, react_fiber_work_in_progress_1.hasWorkInProgressRoot)()) {
        // Mark the current render as suspended so that we switch to working on
        // the updates that were skipped. Usually we only suspend at the end of
        // the render phase.
        // TODO: We should probably always mark the root as suspended immediately
        // (inside this function), since by suspending at the end of the render
        // phase introduces a potential mistake where we suspend lanes that were
        // pinged or updated while we were rendering.
        // TODO: Consider unwinding immediately, using the
        // SuspendedOnHydration mechanism.
        (0, react_fiber_lane_mark_root_1.markRootSuspended)((0, react_fiber_work_in_progress_1.getWorkInProgressRootSafe)(), (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)(), (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
    }
}
exports.renderDidSuspendDelayIfPossible = renderDidSuspendDelayIfPossible;
function renderDidError(error) {
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)() !== root_exit_status_1.RootExitStatus.RootSuspendedWithDelay) {
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootErrored);
    }
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressRootConcurrentErrors)() === null) {
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootConcurrentErrors)([error]);
    }
    else {
        (0, react_fiber_work_in_progress_1.pushWorkInProgressRootConcurrentError)(error);
    }
}
exports.renderDidError = renderDidError;
