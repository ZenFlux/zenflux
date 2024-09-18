"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClassErrorUpdate = exports.createRootErrorUpdate = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_error_logger_1 = require("@zenflux/react-reconciler/src/react-fiber-error-logger");
var react_fiber_hot_reloading_error_boundray_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-error-boundray");
var react_fiber_work_legacy_error_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_throw_uncaught_error_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-uncaught-error");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
function createRootErrorUpdate(fiber, errorInfo, lane) {
    var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
    // Unmount the root by rendering null.
    update.tag = react_fiber_class_update_queue_1.CaptureUpdate;
    // Caution: React DevTools currently depends on this property
    // being called "element".
    update.payload = {
        element: null
    };
    var error = errorInfo.value;
    update.callback = function () {
        (0, react_fiber_throw_uncaught_error_1.onUncaughtError)(error);
        (0, react_fiber_error_logger_1.logCapturedError)(fiber, errorInfo);
    };
    return update;
}
exports.createRootErrorUpdate = createRootErrorUpdate;
function createClassErrorUpdate(fiber, errorInfo, lane) {
    var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
    update.tag = react_fiber_class_update_queue_1.CaptureUpdate;
    var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
    if (typeof getDerivedStateFromError === "function") {
        var error_1 = errorInfo.value;
        update.payload = function () {
            return getDerivedStateFromError(error_1);
        };
        update.callback = function () {
            if (__DEV__) {
                (0, react_fiber_hot_reloading_error_boundray_1.markFailedErrorBoundaryForHotReloading)(fiber);
            }
            (0, react_fiber_error_logger_1.logCapturedError)(fiber, errorInfo);
        };
    }
    var inst = fiber.stateNode;
    if (inst !== null && typeof inst.componentDidCatch === "function") {
        // $FlowFixMe[missing-this-annot]
        update.callback = function callback() {
            var _a;
            if (__DEV__) {
                (0, react_fiber_hot_reloading_error_boundray_1.markFailedErrorBoundaryForHotReloading)(fiber);
            }
            (0, react_fiber_error_logger_1.logCapturedError)(fiber, errorInfo);
            if (typeof getDerivedStateFromError !== "function") {
                // To preserve the preexisting retry behavior of error boundaries,
                // we keep track of which ones already failed during this batch.
                // This gets reset before we yield back to the browser.
                // TODO: Warn in strict mode if getDerivedStateFromError is
                // not defined.
                (0, react_fiber_work_legacy_error_boundary_1.markLegacyErrorBoundaryAsFailed)(this);
            }
            var error = errorInfo.value;
            var stack = errorInfo.stack;
            // @ts-ignore
            (_a = this.componentDidCatch) === null || _a === void 0 ? void 0 : _a.call(this, /*<Error>*/ error, {
                componentStack: stack !== null ? stack : ""
            });
            if (__DEV__) {
                if (typeof getDerivedStateFromError !== "function") {
                    // If componentDidCatch is the only error boundary method defined,
                    // then it needs to call setState to recover from errors.
                    // If no state update is scheduled then the boundary will swallow the error.
                    if (!(0, react_fiber_lane_1.includesSomeLane)(fiber.lanes, fiber_lane_constants_1.SyncLane)) {
                        console.error("%s: Error boundaries should implement getDerivedStateFromError(). " + "In that method, return a state update to display an error message or fallback UI.", (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown");
                    }
                }
            }
        };
    }
    return update;
}
exports.createClassErrorUpdate = createClassErrorUpdate;
