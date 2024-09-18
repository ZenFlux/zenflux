"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHydrationErrorsSafe = exports.hasHydrationErrors = exports.clearHydrationErrors = exports.queueHydrationError = void 0;
// Hydration errors that were thrown inside this boundary
var hydrationErrors = null;
function queueHydrationError(error) {
    if (hydrationErrors === null) {
        hydrationErrors = [error];
    }
    else {
        hydrationErrors.push(error);
    }
}
exports.queueHydrationError = queueHydrationError;
function clearHydrationErrors() {
    hydrationErrors = null;
}
exports.clearHydrationErrors = clearHydrationErrors;
function hasHydrationErrors() {
    return hydrationErrors !== null;
}
exports.hasHydrationErrors = hasHydrationErrors;
function getHydrationErrorsSafe() {
    return hydrationErrors;
}
exports.getHydrationErrorsSafe = getHydrationErrorsSafe;
