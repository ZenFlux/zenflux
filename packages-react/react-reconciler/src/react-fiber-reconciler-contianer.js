"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContainer = exports.createHydrationContainer = exports.createContainer = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_instance_map_1 = require("@zenflux/react-shared/src/react-instance-map");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_context_1 = require("@zenflux/react-reconciler/src/react-fiber-context");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_reconciler_shared_dev_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler-shared-dev");
var react_fiber_root_1 = require("@zenflux/react-reconciler/src/react-fiber-root");
var react_fiber_work_in_progress_request_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane");
var react_fiber_work_loop_1 = require("@zenflux/react-reconciler/src/react-fiber-work-loop");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
function getContextForSubtree(parentComponent) {
    if (!parentComponent) {
        return react_fiber_context_1.emptyContextObject;
    }
    var fiber = (0, react_instance_map_1.get)(parentComponent);
    var parentContext = (0, react_fiber_context_1.findCurrentUnmaskedContext)(fiber);
    if (fiber.tag === work_tags_1.WorkTag.ClassComponent) {
        var Component_1 = fiber.type;
        if ((0, react_fiber_context_1.isContextProvider)(Component_1)) {
            return (0, react_fiber_context_1.processChildContext)(fiber, Component_1, parentContext);
        }
    }
    return parentContext;
}
function createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
    var hydrate = false;
    var initialChildren = null;
    return (0, react_fiber_root_1.createFiberRoot)(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks, null);
}
exports.createContainer = createContainer;
function createHydrationContainer(initialChildren, // TODO: Remove `callback` when we delete legacy mode.
callback, containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks, formState) {
    var hydrate = true;
    var root = (0, react_fiber_root_1.createFiberRoot)(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks, formState);
    // TODO: Move this to FiberRoot constructor
    root.context = getContextForSubtree(null);
    // Schedule the initial render. In a hydration root, this is different from
    // a regular update because the initial render must match was was rendered
    // on the server.
    // NOTE: This update intentionally doesn't have a payload. We're only using
    // the update to schedule work on the root fiber (and, for legacy roots, to
    // enqueue the callback if one is provided).
    var current = root.current;
    var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(current);
    var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
    update.callback = callback !== undefined && callback !== null ? callback : null;
    (0, react_fiber_class_update_queue_1.enqueueUpdate)(current, update, lane);
    (0, react_fiber_work_loop_1.scheduleInitialHydrationOnRoot)(root, lane);
    return root;
}
exports.createHydrationContainer = createHydrationContainer;
function updateContainer(element, container, parentComponent, callback) {
    if (__DEV__) {
        (0, react_fiber_dev_tools_hook_1.onScheduleRoot)(container, element);
    }
    var current = container.current;
    var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(current);
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markRenderScheduled)(lane);
    }
    var context = getContextForSubtree(parentComponent);
    if (container.context === null) {
        container.context = context;
    }
    else {
        container.pendingContext = context;
    }
    if (__DEV__) {
        if (react_current_fiber_1.isRendering && react_current_fiber_1.current !== null && !react_fiber_reconciler_shared_dev_1.default.didWarnAboutNestedUpdates) {
            react_fiber_reconciler_shared_dev_1.default.didWarnAboutNestedUpdates = true;
            console.error("Render methods should be a pure function of props and state; " + "triggering nested component updates from render is not allowed. " + "If necessary, trigger nested updates in componentDidUpdate.\n\n" + "Check the render method of %s.", (0, react_get_component_name_from_fiber_1.default)(react_current_fiber_1.current) || "Unknown");
        }
    }
    var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
    // Caution: React DevTools currently depends on this property
    // being called "element".
    update.payload = {
        element: element
    };
    callback = callback === undefined ? null : callback;
    if (callback !== null) {
        if (__DEV__) {
            if (typeof callback !== "function") {
                console.error("render(...): Expected the last optional `callback` argument to be a " + "function. Instead received: %s.", callback);
            }
        }
        update.callback = callback;
    }
    var root = (0, react_fiber_class_update_queue_1.enqueueUpdate)(current, update, lane);
    if (root !== null) {
        (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, current, lane);
        (0, react_fiber_class_update_queue_1.entangleTransitions)(root, current, lane);
    }
    return lane;
}
exports.updateContainer = updateContainer;
