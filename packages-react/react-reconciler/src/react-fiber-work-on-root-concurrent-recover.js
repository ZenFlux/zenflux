"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverFromConcurrentError = void 0;
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_shell_hydration_1 = require("@zenflux/react-reconciler/src/react-fiber-shell-hydration");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_prepare_fresh_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack");
var react_fiber_work_on_root_render_root_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-render-root");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var errorHydratingContainer = globalThis.__RECONCILER__CONFIG__.errorHydratingContainer;
function recoverFromConcurrentError(root, originallyAttemptedLanes, errorRetryLanes) {
    // If an error occurred during hydration, discard server response and fall
    // back to client side render.
    // Before rendering again, save the errors from the previous attempt.
    var errorsFromFirstAttempt = (0, react_fiber_work_in_progress_1.getWorkInProgressRootConcurrentErrors)();
    var wasRootDehydrated = (0, react_fiber_shell_hydration_1.isRootDehydrated)(root);
    if (wasRootDehydrated) {
        // The shell failed to hydrate. Set a flag to force a client rendering
        // during the next attempt. To do this, we call prepareFreshStack now
        // to create the root work-in-progress fiber. This is a bit weird in terms
        // of factoring, because it relies on renderRootSync not calling
        // prepareFreshStack again in the call below, which happens because the
        // root and lanes haven't changed.
        //
        // TODO: I think what we should do is set ForceClientRender inside
        // throwException, like we do for nested Suspense boundaries. The reason
        // it's here instead is so we can switch to the synchronous work loop, too.
        // Something to consider for a future refactor.
        var rootWorkInProgress = (0, react_fiber_work_in_progress_prepare_fresh_stack_1.prepareWorkInProgressFreshStack)(root, errorRetryLanes);
        rootWorkInProgress.flags |= fiber_flags_1.FiberFlags.ForceClientRender;
        if (__DEV__) {
            errorHydratingContainer(root.containerInfo);
        }
    }
    var exitStatus = (0, react_fiber_work_on_root_render_root_1.renderRootSync)(root, errorRetryLanes);
    if (exitStatus !== root_exit_status_1.RootExitStatus.RootErrored) {
        // Successfully finished rendering on retry
        if ((0, react_fiber_work_in_progress_1.didWorkInProgressRootDidAttachPingListener)() && !wasRootDehydrated) {
            // During the synchronous render, we attached additional ping listeners.
            // This is highly suggestive of an uncached promise (though it's not the
            // only reason this would happen). If it was an uncached promise, then
            // it may have masked a downstream error from ocurring without actually
            // fixing it. Example:
            //
            //    use(Promise.resolve('uncached'))
            //    throw new Error('Oops!')
            //
            // When this happens, there's a conflict between blocking potential
            // concurrent data races and unwrapping uncached promise values. We
            // have to choose one or the other. Because the data race recovery is
            // a last ditch effort, we'll disable it.
            root.errorRecoveryDisabledLanes = (0, react_fiber_lane_1.mergeLanes)(root.errorRecoveryDisabledLanes, originallyAttemptedLanes);
            // Mark the current render as suspended and force it to restart. Once
            // these lanes finish successfully, we'll re-enable the error recovery
            // mechanism for subsequent updates.
            (0, react_fiber_work_in_progress_1.orWorkInProgressRootInterleavedUpdatedLanes)(originallyAttemptedLanes);
            return root_exit_status_1.RootExitStatus.RootSuspendedWithDelay;
        }
        // The errors from the failed first attempt to have been recovered. Add
        // them to the collection of recoverable errors. We'll log them in the
        // commit phase.
        var errorsFromSecondAttempt = (0, react_fiber_work_in_progress_1.getWorkInProgressRootRecoverableErrors)();
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootRecoverableErrors)(errorsFromFirstAttempt);
        // The errors from the second attempt should be queued after the errors
        // from the first attempt, to preserve the causal sequence.
        if (errorsFromSecondAttempt !== null) {
            (0, react_fiber_work_in_progress_1.queueRecoverableErrors)(errorsFromSecondAttempt);
        }
    }
    else { // The UI failed to recover.
    }
    return exitStatus;
}
exports.recoverFromConcurrentError = recoverFromConcurrentError;
