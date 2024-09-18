"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkInProgress = exports.resetWorkInProgressStack = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
var react_fiber_hot_reloading_resvole_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole");
var react_suspended_reason_1 = require("@zenflux/react-reconciler/src/react-suspended-reason");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_unwind_1 = require("@zenflux/react-reconciler/src/react-fiber-work-unwind");
var react_fiber_unwind_work_1 = require("@zenflux/react-reconciler/src/react-fiber-unwind-work");
function resetWorkInProgressStack() {
    if ((0, react_fiber_work_in_progress_1.getWorkInProgress)() === null)
        return;
    var interruptedWork;
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)() === react_suspended_reason_1.SuspendedReason.NotSuspended) {
        // Normal case. Work-in-progress hasn't started yet. Unwind all
        // its parents.
        interruptedWork = (0, react_fiber_work_in_progress_1.getWorkInProgressSafe)().return;
    }
    else {
        // Work-in-progress is in suspended state. Reset the work loop and unwind
        // both the suspended fiber and all its parents.
        (0, react_fiber_work_unwind_1.resetSuspendedWorkLoopOnUnwind)((0, react_fiber_work_in_progress_1.getWorkInProgressSafe)());
        interruptedWork = (0, react_fiber_work_in_progress_1.getWorkInProgressSafe)();
    }
    while (interruptedWork !== null) {
        var current = interruptedWork.alternate;
        (0, react_fiber_unwind_work_1.unwindInterruptedWork)(current, interruptedWork, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
        interruptedWork = interruptedWork.return;
    }
    (0, react_fiber_work_in_progress_1.setWorkInProgress)(null);
}
exports.resetWorkInProgressStack = resetWorkInProgressStack;
// This is used to create an alternate fiber to do work on.
function createWorkInProgress(current, pendingProps) {
    var workInProgress = current.alternate;
    if (workInProgress === null) {
        // We use a double buffering pooling technique because we know that we'll
        // only ever need at most two versions of a tree. We pool the "other" unused
        // node that we're free to reuse. This is lazily created to avoid allocating
        // extra objects for things that are never updated. It also allow us to
        // reclaim the extra memory if needed.
        workInProgress = (0, react_fiber_1.createFiber)(current.tag, pendingProps, current.key, current.mode);
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        if (__DEV__) {
            // DEV-only fields
            workInProgress._debugSource = current._debugSource;
            workInProgress._debugOwner = current._debugOwner;
            workInProgress._debugHookTypes = current._debugHookTypes;
        }
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    }
    else {
        workInProgress.pendingProps = pendingProps;
        // Needed because Blocks store data on type.
        workInProgress.type = current.type;
        // We already have an alternate.
        // Reset the effect tag.
        workInProgress.flags = fiber_flags_1.FiberFlags.NoFlags;
        // The effects are no longer valid.
        workInProgress.subtreeFlags = fiber_flags_1.FiberFlags.NoFlags;
        workInProgress.deletions = null;
        if (react_feature_flags_1.enableProfilerTimer) {
            // We intentionally reset, rather than copy, actualDuration & actualStartTime.
            // This prevents time from endlessly accumulating in new commits.
            // This has the downside of resetting values for different priority renders,
            // But works for yielding (the common case) and should support resuming.
            workInProgress.actualDuration = 0;
            workInProgress.actualStartTime = -1;
        }
    }
    // Reset all effects except static ones.
    // Static effects are not specific to a render.
    workInProgress.flags = current.flags & fiber_flags_1.FiberFlags.StaticMask;
    workInProgress.childLanes = current.childLanes;
    workInProgress.lanes = current.lanes;
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    // Clone the dependencies object. This is mutated during the render phase, so
    // it cannot be shared with the current fiber.
    var currentDependencies = current.dependencies;
    workInProgress.dependencies = currentDependencies === null ? null : {
        lanes: currentDependencies.lanes,
        firstContext: currentDependencies.firstContext
    };
    // These will be overridden during the parent's reconciliation
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    workInProgress.ref = current.ref;
    workInProgress.refCleanup = current.refCleanup;
    if (react_feature_flags_1.enableProfilerTimer) {
        workInProgress.selfBaseDuration = current.selfBaseDuration;
        workInProgress.treeBaseDuration = current.treeBaseDuration;
    }
    if (__DEV__) {
        workInProgress._debugNeedsRemount = current._debugNeedsRemount;
        switch (workInProgress.tag) {
            case work_tags_1.WorkTag.IndeterminateComponent:
            case work_tags_1.WorkTag.FunctionComponent:
            case work_tags_1.WorkTag.SimpleMemoComponent:
                workInProgress.type = (0, react_fiber_hot_reloading_resvole_1.resolveFunctionForHotReloading)(current.type);
                break;
            case work_tags_1.WorkTag.ClassComponent:
                workInProgress.type = (0, react_fiber_hot_reloading_resvole_1.resolveClassForHotReloading)(current.type);
                break;
            case work_tags_1.WorkTag.ForwardRef:
                workInProgress.type = (0, react_fiber_hot_reloading_resvole_1.resolveForwardRefForHotReloading)(current.type);
                break;
            default:
                break;
        }
    }
    return workInProgress;
}
exports.createWorkInProgress = createWorkInProgress;
