import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { mergeLanes } from "@zenflux/react-reconciler/src/react-fiber-lane";
import { isRootDehydrated } from "@zenflux/react-reconciler/src/react-fiber-shell-hydration";
import {
    didWorkInProgressRootDidAttachPingListener,
    getWorkInProgressRootConcurrentErrors,
    getWorkInProgressRootRecoverableErrors,
    orWorkInProgressRootInterleavedUpdatedLanes, queueRecoverableErrors, setWorkInProgressRootRecoverableErrors
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { prepareWorkInProgressFreshStack } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack";
import { renderRootSync } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-render-root";
import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import type { FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

const {
    errorHydratingContainer,
} = globalThis.__RECONCILER__CONFIG__;

export function recoverFromConcurrentError( root: FiberRoot, originallyAttemptedLanes: Lanes, errorRetryLanes: Lanes ) {
    // If an error occurred during hydration, discard server response and fall
    // back to client side render.
    // Before rendering again, save the errors from the previous attempt.
    const errorsFromFirstAttempt = getWorkInProgressRootConcurrentErrors();
    const wasRootDehydrated = isRootDehydrated( root );

    if ( wasRootDehydrated ) {
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
        const rootWorkInProgress = prepareWorkInProgressFreshStack( root, errorRetryLanes );
        rootWorkInProgress.flags |= FiberFlags.ForceClientRender;

        if ( __DEV__ ) {
            errorHydratingContainer( root.containerInfo );
        }
    }

    const exitStatus = renderRootSync( root, errorRetryLanes );

    if ( exitStatus !== RootExitStatus.RootErrored ) {
        // Successfully finished rendering on retry
        if ( didWorkInProgressRootDidAttachPingListener() && ! wasRootDehydrated ) {
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
            root.errorRecoveryDisabledLanes = mergeLanes( root.errorRecoveryDisabledLanes, originallyAttemptedLanes );
            // Mark the current render as suspended and force it to restart. Once
            // these lanes finish successfully, we'll re-enable the error recovery
            // mechanism for subsequent updates.
            orWorkInProgressRootInterleavedUpdatedLanes( originallyAttemptedLanes );
            return RootExitStatus.RootSuspendedWithDelay;
        }

        // The errors from the failed first attempt to have been recovered. Add
        // them to the collection of recoverable errors. We'll log them in the
        // commit phase.
        const errorsFromSecondAttempt = getWorkInProgressRootRecoverableErrors();

        setWorkInProgressRootRecoverableErrors( errorsFromFirstAttempt );

        // The errors from the second attempt should be queued after the errors
        // from the first attempt, to preserve the causal sequence.
        if ( errorsFromSecondAttempt !== null ) {
            queueRecoverableErrors( errorsFromSecondAttempt );
        }
    } else {// The UI failed to recover.
    }

    return exitStatus;
}
