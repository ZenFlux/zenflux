"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitRootWhenReady = exports.commitRoot = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_work_on_root_commit_impl_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-commit-impl");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var _a = globalThis.__RECONCILER__CONFIG__, startSuspendingCommit = _a.startSuspendingCommit, waitForCommitToBeReady = _a.waitForCommitToBeReady;
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
function commitRoot(root, recoverableErrors, transitions, spawnedLane) {
    // TODO: This no longer makes any sense. We already wrap the mutation and
    // layout phases. Should be able to remove.
    var previousUpdateLanePriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    var prevTransition = ReactCurrentBatchConfig.transition;
    try {
        ReactCurrentBatchConfig.transition = null;
        (0, react_event_priorities_1.setCurrentUpdatePriority)(react_event_priorities_1.DiscreteEventPriority);
        (0, react_fiber_work_on_root_commit_impl_1.commitRootImpl)(root, recoverableErrors, transitions, previousUpdateLanePriority, spawnedLane);
    }
    finally {
        ReactCurrentBatchConfig.transition = prevTransition;
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousUpdateLanePriority);
    }
    return null;
}
exports.commitRoot = commitRoot;
function commitRootWhenReady(root, finishedWork, recoverableErrors, transitions, lanes, spawnedLane) {
    // TODO: Combine retry throttling with Suspensey commits. Right now they run
    // one after the other.
    if ((0, fiber_lane_constants_1.includesOnlyNonUrgentLanes)(lanes)) {
        // Before committing, ask the renderer whether the host tree is ready.
        // If it's not, we'll wait until it notifies us.
        startSuspendingCommit();
        // This will walk the completed fiber tree and attach listeners to all
        // the suspensey resources. The renderer is responsible for accumulating
        // all the load events. This all happens in a single synchronous
        // transaction, so it track state in its own module scope.
        (0, react_fiber_commit_work_1.accumulateSuspenseyCommit)(finishedWork);
        // At the end, ask the renderer if it's ready to commit, or if we should
        // suspend. If it's not ready, it will return a callback to subscribe to
        // a ready event.
        var schedulePendingCommit = waitForCommitToBeReady();
        if (schedulePendingCommit !== null) {
            // NOTE: waitForCommitToBeReady returns a subscribe function so that we
            // only allocate a function if the commit isn't ready yet. The other
            // pattern would be to always pass a callback to waitForCommitToBeReady.
            // Not yet ready to commit. Delay the commit until the renderer notifies
            // us that it's ready. This will be canceled if we start work on the
            // root again.
            root.cancelPendingCommit = schedulePendingCommit(commitRoot.bind(null, root, recoverableErrors, transitions));
            (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, lanes, spawnedLane);
            return;
        }
    }
    // Otherwise, commit immediately.
    commitRoot(root, recoverableErrors, transitions, spawnedLane);
}
exports.commitRootWhenReady = commitRootWhenReady;
