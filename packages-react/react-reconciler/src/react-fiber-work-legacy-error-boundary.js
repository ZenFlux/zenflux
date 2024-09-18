"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearLegacyErrorBoundariesThatAlreadyFailed = exports.setLegacyErrorBoundariesThatAlreadyFailed = exports.markLegacyErrorBoundaryAsFailed = exports.isAlreadyFailedLegacyErrorBoundary = void 0;
var legacyErrorBoundariesThatAlreadyFailed = null;
function isAlreadyFailedLegacyErrorBoundary(instance) {
    return legacyErrorBoundariesThatAlreadyFailed !== null && legacyErrorBoundariesThatAlreadyFailed.has(instance);
}
exports.isAlreadyFailedLegacyErrorBoundary = isAlreadyFailedLegacyErrorBoundary;
function markLegacyErrorBoundaryAsFailed(instance) {
    if (legacyErrorBoundariesThatAlreadyFailed === null) {
        legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
    }
    else {
        legacyErrorBoundariesThatAlreadyFailed.add(instance);
    }
}
exports.markLegacyErrorBoundaryAsFailed = markLegacyErrorBoundaryAsFailed;
function setLegacyErrorBoundariesThatAlreadyFailed(failedBoundaries) {
    legacyErrorBoundariesThatAlreadyFailed = failedBoundaries;
}
exports.setLegacyErrorBoundariesThatAlreadyFailed = setLegacyErrorBoundariesThatAlreadyFailed;
function clearLegacyErrorBoundariesThatAlreadyFailed() {
    legacyErrorBoundariesThatAlreadyFailed = null;
}
exports.clearLegacyErrorBoundariesThatAlreadyFailed = clearLegacyErrorBoundariesThatAlreadyFailed;
