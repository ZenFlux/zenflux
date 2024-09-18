"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performConcurrentWorkOnRoot = void 0;
var Scheduler = require("@zenflux/react-scheduler");
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_debug_tracing_1 = require("@zenflux/react-reconciler/src/react-debug-tracing");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_thenable_1 = require("@zenflux/react-reconciler/src/react-fiber-thenable");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_ex_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-ex");
var react_fiber_work_in_progress_prepare_fresh_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack");
var react_fiber_work_most_recent_fallback_time_1 = require("@zenflux/react-reconciler/src/react-fiber-work-most-recent-fallback-time");
var react_fiber_work_on_root_commit_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-commit");
var react_fiber_work_on_root_concurrent_recover_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-concurrent-recover");
var react_fiber_work_on_root_dispatcher_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-dispatcher");
var react_fiber_work_on_root_handle_throw_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-handle-throw");
var react_fiber_work_on_root_loop_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-loop");
var react_fiber_work_on_root_render_root_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-render-root");
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
var react_fiber_work_render_consistent_1 = require("@zenflux/react-reconciler/src/react-fiber-work-render-consistent");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_suspended_reason_1 = require("@zenflux/react-reconciler/src/react-suspended-reason");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var _a = globalThis.__RECONCILER__CONFIG__, scheduleTimeout = _a.scheduleTimeout, preloadInstance = _a.preloadInstance;
var ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue;
function shouldForceFlushFallbacksInDEV() {
    // Never force flush in production. This function should get stripped out.
    return __DEV__ && ReactCurrentActQueue.current !== null;
}
function finishConcurrentRender(root, exitStatus, finishedWork, lanes) {
    // TODO: The fact that most of these branches are identical suggests that some
    // of the exit statuses are not best modeled as exit statuses and should be
    // tracked orthogonally.
    switch (exitStatus) {
        case root_exit_status_1.RootExitStatus.RootInProgress:
        case root_exit_status_1.RootExitStatus.RootFatalErrored: {
            throw new Error("Root did not complete. This is a bug in React.");
        }
        case root_exit_status_1.RootExitStatus.RootSuspendedWithDelay: {
            if ((0, fiber_lane_constants_1.includesOnlyTransitions)(lanes)) {
                // This is a transition, so we should exit without committing a
                // placeholder and without scheduling a timeout. Delay indefinitely
                // until we receive more data.
                (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, lanes, (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
                return;
            }
            // Commit the placeholder.
            break;
        }
        case root_exit_status_1.RootExitStatus.RootErrored:
        case root_exit_status_1.RootExitStatus.RootSuspended:
        case root_exit_status_1.RootExitStatus.RootCompleted: {
            break;
        }
        default: {
            throw new Error("Unknown root exit status.");
        }
    }
    if (shouldForceFlushFallbacksInDEV()) {
        // We're inside an `act` scope. Commit immediately.
        (0, react_fiber_work_on_root_commit_1.commitRoot)(root, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRecoverableErrors)(), (0, react_fiber_work_in_progress_1.getWorkInProgressTransitions)(), (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
    }
    else {
        if ((0, fiber_lane_constants_1.includesOnlyRetries)(lanes) && (react_feature_flags_1.alwaysThrottleRetries || exitStatus === root_exit_status_1.RootExitStatus.RootSuspended)) {
            // This render only included retries, no updates. Throttle committing
            // retries so that we don't show too many loading states too quickly.
            var msUntilTimeout = (0, react_fiber_work_most_recent_fallback_time_1.getTimeMostRecentFallbackThrottleEnd)();
            // Don't bother with a very short suspense time.
            if (msUntilTimeout > 10) {
                (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, lanes, (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
                var nextLanes = (0, react_fiber_lane_1.getNextLanes)(root, fiber_lane_constants_1.NoLanes);
                if (nextLanes !== fiber_lane_constants_1.NoLanes) {
                    // There's additional work we can do on this root. We might as well
                    // attempt to work on that while we're suspended.
                    return;
                }
                // The render is suspended, it hasn't timed out, and there's no
                // lower priority work to do. Instead of committing the fallback
                // immediately, wait for more data to arrive.
                // TODO: Combine retry throttling with Suspensey commits. Right now they
                // run one after the other.
                root.timeoutHandle = scheduleTimeout(react_fiber_work_on_root_commit_1.commitRootWhenReady.bind(null, root, finishedWork, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRecoverableErrors)(), (0, react_fiber_work_in_progress_1.getWorkInProgressTransitions)(), lanes, (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)()), msUntilTimeout);
                return;
            }
        }
        (0, react_fiber_work_on_root_commit_1.commitRootWhenReady)(root, finishedWork, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRecoverableErrors)(), (0, react_fiber_work_in_progress_1.getWorkInProgressTransitions)(), lanes, (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
    }
}
// This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.
function performConcurrentWorkOnRoot(root, didTimeout) {
    if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerNestedUpdatePhase) {
        (0, react_profile_timer_1.resetNestedUpdateFlag)();
    }
    if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitDeactivate)()) {
        throw new Error("Should not already be working.");
    }
    // Flush any pending passive effects before deciding which lanes to work on,
    // in case they schedule additional work.
    var originalCallbackNode = root.callbackNode;
    var didFlushPassiveEffects = (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
    if (didFlushPassiveEffects) {
        // Something in the passive effect phase may have canceled the current task.
        // Check if the task node for this root was changed.
        if (root.callbackNode !== originalCallbackNode) {
            // The current task was canceled. Exit. We don't need to call
            // `ensureRootIsScheduled` because the check above implies either that
            // there's a new task, or that there's no remaining work on this root.
            return null;
        }
        else { // Current task was not canceled. Continue.
        }
    }
    // Determine the next lanes to work on, using the fields stored
    // on the root.
    // TODO: This was already computed in the caller. Pass it as an argument.
    var lanes = (0, react_fiber_lane_1.getNextLanes)(root, root === (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() ? (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)() : fiber_lane_constants_1.NoLanes);
    if (lanes === fiber_lane_constants_1.NoLanes) {
        // Defensive coding. This is never expected to happen.
        return null;
    }
    // We disable time-slicing in some cases: if the work has been CPU-bound
    // for too long ("expired" work, to prevent starvation), or we're in
    // sync-updates-by-default mode.
    // TODO: We only check `didTimeout` defensively, to account for a Scheduler
    // bug we're still investigating. Once the bug in Scheduler is fixed,
    // we can remove this, since we track expiration ourselves.
    var shouldTimeSlice = !(0, fiber_lane_constants_1.includesBlockingLane)(root, lanes) &&
        !(0, fiber_lane_constants_1.includesExpiredLane)(root, lanes) &&
        (react_feature_flags_1.disableSchedulerTimeoutInWorkLoop || !didTimeout);
    var exitStatus = shouldTimeSlice ?
        renderRootConcurrent(root, lanes) :
        (0, react_fiber_work_on_root_render_root_1.renderRootSync)(root, lanes);
    if (exitStatus !== root_exit_status_1.RootExitStatus.RootInProgress) {
        var renderWasConcurrent = shouldTimeSlice;
        do {
            if (exitStatus === root_exit_status_1.RootExitStatus.RootDidNotComplete) {
                // The render unwound without completing the tree. This happens in special
                // cases where need to exit the current render without producing a
                // consistent tree or committing.
                (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, lanes, fiber_lane_constants_1.NoLane);
            }
            else {
                // The render completed.
                // Check if this render may have yielded to a concurrent event, and if so,
                // confirm that any newly rendered stores are consistent.
                // TODO: It's possible that even a concurrent render may never have yielded
                // to the main thread, if it was fast enough, or if it expired. We could
                // skip the consistency check in that case, too.
                var finishedWork = root.current.alternate;
                if (renderWasConcurrent && !(0, react_fiber_work_render_consistent_1.isRenderConsistentWithExternalStores)(finishedWork)) {
                    // A store was mutated in an interleaved event. Render again,
                    // synchronously, to block further mutations.
                    exitStatus = (0, react_fiber_work_on_root_render_root_1.renderRootSync)(root, lanes);
                    // We assume the tree is now consistent because we didn't yield to any
                    // concurrent events.
                    renderWasConcurrent = false;
                    // Need to check the exit status again.
                    continue;
                }
                // Check if something threw
                if (exitStatus === root_exit_status_1.RootExitStatus.RootErrored) {
                    var originallyAttemptedLanes = lanes;
                    var errorRetryLanes = (0, react_fiber_lane_1.getLanesToRetrySynchronouslyOnError)(root, originallyAttemptedLanes);
                    if (errorRetryLanes !== fiber_lane_constants_1.NoLanes) {
                        lanes = errorRetryLanes;
                        exitStatus = (0, react_fiber_work_on_root_concurrent_recover_1.recoverFromConcurrentError)(root, originallyAttemptedLanes, errorRetryLanes);
                        renderWasConcurrent = false;
                    }
                }
                if (exitStatus === root_exit_status_1.RootExitStatus.RootFatalErrored) {
                    var fatalError = (0, react_fiber_work_in_progress_1.getWorkInProgressRootFatalError)();
                    (0, react_fiber_work_in_progress_prepare_fresh_stack_1.prepareWorkInProgressFreshStack)(root, fiber_lane_constants_1.NoLanes);
                    (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, lanes, fiber_lane_constants_1.NoLane);
                    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
                    throw fatalError;
                }
                // We now have a consistent tree. The next step is either to commit it,
                // or, if something suspended, wait to commit it after a timeout.
                root.finishedWork = finishedWork;
                root.finishedLanes = lanes;
                finishConcurrentRender(root, exitStatus, finishedWork, lanes);
            }
            break;
        } while (true);
    }
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
    return getContinuationForRoot(root, originalCallbackNode);
}
exports.performConcurrentWorkOnRoot = performConcurrentWorkOnRoot;
// The work loop is an extremely hot path. Tell Closure not to inline it.
/** @noinline */
function workLoopConcurrent() {
    // Perform work until Scheduler asks us to yield
    while ((0, react_fiber_work_in_progress_1.getWorkInProgress)() !== null && !Scheduler.unstable_shouldYield()) {
        // $FlowFixMe[incompatible-call] found when upgrading Flow
        (0, react_fiber_work_on_root_loop_1.performUnitOfWork)((0, react_fiber_work_in_progress_1.getWorkInProgressSafe)());
    }
}
function renderRootConcurrent(root, lanes) {
    var prevExecutionContext = (0, react_fiber_work_excution_context_1.getExecutionContext)();
    (0, react_fiber_work_excution_context_1.activateRenderExecutionContext)();
    var prevDispatcher = (0, react_fiber_work_on_root_dispatcher_1.pushDispatcher)(root.containerInfo);
    var prevCacheDispatcher = (0, react_fiber_work_on_root_dispatcher_1.pushCacheDispatcher)();
    // If the root or lanes have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() !== root || (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)() !== lanes) {
        if (react_feature_flags_1.enableUpdaterTracking) {
            if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
                var memoizedUpdaters = root.memoizedUpdaters;
                if (memoizedUpdaters.size > 0) {
                    (0, react_fiber_commit_work_1.restorePendingUpdaters)(root, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
                    memoizedUpdaters.clear();
                }
                // At this point, move Fibers that scheduled the upcoming work from the Map to the Set.
                // If we bailout on this work, we'll move them back (like above).
                // It's important to move them now in case the work spawns more work at the same priority with different updaters.
                // That way we can keep the current update and future updates separate.
                (0, react_fiber_lane_1.movePendingFibersToMemoized)(root, lanes);
            }
        }
        (0, react_fiber_work_in_progress_1.setWorkInProgressTransitions)((0, react_fiber_lane_1.getTransitionsForLanes)(root, lanes));
        (0, react_fiber_work_in_progress_1.resetWorkInProgressRootRenderTimer)();
        (0, react_fiber_work_in_progress_prepare_fresh_stack_1.prepareWorkInProgressFreshStack)(root, lanes);
    }
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logRenderStarted)(lanes);
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markRenderStarted)(lanes);
    }
    outer: do {
        try {
            if ((0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)() !== react_suspended_reason_1.SuspendedReason.NotSuspended && (0, react_fiber_work_in_progress_1.getWorkInProgress)() !== null) {
                // The work loop is suspended. We need to either unwind the stack or
                // replay the suspended component.
                var unitOfWork = (0, react_fiber_work_in_progress_1.getWorkInProgressSafe)();
                var thrownValue = (0, react_fiber_work_in_progress_1.getWorkInProgressThrownValue)();
                resumeOrUnwind: switch ((0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)()) {
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnError: {
                        // Unwind then continue with the normal work loop.
                        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                        (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                        (0, react_fiber_work_on_root_loop_1.throwAndUnwindWorkLoop)(unitOfWork, thrownValue);
                        break;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnData: {
                        var thenable = thrownValue;
                        if ((0, react_fiber_thenable_1.isThenableResolved)(thenable)) {
                            // The data resolved. Try rendering the component again.
                            (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                            (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                            (0, react_fiber_work_on_root_loop_1.replaySuspendedUnitOfWork)(unitOfWork);
                            break;
                        }
                        // The work loop is suspended on data. We should wait for it to
                        // resolve before continuing to render.
                        // TODO: Handle the case where the promise resolves synchronously.
                        // Usually this is handled when we instrument the promise to add a
                        // `status` field, but if the promise already has a status, we won't
                        // have added a listener until right here.
                        var onResolution = function () {
                            // Check if the root is still suspended on this promise.
                            if ((0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)() === react_suspended_reason_1.SuspendedReason.SuspendedOnData && (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() === root) {
                                // Mark the root as ready to continue rendering.
                                (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.SuspendedAndReadyToContinue);
                            }
                            // Ensure the root is scheduled. We should do this even if we're
                            // currently working on a different root, so that we resume
                            // rendering later.
                            react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
                        };
                        thenable.then(onResolution, onResolution);
                        break outer;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnImmediate: {
                        // If this fiber just suspended, it's possible the data is already
                        // cached. Yield to the main thread to give it a chance to ping. If
                        // it does, we can retry immediately without unwinding the stack.
                        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.SuspendedAndReadyToContinue);
                        break outer;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnInstance: {
                        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.SuspendedOnInstanceAndReadyToContinue);
                        break outer;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedAndReadyToContinue: {
                        var thenable = thrownValue;
                        if ((0, react_fiber_thenable_1.isThenableResolved)(thenable)) {
                            // The data resolved. Try rendering the component again.
                            (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                            (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                            (0, react_fiber_work_on_root_loop_1.replaySuspendedUnitOfWork)(unitOfWork);
                        }
                        else {
                            // Otherwise, unwind then continue with the normal work loop.
                            (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                            (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                            (0, react_fiber_work_on_root_loop_1.throwAndUnwindWorkLoop)(unitOfWork, thrownValue);
                        }
                        break;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnInstanceAndReadyToContinue: {
                        switch ((0, react_fiber_work_in_progress_1.getWorkInProgressSafe)().tag) {
                            case work_tags_1.WorkTag.HostComponent:
                            case work_tags_1.WorkTag.HostHoistable:
                            case work_tags_1.WorkTag.HostSingleton: {
                                // Before unwinding the stack, check one more time if the
                                // instance is ready. It may have loaded when React yielded to
                                // the main thread.
                                // Assigning this to a constant so Flow knows the binding won't
                                // be mutated by `preloadInstance`.
                                var hostFiber = (0, react_fiber_work_in_progress_1.getWorkInProgressSafe)();
                                var type = hostFiber.type;
                                var props = hostFiber.pendingProps;
                                var isReady = preloadInstance(type, props);
                                if (isReady) {
                                    // The data resolved. Resume the work loop as if nothing
                                    // suspended. Unlike when a user component suspends, we don't
                                    // have to replay anything because the host fiber
                                    // already completed.
                                    (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                                    (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                                    var sibling = hostFiber.sibling;
                                    if (sibling !== null) {
                                        (0, react_fiber_work_in_progress_1.setWorkInProgress)(sibling);
                                    }
                                    else {
                                        var returnFiber = hostFiber.return;
                                        if (returnFiber !== null) {
                                            (0, react_fiber_work_in_progress_1.setWorkInProgress)(returnFiber);
                                            (0, react_fiber_work_on_root_loop_1.completeUnitOfWork)(returnFiber);
                                        }
                                        else {
                                            (0, react_fiber_work_in_progress_1.setWorkInProgress)(null);
                                        }
                                    }
                                    break resumeOrUnwind;
                                }
                                break;
                            }
                            default: {
                                // This will fail gracefully but it's not correct, so log a
                                // warning in dev.
                                if (__DEV__) {
                                    console.error("Unexpected type of fiber triggered a suspensey commit. " +
                                        "This is a bug in React.");
                                }
                                break;
                            }
                        }
                        // Otherwise, unwind then continue with the normal work loop.
                        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                        (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                        (0, react_fiber_work_on_root_loop_1.throwAndUnwindWorkLoop)(unitOfWork, thrownValue);
                        break;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnDeprecatedThrowPromise: {
                        // Suspended by an old implementation that uses the `throw promise`
                        // pattern. The newer replaying behavior can cause subtle issues
                        // like infinite ping loops. So we maintain the old behavior and
                        // always unwind.
                        (0, react_fiber_work_in_progress_1.setWorkInProgressSuspendedReason)(react_suspended_reason_1.SuspendedReason.NotSuspended);
                        (0, react_fiber_work_in_progress_1.setWorkInProgressThrownValue)(null);
                        (0, react_fiber_work_on_root_loop_1.throwAndUnwindWorkLoop)(unitOfWork, thrownValue);
                        break;
                    }
                    case react_suspended_reason_1.SuspendedReason.SuspendedOnHydration: {
                        // Selective hydration. An update flowed into a dehydrated tree.
                        // Interrupt the current render so the work loop can switch to the
                        // hydration lane.
                        (0, react_fiber_work_in_progress_ex_1.resetWorkInProgressStack)();
                        (0, react_fiber_work_in_progress_1.setWorkInProgressRootExitStatus)(root_exit_status_1.RootExitStatus.RootDidNotComplete);
                        break outer;
                    }
                    default: {
                        throw new Error("Unexpected SuspendedReason. This is a bug in React.");
                    }
                }
            }
            if (__DEV__ && ReactCurrentActQueue.current !== null) {
                // `act` special case: If we're inside an `act` scope, don't consult
                // `shouldYield`. Always keep working until the render is complete.
                // This is not just an optimization: in a unit test environment, we
                // can't trust the result of `shouldYield`, because the host I/O is
                // likely mocked.
                (0, react_fiber_work_on_root_loop_1.workLoopSync)();
            }
            else {
                workLoopConcurrent();
            }
            break;
        }
        catch (thrownValue) {
            (0, react_fiber_work_on_root_handle_throw_1.handleThrow)(root, thrownValue);
        }
    } while (true);
    (0, react_fiber_new_context_1.resetContextDependencies)();
    (0, react_fiber_work_on_root_dispatcher_1.popDispatcher)(prevDispatcher);
    (0, react_fiber_work_on_root_dispatcher_1.popCacheDispatcher)(prevCacheDispatcher);
    (0, react_fiber_work_excution_context_1.setExecutionContext)(prevExecutionContext);
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logRenderStopped)();
        }
    }
    // Check if the tree has completed.
    if ((0, react_fiber_work_in_progress_1.getWorkInProgress)() !== null) {
        // Still work remaining.
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markRenderYielded)();
        }
        return root_exit_status_1.RootExitStatus.RootInProgress;
    }
    else {
        // Completed the tree.
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markRenderStopped)();
        }
        // Set this to null to indicate there's no in-progress render.
        (0, react_fiber_work_in_progress_1.setWorkInProgressRoot)(null);
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootRenderLanes)(fiber_lane_constants_1.NoLanes);
        // It's safe to process the queue now that the render phase is complete.
        (0, react_fiber_concurrent_updates_1.finishQueueingConcurrentUpdates)();
        // Return the final exit status.
        return (0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)();
    }
}
function getContinuationForRoot(root, originalCallbackNode) {
    // This is called at the end of `performConcurrentWorkOnRoot` to determine
    // if we need to schedule a continuation task.
    //
    // Usually `scheduleTaskForRootDuringMicrotask` only runs inside a microtask;
    // however, since most of the logic for determining if we need a continuation
    // versus a new task is the same, we cheat a bit and call it here. This is
    // only safe to do because we know we're at the end of the browser task.
    // So although it's not an actual microtask, it might as well be.
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.scheduleTaskForRootDuringMicrotask(root, (0, react_scheduler_1.unstable_now)());
    if (root.callbackNode === originalCallbackNode) {
        // The task node scheduled for this root is the same one that's
        // currently executed. Need to return a continuation.
        return performConcurrentWorkOnRoot.bind(null, root);
    }
    return null;
}
