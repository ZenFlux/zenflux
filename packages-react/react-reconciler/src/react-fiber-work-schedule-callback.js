"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fiberWorkScheduleCallback = void 0;
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue;
var fakeActCallbackNode = {};
function fiberWorkScheduleCallback(priorityLevel, callback) {
    if (__DEV__) {
        // If we're currently inside an `act` scope, bypass Scheduler and push to
        // the `act` queue instead.
        var actQueue = ReactCurrentActQueue.current;
        if (actQueue !== null) {
            actQueue.push(callback);
            return fakeActCallbackNode;
        }
        else {
            return (0, react_scheduler_1.unstable_scheduleCallback)(priorityLevel, callback);
        }
    }
    else {
        // In production, always call Scheduler. This function will be stripped out.
        return (0, react_scheduler_1.unstable_scheduleCallback)(priorityLevel, callback);
    }
}
exports.fiberWorkScheduleCallback = fiberWorkScheduleCallback;
