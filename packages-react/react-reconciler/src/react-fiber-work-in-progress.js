"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueRecoverableErrors = exports.resetWorkInProgress = exports.resetWorkInProgressRootRenderTimer = exports.pushWorkInProgressRootRecoverableErrors = exports.pushWorkInProgressRootConcurrentError = exports.orWorkInProgressRootInterleavedUpdatedLanes = exports.markSkippedUpdateLanes = exports.setWorkInProgressDeferredLane = exports.setWorkInProgressRootRenderPhaseUpdatedLanes = exports.setWorkInProgressRootInterleavedUpdatedLanes = exports.setWorkInProgressRootFatalError = exports.setWorkInProgressRootSkippedLanes = exports.setWorkInProgressRootRecoverableErrors = exports.setWorkInProgressRootConcurrentErrors = exports.setWorkInProgressTransitions = exports.setWorkInProgressRootDidAttachPingListener = exports.setWorkInProgressRootRenderTargetTime = exports.setWorkInProgressThrownValue = exports.setWorkInProgressSuspendedReason = exports.setWorkInProgressRootExitStatus = exports.setWorkInProgressRootPingedLanes = exports.setWorkInProgressRootRenderLanes = exports.setWorkInProgressRoot = exports.setWorkInProgress = exports.hasWorkInProgressRoot = exports.isWorkLoopSuspendedOnData = exports.didWorkInProgressRootDidAttachPingListener = exports.getWorkInProgressRootRenderPhaseUpdatedLanes = exports.getWorkInProgressRootFatalError = exports.getWorkInProgressRootRecoverableErrors = exports.getWorkInProgressRootInterleavedUpdatedLanes = exports.getWorkInProgressRootSkippedLanes = exports.getWorkInProgressDeferredLane = exports.getWorkInProgressRootConcurrentErrors = exports.getWorkInProgressThrownValue = exports.getWorkInProgressSuspendedReason = exports.getWorkInProgressRootRenderTargetTime = exports.getWorkInProgressRootPingedLanes = exports.getWorkInProgressRootExitStatus = exports.getWorkInProgressRootRenderLanes = exports.getWorkInProgressRootSafe = exports.getWorkInProgressRoot = exports.getWorkInProgressTransitions = exports.getWorkInProgressSafe = exports.getWorkInProgress = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_scheduler_1 = require("@zenflux/react-scheduler");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_suspended_reason_1 = require("@zenflux/react-reconciler/src/react-suspended-reason");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.
var RENDER_TIMEOUT_MS = 500;
// The root we're working on
var workInProgressRoot = null;
// The fiber we're working on
var workInProgress = null;
// The lanes we're rendering
var workInProgressRootRenderLanes = fiber_lane_constants_1.NoLanes;
// When this is true, the work-in-progress fiber just suspended (or errored) and
// we've yet to unwind the stack. In some cases, we may yield to the main thread
// after this happens. If the fiber is pinged before we resume, we can retry
// immediately instead of unwinding the stack.
var workInProgressSuspendedReason = react_suspended_reason_1.SuspendedReason.NotSuspended;
var workInProgressThrownValue = null;
// Whether a ping listener was attached during this render. This is slightly
// different is whether something suspended, because we don't add multiple
// listeners to a promise we've already seen (per root and lane).
var workInProgressRootDidAttachPingListener = false;
// Whether to root completed, errored, suspended, etc.
var workInProgressRootExitStatus = root_exit_status_1.RootExitStatus.RootInProgress;
// A fatal error, if one is thrown
var workInProgressRootFatalError = null;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
var workInProgressRootSkippedLanes = fiber_lane_constants_1.NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
var workInProgressRootInterleavedUpdatedLanes = fiber_lane_constants_1.NoLanes;
// Lanes that were updated during the render phase (*not* an interleaved event).
var workInProgressRootRenderPhaseUpdatedLanes = fiber_lane_constants_1.NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
var workInProgressRootPingedLanes = fiber_lane_constants_1.NoLanes;
// If this lane scheduled deferred work, this is the lane of the deferred task.
var workInProgressDeferredLane = fiber_lane_constants_1.NoLane;
// Errors that are thrown during the render phase.
var workInProgressRootConcurrentErrors = null;
// These are errors that we recovered from without surfacing them to the UI.
// We will log them once the tree commits.
var workInProgressRootRecoverableErrors = null;
// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
var workInProgressRootRenderTargetTime = Infinity;
var workInProgressTransitions = null;
// ----
// Get
// ----
function getWorkInProgress() {
    return workInProgress;
}
exports.getWorkInProgress = getWorkInProgress;
function getWorkInProgressSafe() {
    return workInProgress;
}
exports.getWorkInProgressSafe = getWorkInProgressSafe;
function getWorkInProgressTransitions() {
    return workInProgressTransitions;
}
exports.getWorkInProgressTransitions = getWorkInProgressTransitions;
function getWorkInProgressRoot() {
    return workInProgressRoot;
}
exports.getWorkInProgressRoot = getWorkInProgressRoot;
function getWorkInProgressRootSafe() {
    return workInProgressRoot;
}
exports.getWorkInProgressRootSafe = getWorkInProgressRootSafe;
function getWorkInProgressRootRenderLanes() {
    return workInProgressRootRenderLanes;
}
exports.getWorkInProgressRootRenderLanes = getWorkInProgressRootRenderLanes;
function getWorkInProgressRootExitStatus() {
    return workInProgressRootExitStatus;
}
exports.getWorkInProgressRootExitStatus = getWorkInProgressRootExitStatus;
function getWorkInProgressRootPingedLanes() {
    return workInProgressRootPingedLanes;
}
exports.getWorkInProgressRootPingedLanes = getWorkInProgressRootPingedLanes;
function getWorkInProgressRootRenderTargetTime() {
    return workInProgressRootRenderTargetTime;
}
exports.getWorkInProgressRootRenderTargetTime = getWorkInProgressRootRenderTargetTime;
function getWorkInProgressSuspendedReason() {
    return workInProgressSuspendedReason;
}
exports.getWorkInProgressSuspendedReason = getWorkInProgressSuspendedReason;
function getWorkInProgressThrownValue() {
    return workInProgressThrownValue;
}
exports.getWorkInProgressThrownValue = getWorkInProgressThrownValue;
function getWorkInProgressRootConcurrentErrors() {
    return workInProgressRootConcurrentErrors;
}
exports.getWorkInProgressRootConcurrentErrors = getWorkInProgressRootConcurrentErrors;
function getWorkInProgressDeferredLane() {
    return workInProgressDeferredLane;
}
exports.getWorkInProgressDeferredLane = getWorkInProgressDeferredLane;
function getWorkInProgressRootSkippedLanes() {
    return workInProgressRootSkippedLanes;
}
exports.getWorkInProgressRootSkippedLanes = getWorkInProgressRootSkippedLanes;
function getWorkInProgressRootInterleavedUpdatedLanes() {
    return workInProgressRootInterleavedUpdatedLanes;
}
exports.getWorkInProgressRootInterleavedUpdatedLanes = getWorkInProgressRootInterleavedUpdatedLanes;
function getWorkInProgressRootRecoverableErrors() {
    return workInProgressRootRecoverableErrors;
}
exports.getWorkInProgressRootRecoverableErrors = getWorkInProgressRootRecoverableErrors;
function getWorkInProgressRootFatalError() {
    return workInProgressRootFatalError;
}
exports.getWorkInProgressRootFatalError = getWorkInProgressRootFatalError;
function getWorkInProgressRootRenderPhaseUpdatedLanes() {
    return workInProgressRootRenderPhaseUpdatedLanes;
}
exports.getWorkInProgressRootRenderPhaseUpdatedLanes = getWorkInProgressRootRenderPhaseUpdatedLanes;
// ----
// Did
// ----
function didWorkInProgressRootDidAttachPingListener() {
    return workInProgressRootDidAttachPingListener;
}
exports.didWorkInProgressRootDidAttachPingListener = didWorkInProgressRootDidAttachPingListener;
// ----
// Is
// ----
function isWorkLoopSuspendedOnData() {
    return workInProgressSuspendedReason === react_suspended_reason_1.SuspendedReason.SuspendedOnData;
}
exports.isWorkLoopSuspendedOnData = isWorkLoopSuspendedOnData;
// ----
// Has
// ----
function hasWorkInProgressRoot() {
    return workInProgressRoot !== null;
}
exports.hasWorkInProgressRoot = hasWorkInProgressRoot;
// ----
// Set
// ----
function setWorkInProgress(fiber) {
    workInProgress = fiber;
}
exports.setWorkInProgress = setWorkInProgress;
function setWorkInProgressRoot(root) {
    workInProgressRoot = root;
}
exports.setWorkInProgressRoot = setWorkInProgressRoot;
function setWorkInProgressRootRenderLanes(lanes) {
    workInProgressRootRenderLanes = lanes;
}
exports.setWorkInProgressRootRenderLanes = setWorkInProgressRootRenderLanes;
function setWorkInProgressRootPingedLanes(lanes) {
    workInProgressRootPingedLanes = lanes;
}
exports.setWorkInProgressRootPingedLanes = setWorkInProgressRootPingedLanes;
function setWorkInProgressRootExitStatus(status) {
    workInProgressRootExitStatus = status;
}
exports.setWorkInProgressRootExitStatus = setWorkInProgressRootExitStatus;
function setWorkInProgressSuspendedReason(reason) {
    workInProgressSuspendedReason = reason;
}
exports.setWorkInProgressSuspendedReason = setWorkInProgressSuspendedReason;
function setWorkInProgressThrownValue(value) {
    workInProgressThrownValue = value;
}
exports.setWorkInProgressThrownValue = setWorkInProgressThrownValue;
function setWorkInProgressRootRenderTargetTime(time) {
    workInProgressRootRenderTargetTime = time;
}
exports.setWorkInProgressRootRenderTargetTime = setWorkInProgressRootRenderTargetTime;
function setWorkInProgressRootDidAttachPingListener(didAttach) {
    workInProgressRootDidAttachPingListener = didAttach;
}
exports.setWorkInProgressRootDidAttachPingListener = setWorkInProgressRootDidAttachPingListener;
function setWorkInProgressTransitions(transitions) {
    workInProgressTransitions = transitions;
}
exports.setWorkInProgressTransitions = setWorkInProgressTransitions;
function setWorkInProgressRootConcurrentErrors(errors) {
    workInProgressRootConcurrentErrors = errors;
}
exports.setWorkInProgressRootConcurrentErrors = setWorkInProgressRootConcurrentErrors;
function setWorkInProgressRootRecoverableErrors(errors) {
    workInProgressRootRecoverableErrors = errors;
}
exports.setWorkInProgressRootRecoverableErrors = setWorkInProgressRootRecoverableErrors;
function setWorkInProgressRootSkippedLanes(lanes) {
    workInProgressRootSkippedLanes = lanes;
}
exports.setWorkInProgressRootSkippedLanes = setWorkInProgressRootSkippedLanes;
function setWorkInProgressRootFatalError(error) {
    workInProgressRootFatalError = error;
}
exports.setWorkInProgressRootFatalError = setWorkInProgressRootFatalError;
function setWorkInProgressRootInterleavedUpdatedLanes(lanes) {
    workInProgressRootInterleavedUpdatedLanes = lanes;
}
exports.setWorkInProgressRootInterleavedUpdatedLanes = setWorkInProgressRootInterleavedUpdatedLanes;
function setWorkInProgressRootRenderPhaseUpdatedLanes(lanes) {
    workInProgressRootRenderPhaseUpdatedLanes = lanes;
}
exports.setWorkInProgressRootRenderPhaseUpdatedLanes = setWorkInProgressRootRenderPhaseUpdatedLanes;
function setWorkInProgressDeferredLane(lane) {
    workInProgressDeferredLane = lane;
}
exports.setWorkInProgressDeferredLane = setWorkInProgressDeferredLane;
function markSkippedUpdateLanes(lane) {
    // Original name: `markSkippedUpdateLanes`.
    // TODO: Change to `markWorkInProgressRootSkippedLanes`.
    setWorkInProgressRootSkippedLanes((0, react_fiber_lane_1.mergeLanes)(lane, getWorkInProgressRootSkippedLanes()));
}
exports.markSkippedUpdateLanes = markSkippedUpdateLanes;
// ----
// Or
// ----
function orWorkInProgressRootInterleavedUpdatedLanes(lanes) {
    workInProgressRootInterleavedUpdatedLanes |= lanes;
}
exports.orWorkInProgressRootInterleavedUpdatedLanes = orWorkInProgressRootInterleavedUpdatedLanes;
// ----
// Push
// ----
function pushWorkInProgressRootConcurrentError(capturedError) {
    // @ts-ignore
    workInProgressRootConcurrentErrors.push(capturedError);
}
exports.pushWorkInProgressRootConcurrentError = pushWorkInProgressRootConcurrentError;
function pushWorkInProgressRootRecoverableErrors(capturedErrors) {
    // @ts-ignore
    workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, capturedErrors);
}
exports.pushWorkInProgressRootRecoverableErrors = pushWorkInProgressRootRecoverableErrors;
// ----
// Reset
// ----
function resetWorkInProgressRootRenderTimer() {
    setWorkInProgressRootRenderTargetTime((0, react_scheduler_1.unstable_now)() + RENDER_TIMEOUT_MS);
}
exports.resetWorkInProgressRootRenderTimer = resetWorkInProgressRootRenderTimer;
// Used to reuse a Fiber for a second pass.
function resetWorkInProgress(workInProgress, renderLanes) {
    // This resets the Fiber to what createFiber or createWorkInProgress would
    // have set the values to before during the first pass. Ideally this wouldn't
    // be necessary but unfortunately many code paths reads from the workInProgress
    // when they should be reading from current and writing to workInProgress.
    // We assume pendingProps, index, key, ref, return are still untouched to
    // avoid doing another reconciliation.
    // Reset the effect flags but keep any Placement tags, since that's something
    // that child fiber is setting, not the reconciliation.
    workInProgress.flags &= fiber_flags_1.FiberFlags.StaticMask | fiber_flags_1.FiberFlags.Placement;
    // The effects are no longer valid.
    var current = workInProgress.alternate;
    if (current === null) {
        // Reset to createFiber's initial values.
        workInProgress.childLanes = fiber_lane_constants_1.NoLanes;
        workInProgress.lanes = renderLanes;
        workInProgress.child = null;
        workInProgress.subtreeFlags = fiber_flags_1.FiberFlags.NoFlags;
        workInProgress.memoizedProps = null;
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        workInProgress.dependencies = null;
        workInProgress.stateNode = null;
        if (react_feature_flags_1.enableProfilerTimer) {
            // Note: We don't reset the actualTime counts. It's useful to accumulate
            // actual time across multiple render passes.
            workInProgress.selfBaseDuration = 0;
            workInProgress.treeBaseDuration = 0;
        }
    }
    else {
        // Reset to the cloned values that createWorkInProgress would've.
        workInProgress.childLanes = current.childLanes;
        workInProgress.lanes = current.lanes;
        workInProgress.child = current.child;
        workInProgress.subtreeFlags = fiber_flags_1.FiberFlags.NoFlags;
        workInProgress.deletions = null;
        workInProgress.memoizedProps = current.memoizedProps;
        workInProgress.memoizedState = current.memoizedState;
        workInProgress.updateQueue = current.updateQueue;
        // Needed because Blocks store data on type.
        workInProgress.type = current.type;
        // Clone the dependencies object. This is mutated during the render phase, so
        // it cannot be shared with the current fiber.
        var currentDependencies = current.dependencies;
        workInProgress.dependencies = currentDependencies === null ? null : {
            lanes: currentDependencies.lanes,
            firstContext: currentDependencies.firstContext
        };
        if (react_feature_flags_1.enableProfilerTimer) {
            // Note: We don't reset the actualTime counts. It's useful to accumulate
            // actual time across multiple render passes.
            workInProgress.selfBaseDuration = current.selfBaseDuration;
            workInProgress.treeBaseDuration = current.treeBaseDuration;
        }
    }
    return workInProgress;
}
exports.resetWorkInProgress = resetWorkInProgress;
function queueRecoverableErrors(errors) {
    if (getWorkInProgressRootRecoverableErrors() === null) {
        setWorkInProgressRootRecoverableErrors(errors);
    }
    else {
        // $FlowFixMe[method-unbinding]
        // WorkInProgressRootRecoverableErrors.push.apply( WorkInProgressRootRecoverableErrors, errors );
        pushWorkInProgressRootRecoverableErrors(errors);
    }
}
exports.queueRecoverableErrors = queueRecoverableErrors;
