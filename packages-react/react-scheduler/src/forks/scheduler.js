"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// TODO: Use symbols?
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_Profiling = exports.unstable_forceFrameRate = exports.unstable_now = exports.unstable_getFirstCallbackNode = exports.unstable_pauseExecution = exports.unstable_continueExecution = exports.unstable_requestPaint = exports.unstable_shouldYield = exports.unstable_getCurrentPriorityLevel = exports.unstable_wrapCallback = exports.unstable_cancelCallback = exports.unstable_scheduleCallback = exports.unstable_next = exports.unstable_runWithPriority = exports.unstable_LowPriority = exports.unstable_IdlePriority = exports.unstable_NormalPriority = exports.unstable_UserBlockingPriority = exports.unstable_ImmediatePriority = void 0;
var scheduler_min_heap_1 = require("@zenflux/react-scheduler/src/scheduler-min-heap");
var scheduler_profiling_1 = require("@zenflux/react-scheduler/src/scheduler-profiling");
var scheduler_priorities_1 = require("@zenflux/react-scheduler/src/scheduler-priorities");
Object.defineProperty(exports, "unstable_IdlePriority", { enumerable: true, get: function () { return scheduler_priorities_1.IdlePriority; } });
Object.defineProperty(exports, "unstable_ImmediatePriority", { enumerable: true, get: function () { return scheduler_priorities_1.ImmediatePriority; } });
Object.defineProperty(exports, "unstable_LowPriority", { enumerable: true, get: function () { return scheduler_priorities_1.LowPriority; } });
Object.defineProperty(exports, "unstable_NormalPriority", { enumerable: true, get: function () { return scheduler_priorities_1.NormalPriority; } });
Object.defineProperty(exports, "unstable_UserBlockingPriority", { enumerable: true, get: function () { return scheduler_priorities_1.UserBlockingPriority; } });
var scheduler_feature_flags_1 = require("@zenflux/react-scheduler/src/scheduler-feature-flags");
var getCurrentTime;
var hasPerformanceNow = // $FlowFixMe[method-unbinding]
 typeof performance === "object" && typeof performance.now === "function";
if (hasPerformanceNow) {
    var localPerformance_1 = performance;
    exports.unstable_now = getCurrentTime = function () { return localPerformance_1.now(); };
}
else {
    var localDate_1 = Date;
    var initialTime_1 = localDate_1.now();
    exports.unstable_now = getCurrentTime = function () { return localDate_1.now() - initialTime_1; };
}
// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;
// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
// Tasks are stored on a min heap
var taskQueue = [];
var timerQueue = [];
// Incrementing id counter. Used to maintain insertion order.
var taskIdCounter = 1;
// Pausing the scheduler is useful for debugging.
var isSchedulerPaused = false;
var currentTask = null;
var currentPriorityLevel = scheduler_priorities_1.NormalPriority;
// This is set while performing work, to prevent re-entrance.
var isPerformingWork = false;
var isHostCallbackScheduled = false;
var isHostTimeoutScheduled = false;
// IE and Node.js + jsdom
var isInputPending = typeof navigator !== "undefined" && // $FlowFixMe[prop-missing]
    // @ts-ignore
    navigator.scheduling !== undefined && // $FlowFixMe[incompatible-type]
    // @ts-ignore
    navigator.scheduling.isInputPending !== undefined ? navigator.scheduling.isInputPending.bind(navigator.scheduling) : null;
