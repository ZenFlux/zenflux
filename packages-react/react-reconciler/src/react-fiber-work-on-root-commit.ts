import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { includesOnlyNonUrgentLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { markRootSuspended } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { commitRootImpl } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-commit-impl";
import { DiscreteEventPriority, getCurrentUpdatePriority, setCurrentUpdatePriority } from "@zenflux/react-reconciler/src/react-event-priorities";
import { accumulateSuspenseyCommit } from "@zenflux/react-reconciler/src/react-fiber-commit-work";

import type { Transition } from "@zenflux/react-shared/src/react-internal-types/transition";

import type { CapturedValue } from "@zenflux/react-reconciler/src/react-captured-value";
import type { Fiber, FiberRoot, Lane, Lanes } from "@zenflux/react-shared/src/react-internal-types";

const {
    startSuspendingCommit,
    waitForCommitToBeReady,
} = globalThis.__RECONCILER__CONFIG__;

const {
    ReactCurrentBatchConfig,
} = ReactSharedInternals;

export function commitRoot( root: FiberRoot, recoverableErrors: null | Array<CapturedValue<unknown>>, transitions: Array<Transition> | null, spawnedLane: Lane ) {
    // TODO: This no longer makes any sense. We already wrap the mutation and
    // layout phases. Should be able to remove.
    const previousUpdateLanePriority = getCurrentUpdatePriority();
    const prevTransition = ReactCurrentBatchConfig.transition;

    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority( DiscreteEventPriority );
        commitRootImpl( root, recoverableErrors, transitions, previousUpdateLanePriority, spawnedLane );
    } finally {
        ReactCurrentBatchConfig.transition = prevTransition;
        setCurrentUpdatePriority( previousUpdateLanePriority );
    }

    return null;
}

export function commitRootWhenReady( root: FiberRoot, finishedWork: Fiber, recoverableErrors: Array<CapturedValue<unknown>> | null, transitions: Array<Transition> | null, lanes: Lanes, spawnedLane: Lane ) {
    // TODO: Combine retry throttling with Suspensey commits. Right now they run
    // one after the other.
    if ( includesOnlyNonUrgentLanes( lanes ) ) {
        // Before committing, ask the renderer whether the host tree is ready.
        // If it's not, we'll wait until it notifies us.
        startSuspendingCommit();
        // This will walk the completed fiber tree and attach listeners to all
        // the suspensey resources. The renderer is responsible for accumulating
        // all the load events. This all happens in a single synchronous
        // transaction, so it track state in its own module scope.
        accumulateSuspenseyCommit( finishedWork );
        // At the end, ask the renderer if it's ready to commit, or if we should
        // suspend. If it's not ready, it will return a callback to subscribe to
        // a ready event.
        const schedulePendingCommit = waitForCommitToBeReady();

        if ( schedulePendingCommit !== null ) {
            // NOTE: waitForCommitToBeReady returns a subscribe function so that we
            // only allocate a function if the commit isn't ready yet. The other
            // pattern would be to always pass a callback to waitForCommitToBeReady.
            // Not yet ready to commit. Delay the commit until the renderer notifies
            // us that it's ready. This will be canceled if we start work on the
            // root again.
            root.cancelPendingCommit = schedulePendingCommit( commitRoot.bind( null, root, recoverableErrors, transitions ) );
            markRootSuspended( root, lanes, spawnedLane );
            return;
        }
    }

    // Otherwise, commit immediately.
    commitRoot( root, recoverableErrors, transitions, spawnedLane );
}
