"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureCommitPhaseError = exports.safelyCallDestroy = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_work_running_insertion_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-work-running-insertion-effect");
var react_fiber_work_legacy_error_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary");
var react_captured_value_1 = require("@zenflux/react-reconciler/src/react-captured-value");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var react_fiber_throw_error_update_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-error-update");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
    var errorInfo = (0, react_captured_value_1.createCapturedValueAtFiber)(error, sourceFiber);
    var update = (0, react_fiber_throw_error_update_1.createRootErrorUpdate)(rootFiber, errorInfo, fiber_lane_constants_1.SyncLane);
    var root = (0, react_fiber_class_update_queue_1.enqueueUpdate)(rootFiber, update, fiber_lane_constants_1.SyncLane);
    if (root !== null) {
        (0, react_fiber_lane_mark_root_1.markRootUpdated)(root, fiber_lane_constants_1.SyncLane);
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
    }
}
function safelyCallDestroy(current, nearestMountedAncestor, destroy) {
    try {
        destroy();
    }
    catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
    }
}
exports.safelyCallDestroy = safelyCallDestroy;
function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
    if (__DEV__) {
        (0, react_fiber_commit_work_1.reportUncaughtErrorInDEV)(error);
        (0, react_fiber_work_running_insertion_effect_1.setIsRunningInsertionEffect)(false);
    }
    if (sourceFiber.tag === work_tags_1.WorkTag.HostRoot) {
        // Error was thrown at the root. There is no parent, so the root
        // itself should capture it.
        captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
        return;
    }
    var fiber = nearestMountedAncestor;
    while (fiber !== null) {
        if (fiber.tag === work_tags_1.WorkTag.HostRoot) {
            captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error);
            return;
        }
        else if (fiber.tag === work_tags_1.WorkTag.ClassComponent) {
            var ctor = fiber.type;
            var instance = fiber.stateNode;
            if (typeof ctor.getDerivedStateFromError === "function" || typeof instance.componentDidCatch === "function" && !(0, react_fiber_work_legacy_error_boundary_1.isAlreadyFailedLegacyErrorBoundary)(instance)) {
                var errorInfo = (0, react_captured_value_1.createCapturedValueAtFiber)(error, sourceFiber);
                var update = (0, react_fiber_throw_error_update_1.createClassErrorUpdate)(fiber, errorInfo, fiber_lane_constants_1.SyncLane);
                var root = (0, react_fiber_class_update_queue_1.enqueueUpdate)(fiber, update, fiber_lane_constants_1.SyncLane);
                if (root !== null) {
                    (0, react_fiber_lane_mark_root_1.markRootUpdated)(root, fiber_lane_constants_1.SyncLane);
                    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
                }
                return;
            }
        }
        fiber = fiber.return;
    }
    if (__DEV__) {
        console.error("Internal React error: Attempted to capture a commit phase error " + "inside a detached tree. This indicates a bug in React. Potential " + "causes include deleting the same fiber more than once, committing an " + "already-finished tree, or an inconsistent return pointer.\n\n" + "Error message:\n\n%s", error);
    }
}
exports.captureCommitPhaseError = captureCommitPhaseError;
