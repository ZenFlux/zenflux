"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleUpdateOnFiber = void 0;
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_prepare_fresh_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack");
var react_fiber_work_on_root_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-shared");
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
var react_fiber_work_root_commiting_muation_or_layout_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-root-commiting-muation-or-layout-effects");
var react_fiber_work_running_insertion_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-work-running-insertion-effect");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_suspended_reason_1 = require("@zenflux/react-reconciler/src/react-suspended-reason");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_act_1 = require("@zenflux/react-reconciler/src/react-fiber-act");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var root_exit_status_1 = require("@zenflux/react-reconciler/src/root-exit-status");
var ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue, ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
var didWarnAboutUpdateInRender = false;
var didWarnAboutUpdateInRenderForAnotherComponent;
if (__DEV__) {
    didWarnAboutUpdateInRenderForAnotherComponent = new Set();
}
function warnAboutRenderPhaseUpdatesInDEV(fiber) {
    if (__DEV__) {
        if (react_current_fiber_1.isRendering) {
            switch (fiber.tag) {
                case work_tags_1.WorkTag.FunctionComponent:
                case work_tags_1.WorkTag.ForwardRef:
                case work_tags_1.WorkTag.SimpleMemoComponent: {
                    var WorkInProgress = (0, react_fiber_work_in_progress_1.getWorkInProgress)();
                    var renderingComponentName = WorkInProgress && (0, react_get_component_name_from_fiber_1.default)(WorkInProgress) || "Unknown";
                    // Dedupe by the rendering component because it's the one that needs to be fixed.
                    var dedupeKey = renderingComponentName;
                    if (!didWarnAboutUpdateInRenderForAnotherComponent.has(dedupeKey)) {
                        didWarnAboutUpdateInRenderForAnotherComponent.add(dedupeKey);
                        var setStateComponentName = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown";
                        console.error("Cannot update a component (`%s`) while rendering a " + "different component (`%s`). To locate the bad setState() call inside `%s`, " + "follow the stack trace as described in https://reactjs.org/link/setstate-in-render", setStateComponentName, renderingComponentName, renderingComponentName);
                    }
                    break;
                }
                case work_tags_1.WorkTag.ClassComponent: {
                    if (!didWarnAboutUpdateInRender) {
                        console.error("Cannot update during an existing state transition (such as " + "within `render`). Render methods should be a pure " + "function of props and state.");
                        didWarnAboutUpdateInRender = true;
                    }
                    break;
                }
            }
        }
    }
}
function warnIfUpdatesNotWrappedWithActDEV(fiber) {
    if (__DEV__) {
        if (fiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
            if (!(0, react_fiber_act_1.isConcurrentActEnvironment)()) {
                // Not in an act environment. No need to warn.
                return;
            }
        }
        else {
            // Legacy mode has additional cases where we suppress a warning.
            if (!(0, react_fiber_act_1.isLegacyActEnvironment)(fiber)) {
                // Not in an act environment. No need to warn.
                return;
            }
            if ((0, react_fiber_work_excution_context_1.isExecutionContextNonEmpty)()) {
                // Legacy mode doesn't warn if the update is batched, i.e.
                // batchedUpdates or flushSync.
                return;
            }
            if (fiber.tag !== work_tags_1.WorkTag.FunctionComponent && fiber.tag !== work_tags_1.WorkTag.ForwardRef && fiber.tag !== work_tags_1.WorkTag.SimpleMemoComponent) {
                // For backwards compatibility with pre-hooks code, legacy mode only
                // warns for updates that originate from a hook.
                return;
            }
        }
        if (ReactCurrentActQueue.current === null) {
            var previousFiber = react_current_fiber_1.current;
            try {
                (0, react_current_fiber_1.setCurrentFiber)(fiber);
                console.error("An update to %s inside a test was not wrapped in act(...).\n\n" + "When testing, code that causes React state updates should be " + "wrapped into act(...):\n\n" + "act(() => {\n" + "  /* fire events that update state */\n" + "});\n" + "/* assert on the output */\n\n" + "This ensures that you're testing the behavior the user would see " + "in the browser." + " Learn more at https://reactjs.org/link/wrap-tests-with-act", (0, react_get_component_name_from_fiber_1.default)(fiber));
            }
            finally {
                if (previousFiber) {
                    (0, react_current_fiber_1.setCurrentFiber)(fiber);
                }
                else {
                    (0, react_current_fiber_1.resetCurrentFiber)();
                }
            }
        }
    }
}
function scheduleUpdateOnFiber(root, fiber, lane) {
    if (__DEV__) {
        if ((0, react_fiber_work_running_insertion_effect_1.getIsRunningInsertionEffect)()) {
            console.error("useInsertionEffect must not schedule updates.");
        }
    }
    if (__DEV__) {
        if ((0, react_fiber_work_passive_effects_1.isFlushPassiveEffects)()) {
            (0, react_fiber_work_passive_effects_1.setDidScheduleUpdateDuringPassiveEffects)();
        }
    }
    // Check if the work loop is currently suspended and waiting for data to
    // finish loading.
    if ( // Suspended render phase
    root === (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)() && (0, react_fiber_work_in_progress_1.getWorkInProgressSuspendedReason)() === react_suspended_reason_1.SuspendedReason.SuspendedOnData || // Suspended commit phase
        root.cancelPendingCommit !== null) {
        // The incoming update might unblock the current render. Interrupt the
        // current attempt and restart from the top.
        (0, react_fiber_work_in_progress_prepare_fresh_stack_1.prepareWorkInProgressFreshStack)(root, fiber_lane_constants_1.NoLanes);
        (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)(), (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
    }
    // Mark that the root has a pending update.
    (0, react_fiber_lane_mark_root_1.markRootUpdated)(root, lane);
    if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderDeactivate)() && root === (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)()) {
        // This update was dispatched during the render phase. This is a mistake
        // if the update originates from user space (with the exception of local
        // hook updates, which are handled differently and don't reach this
        // function), but there are some internal React features that use this as
        // an implementation detail, like selective hydration.
        warnAboutRenderPhaseUpdatesInDEV(fiber);
        // Track lanes that were updated during the render phase
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootRenderPhaseUpdatedLanes)((0, react_fiber_lane_1.mergeLanes)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderPhaseUpdatedLanes)(), lane));
    }
    else {
        // This is a normal update, scheduled from outside the render phase. For
        // example, during an input event.
        if (react_feature_flags_1.enableUpdaterTracking) {
            if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
                (0, react_fiber_lane_1.addFiberToLanesMap)(root, fiber, lane);
            }
        }
        warnIfUpdatesNotWrappedWithActDEV(fiber);
        if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerNestedUpdateScheduledHook) {
            if ((0, react_fiber_work_excution_context_1.isExecutionContextCommitDeactivate)() && (0, react_fiber_work_root_commiting_muation_or_layout_effects_1.isRootCommittingMutationOrLayoutEffects)(root)) {
                if (fiber.mode & type_of_mode_1.TypeOfMode.ProfileMode) {
                    var current = fiber;
                    while (current !== null) {
                        if (current.tag === work_tags_1.WorkTag.Profiler) {
                            var _a = current.memoizedProps, id = _a.id, onNestedUpdateScheduled = _a.onNestedUpdateScheduled;
                            if (typeof onNestedUpdateScheduled === "function") {
                                onNestedUpdateScheduled(id);
                            }
                        }
                        current = current.return;
                    }
                }
            }
        }
        if (react_feature_flags_1.enableTransitionTracing) {
            var transition = ReactCurrentBatchConfig.transition;
            if (transition && transition.name != null) {
                if (transition.startTime === -1) {
                    transition.startTime = (0, react_scheduler_1.unstable_now)();
                }
                (0, react_fiber_lane_1.addTransitionToLanesMap)(root, transition, lane);
            }
        }
        if (root === (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)()) {
            // Received an update to a tree that's in the middle of rendering. Mark
            // that there was an interleaved update work on this root.
            if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderActivate)()) {
                (0, react_fiber_work_in_progress_1.setWorkInProgressRootInterleavedUpdatedLanes)((0, react_fiber_lane_1.mergeLanes)((0, react_fiber_work_in_progress_1.getWorkInProgressRootInterleavedUpdatedLanes)(), lane));
                // WorkInProgressRootInterleavedUpdatedLanes = mergeLanes( WorkInProgressRootInterleavedUpdatedLanes, lane );
            }
            if ((0, react_fiber_work_in_progress_1.getWorkInProgressRootExitStatus)() === root_exit_status_1.RootExitStatus.RootSuspendedWithDelay) {
                // The root already suspended with a delay, which means this render
                // definitely won't finish. Since we have a new update, let's mark it as
                // suspended now, right before marking the incoming update. This has the
                // effect of interrupting the current render and switching to the update.
                // TODO: Make sure this doesn't override pings that happen while we've
                // already started rendering.
                (0, react_fiber_lane_mark_root_1.markRootSuspended)(root, (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)(), (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)());
            }
        }
        react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
        if (lane === fiber_lane_constants_1.SyncLane && (0, react_fiber_work_excution_context_1.isExecutionContextEmpty)() && (fiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
            if (__DEV__ && ReactCurrentActQueue.isBatchingLegacy) { // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
            }
            else {
                // Flush the synchronous work now, unless we're already working or inside
                // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
                // scheduleCallbackForFiber to preserve the ability to schedule a callback
                // without immediately flushing it. We only do this for user-initiated
                // updates, to preserve historical behavior of legacy mode.
                (0, react_fiber_work_in_progress_1.resetWorkInProgressRootRenderTimer)();
                react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnLegacyRootsOnly();
            }
        }
    }
}
exports.scheduleUpdateOnFiber = scheduleUpdateOnFiber;
