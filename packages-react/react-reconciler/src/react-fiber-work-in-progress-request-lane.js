"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestUpdateLane = exports.requestDeferredLane = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_fiber_async_action_1 = require("@zenflux/react-reconciler/src/react-fiber-async-action");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_transition_1 = require("@zenflux/react-reconciler/src/react-fiber-transition");
var react_fiber_root_scheduler_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler");
var getCurrentEventPriority = globalThis.__RECONCILER__CONFIG__.getCurrentEventPriority;
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
function requestDeferredLane() {
    if ((0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)() === fiber_lane_constants_1.NoLane) {
        // If there are multiple useDeferredValue hooks in the same render, the
        // tasks that they spawn should all be batched together, so they should all
        // receive the same lane.
        // Check the priority of the current render to decide the priority of the
        // deferred task.
        // OffscreenLane is used for prerendering, but we also use OffscreenLane
        // for incremental hydration. It's given the lowest priority because the
        // initial HTML is the same as the final UI. But useDeferredValue during
        // hydration is an exception — we need to upgrade the UI to the final
        // value. So if we're currently hydrating, we treat it like a transition.
        var isPrerendering = (0, react_fiber_lane_1.includesSomeLane)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)(), fiber_lane_constants_1.OffscreenLane) && !(0, react_fiber_hydration_is_hydrating_1.isHydrating)();
        if (isPrerendering) {
            // There's only one OffscreenLane, so if it contains deferred work, we
            // should just reschedule using the same lane.
            (0, react_fiber_work_in_progress_1.setWorkInProgressDeferredLane)(fiber_lane_constants_1.OffscreenLane);
        }
        else {
            // Everything else is spawned as a transition.
            (0, react_fiber_work_in_progress_1.setWorkInProgressDeferredLane)((0, react_fiber_root_scheduler_1.requestTransitionLane)());
        }
    }
    return (0, react_fiber_work_in_progress_1.getWorkInProgressDeferredLane)();
}
exports.requestDeferredLane = requestDeferredLane;
function requestUpdateLane(fiber) {
    // Special cases
    var mode = fiber.mode;
    if ((mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
        return fiber_lane_constants_1.SyncLane;
    }
    else if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderDeactivate)() && (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)() !== fiber_lane_constants_1.NoLanes) {
        // This is a render phase update. These are not officially supported. The
        // old behavior is to give this the same "thread" (lanes) as
        // whatever is currently rendering. So if you call `setState` on a component
        // that happens later in the same render, it will flush. Ideally, we want to
        // remove the special case and treat them as if they came from an
        // interleaved event. Regardless, this pattern is not officially supported.
        // This behavior is only a fallback. The flag only exists until we can roll
        // out the setState warning, since existing code might accidentally rely on
        // the current behavior.
        return (0, react_fiber_lane_1.pickArbitraryLane)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)());
    }
    var isTransition = (0, react_fiber_transition_1.requestCurrentTransition)() !== react_fiber_transition_1.NoTransition;
    if (isTransition) {
        if (__DEV__ && ReactCurrentBatchConfig.transition !== null) {
            var transition = ReactCurrentBatchConfig.transition;
            if (!transition._updatedFibers) {
                transition._updatedFibers = new Set();
            }
            transition._updatedFibers.add(fiber);
        }
        var actionScopeLane = (0, react_fiber_async_action_1.peekEntangledActionLane)();
        return actionScopeLane !== fiber_lane_constants_1.NoLane ? // We're inside an async action scope. Reuse the same lane.
            actionScopeLane : // We may or may not be inside an async action scope. If we are, this
            // is the first update in that scope. Either way, we need to get a
            // fresh transition lane.
            (0, react_fiber_root_scheduler_1.requestTransitionLane)();
    }
    // Updates originating inside certain React methods, like flushSync, have
    // their priority set by tracking it with a context variable.
    //
    // The opaque type returned by the host config is internally a lane, so we can
    // use that directly.
    // TODO: Move this type conversion to the event priority module.
    var updateLane = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    if (updateLane !== fiber_lane_constants_1.NoLane) {
        return updateLane;
    }
    // This update originated outside React. Ask the host environment for an
    // appropriate priority, based on the type of event.
    //
    // The opaque type returned by the host config is internally a lane, so we can
    // use that directly.
    // TODO: Move this type conversion to the event priority module.
    var eventLane = getCurrentEventPriority();
    return eventLane;
}
exports.requestUpdateLane = requestUpdateLane;