var continuousOptions = {
    includeContinuous: scheduler_feature_flags_1.enableIsInputPendingContinuous
};
var localSetImmediate = typeof setImmediate !== "undefined" ? setImmediate : null; // IE and Node.js + jsdom
function advanceTimers(currentTime) {
    // Check for tasks that are no longer delayed and add them to the queue.
    var timer = (0, scheduler_min_heap_1.peek)(timerQueue);
    while (timer !== null) {
        if (timer.callback === null) {
            // Timer was cancelled.
            (0, scheduler_min_heap_1.pop)(timerQueue);
        }
        else if (timer.startTime <= currentTime) {
            // Timer fired. Transfer to the task queue.
            (0, scheduler_min_heap_1.pop)(timerQueue);
            timer.sortIndex = timer.expirationTime;
            (0, scheduler_min_heap_1.push)(taskQueue, timer);
            if (scheduler_feature_flags_1.enableProfiling) {
                (0, scheduler_profiling_1.markTaskStart)(timer, currentTime);
                timer.isQueued = true;
            }
        }
        else {
            // Remaining timers are pending.
            return;
        }
        timer = (0, scheduler_min_heap_1.peek)(timerQueue);
    }
}
function handleTimeout(currentTime) {
    isHostTimeoutScheduled = false;
    advanceTimers(currentTime);
    if (!isHostCallbackScheduled) {
        if ((0, scheduler_min_heap_1.peek)(taskQueue) !== null) {
            isHostCallbackScheduled = true;
            requestHostCallback();
        }
        else {
            var firstTimer = (0, scheduler_min_heap_1.peek)(timerQueue);
            if (firstTimer !== null) {
                requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
            }
        }
    }
}
function flushWork(initialTime) {
    if (scheduler_feature_flags_1.enableProfiling) {
        (0, scheduler_profiling_1.markSchedulerUnsuspended)(initialTime);
    }
    // We'll need a host callback the next time work is scheduled.
    isHostCallbackScheduled = false;
    if (isHostTimeoutScheduled) {
        // We scheduled a timeout but it's no longer needed. Cancel it.
        isHostTimeoutScheduled = false;
        cancelHostTimeout();
    }
    isPerformingWork = true;
    var previousPriorityLevel = currentPriorityLevel;
    try {
        if (scheduler_feature_flags_1.enableProfiling) {
            try {
                return workLoop(initialTime);
            }
            catch (error) {
                if (currentTask !== null) {
                    var currentTime = getCurrentTime();
                    // $FlowFixMe[incompatible-call] found when upgrading Flow
                    (0, scheduler_profiling_1.markTaskErrored)(currentTask, currentTime);
                    // $FlowFixMe[incompatible-use] found when upgrading Flow
                    currentTask.isQueued = false;
                }
                throw error;
            }
        }
        else {
            // No catch in prod code path.
            return workLoop(initialTime);
        }
    }
    finally {
        currentTask = null;
        currentPriorityLevel = previousPriorityLevel;
        isPerformingWork = false;
        if (scheduler_feature_flags_1.enableProfiling) {
            var currentTime = getCurrentTime();
            (0, scheduler_profiling_1.markSchedulerSuspended)(currentTime);
        }
    }
}
function workLoop(initialTime) {
    var currentTime = initialTime;
    advanceTimers(currentTime);
    currentTask = (0, scheduler_min_heap_1.peek)(taskQueue);
    while (currentTask !== null && !(scheduler_feature_flags_1.enableSchedulerDebugging && isSchedulerPaused)) {
        if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
            // This currentTask hasn't expired, and we've reached the deadline.
            break;
        }
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        var callback = currentTask.callback;
        if (typeof callback === "function") {
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            currentTask.callback = null;
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            currentPriorityLevel = currentTask.priorityLevel;
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            var didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            if (scheduler_feature_flags_1.enableProfiling) {
                // $FlowFixMe[incompatible-call] found when upgrading Flow
                (0, scheduler_profiling_1.markTaskRun)(currentTask, currentTime);
            }
            var continuationCallback = callback(didUserCallbackTimeout);
            currentTime = getCurrentTime();
            if (typeof continuationCallback === "function") {
                // If a continuation is returned, immediately yield to the main thread
                // regardless of how much time is left in the current time slice.
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                currentTask.callback = continuationCallback;
                if (scheduler_feature_flags_1.enableProfiling) {
                    // $FlowFixMe[incompatible-call] found when upgrading Flow
                    (0, scheduler_profiling_1.markTaskYield)(currentTask, currentTime);
                }
                advanceTimers(currentTime);
                return true;
            }
            else {
                if (scheduler_feature_flags_1.enableProfiling) {
                    // $FlowFixMe[incompatible-call] found when upgrading Flow
                    (0, scheduler_profiling_1.markTaskCompleted)(currentTask, currentTime);
                    // $FlowFixMe[incompatible-use] found when upgrading Flow
                    currentTask.isQueued = false;
                }
                if (currentTask === (0, scheduler_min_heap_1.peek)(taskQueue)) {
                    (0, scheduler_min_heap_1.pop)(taskQueue);
                }
                advanceTimers(currentTime);
            }
        }
        else {
            (0, scheduler_min_heap_1.pop)(taskQueue);
        }
        currentTask = (0, scheduler_min_heap_1.peek)(taskQueue);
    }
    // Return whether there's additional work
    if (currentTask !== null) {
        return true;
    }
    else {
        var firstTimer = (0, scheduler_min_heap_1.peek)(timerQueue);
        if (firstTimer !== null) {
            requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
        return false;
    }
}
function unstable_runWithPriority(priorityLevel, eventHandler) {
    switch (priorityLevel) {
        case scheduler_priorities_1.ImmediatePriority:
        case scheduler_priorities_1.UserBlockingPriority:
        case scheduler_priorities_1.NormalPriority:
        case scheduler_priorities_1.LowPriority:
        case scheduler_priorities_1.IdlePriority:
            break;
        default:
            priorityLevel = scheduler_priorities_1.NormalPriority;
    }
    var previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = priorityLevel;
    try {
        return eventHandler();
    }
    finally {
        currentPriorityLevel = previousPriorityLevel;
    }
}
exports.unstable_runWithPriority = unstable_runWithPriority;
function unstable_next(eventHandler) {
    var priorityLevel;
    switch (currentPriorityLevel) {
        case scheduler_priorities_1.ImmediatePriority:
        case scheduler_priorities_1.UserBlockingPriority:
        case scheduler_priorities_1.NormalPriority:
            // Shift down to normal priority
            priorityLevel = scheduler_priorities_1.NormalPriority;
            break;
        default:
            // Anything lower than normal priority should remain at the current level.
            priorityLevel = currentPriorityLevel;
            break;
    }
    var previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = priorityLevel;
    try {
        return eventHandler();
    }
    finally {
        currentPriorityLevel = previousPriorityLevel;
    }
}
exports.unstable_next = unstable_next;
function unstable_wrapCallback(callback) {
    var parentPriorityLevel = currentPriorityLevel;
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[missing-this-annot]
    // @ts-ignore
    return function () {
        // This is a fork of runWithPriority, inlined for performance.
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = parentPriorityLevel;
        try {
            // @ts-ignore
            return callback.apply(this, arguments);
        }
        finally {
            currentPriorityLevel = previousPriorityLevel;
        }
    };
}
exports.unstable_wrapCallback = unstable_wrapCallback;
function unstable_scheduleCallback(priorityLevel, callback, options) {
    var currentTime = getCurrentTime();
    var startTime;
    if (typeof options === "object" && options !== null) {
        var delay = options.delay;
        if (typeof delay === "number" && delay > 0) {
            startTime = currentTime + delay;
        }
        else {
            startTime = currentTime;
        }
    }
    else {
        startTime = currentTime;
    }
    var timeout;
    switch (priorityLevel) {
        case scheduler_priorities_1.ImmediatePriority:
            timeout = IMMEDIATE_PRIORITY_TIMEOUT;
            break;
        case scheduler_priorities_1.UserBlockingPriority:
            timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
            break;
        case scheduler_priorities_1.IdlePriority:
            timeout = IDLE_PRIORITY_TIMEOUT;
            break;
        case scheduler_priorities_1.LowPriority:
            timeout = LOW_PRIORITY_TIMEOUT;
            break;
        case scheduler_priorities_1.NormalPriority:
        default:
            timeout = NORMAL_PRIORITY_TIMEOUT;
            break;
    }
    var expirationTime = startTime + timeout;
    var newTask = {
        id: taskIdCounter++,
        callback: callback,
        priorityLevel: priorityLevel,
        startTime: startTime,
        expirationTime: expirationTime,
        sortIndex: -1
    };
    if (scheduler_feature_flags_1.enableProfiling) {
        newTask.isQueued = false;
    }
    if (startTime > currentTime) {
        // This is a delayed task.
        newTask.sortIndex = startTime;
        (0, scheduler_min_heap_1.push)(timerQueue, newTask);
        if ((0, scheduler_min_heap_1.peek)(taskQueue) === null && newTask === (0, scheduler_min_heap_1.peek)(timerQueue)) {
            // All tasks are delayed, and this is the task with the earliest delay.
            if (isHostTimeoutScheduled) {
                // Cancel an existing timeout.
                cancelHostTimeout();
            }
            else {
                isHostTimeoutScheduled = true;
            }
            // Schedule a timeout.
            requestHostTimeout(handleTimeout, startTime - currentTime);
        }
    }
    else {
        newTask.sortIndex = expirationTime;
        (0, scheduler_min_heap_1.push)(taskQueue, newTask);
        if (scheduler_feature_flags_1.enableProfiling) {
            (0, scheduler_profiling_1.markTaskStart)(newTask, currentTime);
            newTask.isQueued = true;
        }
        // Schedule a host callback, if needed. If we're already performing work,
        // wait until the next time we yield.
        if (!isHostCallbackScheduled && !isPerformingWork) {
            isHostCallbackScheduled = true;
            requestHostCallback();
        }
    }
    return newTask;
}
exports.unstable_scheduleCallback = unstable_scheduleCallback;
function unstable_pauseExecution() {
    isSchedulerPaused = true;
}
exports.unstable_pauseExecution = unstable_pauseExecution;
function unstable_continueExecution() {
    isSchedulerPaused = false;
    if (!isHostCallbackScheduled && !isPerformingWork) {
        isHostCallbackScheduled = true;
        requestHostCallback();
    }
}
exports.unstable_continueExecution = unstable_continueExecution;
function unstable_getFirstCallbackNode() {
    return (0, scheduler_min_heap_1.peek)(taskQueue);
}
exports.unstable_getFirstCallbackNode = unstable_getFirstCallbackNode;
function unstable_cancelCallback(task) {
    if (scheduler_feature_flags_1.enableProfiling) {
        if (task.isQueued) {
            var currentTime = getCurrentTime();
            (0, scheduler_profiling_1.markTaskCanceled)(task, currentTime);
            task.isQueued = false;
        }
    }
    // Null out the callback to indicate the task has been canceled. (Can't
    // remove from the queue because you can't remove arbitrary nodes from an
    // array based heap, only the first one.)
    task.callback = null;
}
exports.unstable_cancelCallback = unstable_cancelCallback;
function unstable_getCurrentPriorityLevel() {
    return currentPriorityLevel;
}
exports.unstable_getCurrentPriorityLevel = unstable_getCurrentPriorityLevel;
var isMessageLoopRunning = false;
var taskTimeoutID = -1;
// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
var frameInterval = scheduler_feature_flags_1.frameYieldMs;
var continuousInputInterval = scheduler_feature_flags_1.continuousYieldMs;
var maxInterval = scheduler_feature_flags_1.maxYieldMs;
var startTime = -1;
var needsPaint = false;
function shouldYieldToHost() {
    var timeElapsed = getCurrentTime() - startTime;
    if (timeElapsed < frameInterval) {
        // The main thread has only been blocked for a really short amount of time;
        // smaller than a single frame. Don't yield yet.
        return false;
    }
    // The main thread has been blocked for a non-negligible amount of time. We
    // may want to yield control of the main thread, so the browser can perform
    // high priority tasks. The main ones are painting and user input. If there's
    // a pending paint or a pending input, then we should yield. But if there's
    // neither, then we can yield less often while remaining responsive. We'll
    // eventually yield regardless, since there could be a pending paint that
    // wasn't accompanied by a call to `requestPaint`, or other main thread tasks
    // like network events.
    if (scheduler_feature_flags_1.enableIsInputPending) {
        if (needsPaint) {
            // There's a pending paint (signaled by `requestPaint`). Yield now.
            return true;
        }
        if (timeElapsed < continuousInputInterval) {
            // We haven't blocked the thread for that long. Only yield if there's a
            // pending discrete input (e.g. click). It's OK if there's pending
            // continuous input (e.g. mouseover).
            if (isInputPending !== null) {
                return isInputPending();
            }
        }
        else if (timeElapsed < maxInterval) {
            // Yield if there's either a pending discrete or continuous input.
            if (isInputPending !== null) {
                return isInputPending(continuousOptions);
            }
        }
        else {
            // We've blocked the thread for a long time. Even if there's no pending
            // input, there may be some other scheduled work that we don't know about,
            // like a network event. Yield now.
            return true;
        }
    }
    // `isInputPending` isn't available. Yield now.
    return true;
}
exports.unstable_shouldYield = shouldYieldToHost;
function requestPaint() {
    if (scheduler_feature_flags_1.enableIsInputPending && navigator !== undefined && // $FlowFixMe[prop-missing]
        // @ts-ignore
        navigator.scheduling !== undefined && // $FlowFixMe[incompatible-type]
        // @ts-ignore
        navigator.scheduling.isInputPending !== undefined) {
        needsPaint = true;
    } // Since we yield every frame regardless, `requestPaint` has no effect.
}
exports.unstable_requestPaint = requestPaint;
function forceFrameRate(fps) {
    if (fps < 0 || fps > 125) {
        // Using console['error'] to evade Babel and ESLint
        console["error"]("forceFrameRate takes a positive int between 0 and 125, " + "forcing frame rates higher than 125 fps is not supported");
        return;
    }
    if (fps > 0) {
        frameInterval = Math.floor(1000 / fps);
    }
    else {
        // reset the framerate
        frameInterval = scheduler_feature_flags_1.frameYieldMs;
    }
}
exports.unstable_forceFrameRate = forceFrameRate;
var performWorkUntilDeadline = function () {
    if (isMessageLoopRunning) {
        var currentTime = getCurrentTime();
        // Keep track of the start time so we can measure how long the main thread
        // has been blocked.
        startTime = currentTime;
        // If a scheduler task throws, exit the current browser task so the
        // error can be observed.
        //
        // Intentionally not using a try-catch, since that makes some debugging
        // techniques harder. Instead, if `flushWork` errors, then `hasMoreWork` will
        // remain true, and we'll continue the work loop.
        var hasMoreWork = true;
        try {
            hasMoreWork = flushWork(currentTime);
        }
        finally {
            if (hasMoreWork) {
                // If there's more work, schedule the next message event at the end
                // of the preceding one.
                schedulePerformWorkUntilDeadline();
            }
            else {
                isMessageLoopRunning = false;
            }
        }
    }
    // Yielding to the browser will give it a chance to paint, so we can
    // reset this.
    needsPaint = false;
};
var schedulePerformWorkUntilDeadline;
if (typeof localSetImmediate === "function") {
    // Node.js and old IE.
    // There's a few reasons for why we prefer setImmediate.
    //
    // Unlike MessageChannel, it doesn't prevent a Node.js process from exiting.
    // (Even though this is a DOM fork of the Scheduler, you could get here
    // with a mix of Node.js 15+, which has a MessageChannel, and jsdom.)
    // https://github.com/facebook/react/issues/20756
    //
    // But also, it runs earlier which is the semantic we want.
    // If other browsers ever implement it, it's better to use it.
    // Although both of these would be inferior to native scheduling.
    schedulePerformWorkUntilDeadline = function () {
        localSetImmediate(performWorkUntilDeadline);
    };
}
else if (typeof MessageChannel !== "undefined") {
    // DOM and Worker environments.
    // We prefer MessageChannel because of the 4ms setTimeout clamping.
    var channel = new MessageChannel();
    var port_1 = channel.port2;
    channel.port1.onmessage = performWorkUntilDeadline;
    schedulePerformWorkUntilDeadline = function () {
        port_1.postMessage(null);
    };
}
else {
    // We should only fallback here in non-browser environments.
    schedulePerformWorkUntilDeadline = function () {
        // $FlowFixMe[not-a-function] nullable value
        setTimeout(performWorkUntilDeadline, 0);
    };
}
function requestHostCallback() {
    if (!isMessageLoopRunning) {
        isMessageLoopRunning = true;
        schedulePerformWorkUntilDeadline();
    }
}
function requestHostTimeout(callback, ms) {
    // $FlowFixMe[not-a-function] nullable value
    taskTimeoutID = setTimeout(function () {
        callback(getCurrentTime());
    }, ms);
}
function cancelHostTimeout() {
    // $FlowFixMe[not-a-function] nullable value
    clearTimeout(taskTimeoutID);
    taskTimeoutID = -1;
}
exports.unstable_Profiling = scheduler_feature_flags_1.enableProfiling ? {
    startLoggingProfilingEvents: scheduler_profiling_1.startLoggingProfilingEvents,
    stopLoggingProfilingEvents: scheduler_profiling_1.stopLoggingProfilingEvents
} : null;
