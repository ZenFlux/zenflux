"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markFailedErrorBoundaryForHotReloading = exports.hasSpecificFailedErrorBoundarySafe = exports.hasFailedErrorBoundary = void 0;
var react_fiber_hot_reloading_resvole_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole");
var failedBoundaries = null;
function hasFailedErrorBoundary() {
    return failedBoundaries !== null;
}
exports.hasFailedErrorBoundary = hasFailedErrorBoundary;
function hasSpecificFailedErrorBoundarySafe(fiber) {
    return failedBoundaries.has(fiber);
}
exports.hasSpecificFailedErrorBoundarySafe = hasSpecificFailedErrorBoundarySafe;
function markFailedErrorBoundaryForHotReloading(fiber) {
    if (__DEV__) {
        if (!(0, react_fiber_hot_reloading_resvole_1.isRefreshHandler)()) {
            // Hot reloading is disabled.
            return;
        }
        if (typeof WeakSet !== "function") {
            return;
        }
        if (failedBoundaries === null) {
            failedBoundaries = new WeakSet();
        }
        failedBoundaries.add(fiber);
    }
}
exports.markFailedErrorBoundaryForHotReloading = markFailedErrorBoundaryForHotReloading;
