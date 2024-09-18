"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareWorkInProgressFreshStack = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_entangled_lane_1 = require("@zenflux/react-reconciler/src/react-entangled-lane");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_suspended_reason_1 = require("@zenflux/react-reconciler/src/react-suspended-reason");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_strict_mode_warnings_1 = require("@zenflux/react-reconciler/src/react-strict-mode-warnings");
var react_fiber_work_in_progress_ex_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-ex");
var _a = globalThis.__RECONCILER__CONFIG__, noTimeout = _a.noTimeout, cancelTimeout = _a.cancelTimeout;
function prepareWorkInProgressFreshStack(root, lanes) {
    // Original name: `prepareFreshStack`
    root.finishedWork = null;
    root.finishedLanes = fiber_lane_constants_1.NoLanes;
    var timeoutHandle = root.timeoutHandle;
    if (timeoutHandle !== noTimeout) {
        // The root previous suspended and scheduled a timeout to commit a fallback
        // state. Now we have additional work, cancel the timeout.
        root.timeoutHandle = noTimeout;
        // $FlowFixMe[incompatible-call] Complains noTimeout is not a TimeoutID, despite the check above
        cancelTimeout(timeoutHandle);
    }
    var cancelPendingCommit = root.cancelPendingCommit;
    if (cancelPendingCommit !== null) {
        root.cancelPendingCommit = null;
        cancelPendingCommit();
    }
    (0, react_fiber_work_in_progress_ex_1.resetWorkInProgressStack)();
    (0, react_fiber_work_in_progress_1.setWorkInProgressRoot)(root);
    var rootWorkInProgress = (0, react_fiber_work_in_progress_ex_1.createWorkInProgress)(root.current, null);
    (0, react_fiber_work_in_progress_1.setWorkInProgress)(rootWorkInProgress);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootRenderLanes)(lanes);
    (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
    (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootDidAttachPingListener)(false);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootInProgress);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootFatalError)(null);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootSkippedLanes)(fiber_lane_constants_1.NoLanes);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootInterleavedUpdatedLanes)(fiber_lane_constants_1.NoLanes);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootRenderPhaseUpdatedLanes)(fiber_lane_constants_1.NoLanes);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootPingedLanes)(fiber_lane_constants_1.NoLanes);
    (0, react_fiber_work_in_progress_1.setWorkInProgressDeferredLane)(fiber_lane_constants_1.NoLane);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootConcurrentErrors)(null);
    (0, react_fiber_work_in_progress_1.setWorkInProgressRootRecoverableErrors)(null);
    // Get the lanes that are entangled with whatever we're about to render. We
    // track these separately so we can distinguish the priority of the render
    // task from the priority of the lanes it is entangled with. For example, a
    // transition may not be allowed to finish unless it includes the Sync lane,
    // which is currently suspended. We should be able to render the Transition
    // and Sync lane in the same batch, but at Transition priority, because the
    // Sync lane already suspended.
    (0, react_entangled_lane_1.setEntangledRenderLanes)((0, react_entangled_lane_1.getEntangledLanes)(root, lanes));
    (0, react_fiber_concurrent_updates_1.finishQueueingConcurrentUpdates)();
    if (__DEV__) {
        react_strict_mode_warnings_1.default.discardPendingWarnings();
    }
    return rootWorkInProgress;
}
exports.prepareWorkInProgressFreshStack = prepareWorkInProgressFreshStack;
