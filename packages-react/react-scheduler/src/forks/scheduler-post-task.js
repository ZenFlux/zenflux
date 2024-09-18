"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_LowPriority = exports.unstable_IdlePriority = exports.unstable_NormalPriority = exports.unstable_UserBlockingPriority = exports.unstable_ImmediatePriority = exports.unstable_Profiling = exports.unstable_getFirstCallbackNode = exports.unstable_continueExecution = exports.unstable_pauseExecution = exports.unstable_forceFrameRate = exports.unstable_wrapCallback = exports.unstable_next = exports.unstable_getCurrentPriorityLevel = exports.unstable_runWithPriority = exports.unstable_cancelCallback = exports.unstable_scheduleCallback = exports.unstable_requestPaint = exports.unstable_shouldYield = exports.unstable_now = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var scheduler_priorities_1 = require("@zenflux/react-scheduler/src/scheduler-priorities");
Object.defineProperty(exports, "unstable_IdlePriority", { enumerable: true, get: function () { return scheduler_priorities_1.IdlePriority; } });
Object.defineProperty(exports, "unstable_ImmediatePriority", { enumerable: true, get: function () { return scheduler_priorities_1.ImmediatePriority; } });
Object.defineProperty(exports, "unstable_LowPriority", { enumerable: true, get: function () { return scheduler_priorities_1.LowPriority; } });
Object.defineProperty(exports, "unstable_NormalPriority", { enumerable: true, get: function () { return scheduler_priorities_1.NormalPriority; } });
Object.defineProperty(exports, "unstable_UserBlockingPriority", { enumerable: true, get: function () { return scheduler_priorities_1.UserBlockingPriority; } });
// Capture local references to native APIs, in case a polyfill overrides them.
var perf = window.performance;
var setTimeout = window.setTimeout;
// Use experimental Chrome Scheduler postTask API.
var scheduler = global.scheduler;
var getCurrentTime = perf.now.bind(perf);
exports.unstable_now = getCurrentTime;
// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
var yieldInterval = 5;
var deadline = 0;
var currentPriorityLevel_DEPRECATED = scheduler_priorities_1.NormalPriority;
// `isInputPending` is not available. Since we have no way of knowing if
// there's pending input, always yield at the end of the frame.
function unstable_shouldYield() {
    return getCurrentTime() >= deadline;
}
exports.unstable_shouldYield = unstable_shouldYield;
function unstable_requestPaint() {
}
exports.unstable_requestPaint = unstable_requestPaint;
function unstable_scheduleCallback(priorityLevel, callback, options) {
    var postTaskPriority;
    switch (priorityLevel) {
        case scheduler_priorities_1.ImmediatePriority:
        case scheduler_priorities_1.UserBlockingPriority:
            postTaskPriority = "user-blocking";
            break;
        case scheduler_priorities_1.LowPriority:
        case scheduler_priorities_1.NormalPriority:
            postTaskPriority = "user-visible";
            break;
        case scheduler_priorities_1.IdlePriority:
            postTaskPriority = "background";
            break;
        default:
            postTaskPriority = "user-visible";
            break;
    }
    var controller = new global.TaskController({ priority: postTaskPriority });
    var postTaskOptions = {
        delay: typeof options === "object" && options !== null ? options.delay : 0,
        signal: controller.signal
    };
    var node = {
        _controller: controller
    };
    scheduler
        .postTask(runTask.bind(null, priorityLevel, postTaskPriority, node, callback), postTaskOptions)
        .catch(handleAbortError);
    return node;
}
exports.unstable_scheduleCallback = unstable_scheduleCallback;
function runTask(priorityLevel, postTaskPriority, node, callback) {
    deadline = getCurrentTime() + yieldInterval;
    try {
        currentPriorityLevel_DEPRECATED = priorityLevel;
        var didTimeout_DEPRECATED = false;
        var result = callback(didTimeout_DEPRECATED);
        if (typeof result === "function") {
            // Assume this is a continuation
            var continuation = result;
            var continuationOptions = {
                signal: node._controller.signal
            };
            var nextTask = runTask.bind(null, priorityLevel, postTaskPriority, node, continuation);
            if (scheduler.yield !== undefined) {
                scheduler.yield(continuationOptions).then(nextTask).catch(handleAbortError);
            }
            else {
                scheduler.postTask(nextTask, continuationOptions).catch(handleAbortError);
            }
        }
    }
    catch (error) {
        // We're inside a `postTask` promise. If we don't handle this error, then it
        // will trigger an "Unhandled promise rejection" error. We don't want that,
        // but we do want the default error reporting behavior that normal
        // (non-Promise) tasks get for unhandled errors.
        //
        // So we'll re-throw the error inside a regular browser task.
        setTimeout(function () {
            throw error;
        });
    }
    finally {
        currentPriorityLevel_DEPRECATED = scheduler_priorities_1.NormalPriority;
    }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleAbortError(error) {
    // TaskController to the user, nor do we expose the promise that is returned
    // from `postTask`. So we should suppress them, since there's no way for the
    // user to handle them.
}
function unstable_cancelCallback(node) {
    var controller = node._controller;
    controller.abort();
}
exports.unstable_cancelCallback = unstable_cancelCallback;
function unstable_runWithPriority(priorityLevel, callback) {
    var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
    currentPriorityLevel_DEPRECATED = priorityLevel;
    try {
        return callback();
    }
    finally {
        currentPriorityLevel_DEPRECATED = previousPriorityLevel;
    }
}
exports.unstable_runWithPriority = unstable_runWithPriority;
function unstable_getCurrentPriorityLevel() {
    return currentPriorityLevel_DEPRECATED;
}
exports.unstable_getCurrentPriorityLevel = unstable_getCurrentPriorityLevel;
function unstable_next(callback) {
    var priorityLevel;
    switch (currentPriorityLevel_DEPRECATED) {
        case scheduler_priorities_1.ImmediatePriority:
        case scheduler_priorities_1.UserBlockingPriority:
        case scheduler_priorities_1.NormalPriority:
            // Shift down to normal priority
            priorityLevel = scheduler_priorities_1.NormalPriority;
            break;
        default:
            // Anything lower than normal priority should remain at the current level.
            priorityLevel = currentPriorityLevel_DEPRECATED;
            break;
    }
    var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
    currentPriorityLevel_DEPRECATED = priorityLevel;
    try {
        return callback();
    }
    finally {
        currentPriorityLevel_DEPRECATED = previousPriorityLevel;
    }
}
exports.unstable_next = unstable_next;
function unstable_wrapCallback(callback) {
    var parentPriorityLevel = currentPriorityLevel_DEPRECATED;
    return function () {
        var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
        currentPriorityLevel_DEPRECATED = parentPriorityLevel;
        try {
            return callback();
        }
        finally {
            currentPriorityLevel_DEPRECATED = previousPriorityLevel;
        }
    };
}
exports.unstable_wrapCallback = unstable_wrapCallback;
function unstable_forceFrameRate() {
}
exports.unstable_forceFrameRate = unstable_forceFrameRate;
function unstable_pauseExecution() {
}
exports.unstable_pauseExecution = unstable_pauseExecution;
function unstable_continueExecution() {
}
exports.unstable_continueExecution = unstable_continueExecution;
function unstable_getFirstCallbackNode() {
    return null;
}
exports.unstable_getFirstCallbackNode = unstable_getFirstCallbackNode;
// Currently no profiling build
exports.unstable_Profiling = null;
