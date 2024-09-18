"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAlreadyRendering = exports.discreteUpdates = exports.batchedUpdates = exports.deferredUpdates = exports.flushRoot = exports.scheduleInitialHydrationOnRoot = exports.getCurrentTime = exports.getRenderTargetTime = void 0;
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_on_root_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-shared");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig, ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue;
function getRenderTargetTime() {
    return (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderTargetTime)();
}
exports.getRenderTargetTime = getRenderTargetTime;
function getCurrentTime() {
    return (0, react_scheduler_1.unstable_now)();
}
exports.getCurrentTime = getCurrentTime;
function scheduleInitialHydrationOnRoot(root, lane) {
    // This is a special fork of scheduleUpdateOnFiber that is only used to
    // schedule the initial hydration of a root that has just been created. Most
    // of the stuff in scheduleUpdateOnFiber can be skipped.
    //
    // The main reason for this separate path, though, is to distinguish the
    // initial children from subsequent updates. In fully client-rendered roots
    // (createRoot instead of hydrateRoot), all top-level renders are modeled as
    // updates, but hydration roots are special because the initial render must
    // match what was rendered on the server.
    var current = root.current;
    current.lanes = lane;
    (0, react_fiber_lane_mark_root_1.markRootUpdated)(root, lane);
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
}
exports.scheduleInitialHydrationOnRoot = scheduleInitialHydrationOnRoot;
function flushRoot(root, lanes) {
    if (lanes !== fiber_lane_constants_1.NoLanes) {
        (0, react_fiber_lane_1.upgradePendingLanesToSync)(root, lanes);
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
        if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitActivate)()) {
            (0, react_fiber_work_in_progress_1.resetWorkInProgressRootRenderTimer)();
            // TODO: For historical reasons this flushes all sync work across all
            // roots. It shouldn't really matter either way, but we could change this
            // to only flush the given root.
            react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
        }
    }
}
exports.flushRoot = flushRoot;
function deferredUpdates(fn) {
    var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    var prevTransition = ReactCurrentBatchConfig.transition;
    try {
        ReactCurrentBatchConfig.transition = null;
        (0, react_event_priorities_1.setCurrentUpdatePriority)(react_event_priorities_1.DefaultEventPriority);
        return fn();
    }
    finally {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}
exports.deferredUpdates = deferredUpdates;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function batchedUpdates(fn, a, c) {
    var prevExecutionContext = (0, react_fiber_work_excution_context_1.getExecutionContext)();
    (0, react_fiber_work_excution_context_1.activateBatchedExecutionContext)();
    try {
        return fn(a);
    }
    finally {
        (0, react_fiber_work_excution_context_1.setExecutionContext)(prevExecutionContext);
        // If there were legacy sync updates, flush them at the end of the outer
        // most batchedUpdates-like method.
        if ((0, react_fiber_work_excution_context_1.isExecutionContextEmpty)() && // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
            !(__DEV__ && ReactCurrentActQueue.isBatchingLegacy)) {
            (0, react_fiber_work_in_progress_1.resetWorkInProgressRootRenderTimer)();
            react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnLegacyRootsOnly();
        }
    }
}
exports.batchedUpdates = batchedUpdates;
function discreteUpdates(fn, a, b, c, d) {
    var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    var prevTransition = ReactCurrentBatchConfig.transition;
    try {
        ReactCurrentBatchConfig.transition = null;
        (0, react_event_priorities_1.setCurrentUpdatePriority)(react_event_priorities_1.DiscreteEventPriority);
        return fn(a, b, c, d);
    }
    finally {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
        if ((0, react_fiber_work_excution_context_1.isExecutionContextEmpty)()) {
            (0, react_fiber_work_in_progress_1.resetWorkInProgressRootRenderTimer)();
        }
    }
}
exports.discreteUpdates = discreteUpdates;
function isAlreadyRendering() {
    // Used by the renderer to print a warning if certain APIs are called from
    // the wrong context.
    return __DEV__ && (0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitDeactivate)();
}
exports.isAlreadyRendering = isAlreadyRendering;
