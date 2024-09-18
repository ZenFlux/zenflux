"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markGlobalMostRecentFallbackTime = exports.getTimeMostRecentFallbackThrottleEnd = exports.isGlobalMostRecentFallbackNotExceeded = void 0;
var react_scheduler_1 = require("@zenflux/react-scheduler");
// The most recent time we either committed a fallback, or when a fallback was
// filled in with the resolved UI. This lets us throttle the appearance of new
// content as it streams in, to minimize jank.
// TODO: Think of a better name for this variable?
var globalMostRecentFallbackTime = 0;
var FALLBACK_THROTTLE_MS = 300;
function isGlobalMostRecentFallbackNotExceeded() {
    return (0, react_scheduler_1.unstable_now)() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS;
}
exports.isGlobalMostRecentFallbackNotExceeded = isGlobalMostRecentFallbackNotExceeded;
function getTimeMostRecentFallbackThrottleEnd() {
    return globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - (0, react_scheduler_1.unstable_now)();
}
exports.getTimeMostRecentFallbackThrottleEnd = getTimeMostRecentFallbackThrottleEnd;
function markGlobalMostRecentFallbackTime() {
    globalMostRecentFallbackTime = (0, react_scheduler_1.unstable_now)();
}
exports.markGlobalMostRecentFallbackTime = markGlobalMostRecentFallbackTime;
