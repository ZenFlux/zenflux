"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// TODO: Use symbols?
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_Profiling = exports.unstable_setDisableYieldValue = exports.reset = exports.unstable_advanceTime = exports.log = exports.unstable_flushAll = exports.unstable_hasPendingWork = exports.unstable_flushUntilNextPaint = exports.unstable_clearLog = exports.unstable_flushExpired = exports.unstable_flushNumberOfYields = exports.unstable_flushAllWithoutAsserting = exports.unstable_forceFrameRate = exports.unstable_now = exports.unstable_getFirstCallbackNode = exports.unstable_pauseExecution = exports.unstable_continueExecution = exports.unstable_requestPaint = exports.unstable_shouldYield = exports.unstable_getCurrentPriorityLevel = exports.unstable_wrapCallback = exports.unstable_cancelCallback = exports.unstable_scheduleCallback = exports.unstable_next = exports.unstable_runWithPriority = exports.unstable_LowPriority = exports.unstable_IdlePriority = exports.unstable_NormalPriority = exports.unstable_UserBlockingPriority = exports.unstable_ImmediatePriority = void 0;
var scheduler_priorities_1 = require("@zenflux/react-scheduler/src/scheduler-priorities");
Object.defineProperty(exports, "unstable_IdlePriority", { enumerable: true, get: function () { return scheduler_priorities_1.IdlePriority; } });
Object.defineProperty(exports, "unstable_ImmediatePriority", { enumerable: true, get: function () { return scheduler_priorities_1.ImmediatePriority; } });
Object.defineProperty(exports, "unstable_LowPriority", { enumerable: true, get: function () { return scheduler_priorities_1.LowPriority; } });
Object.defineProperty(exports, "unstable_NormalPriority", { enumerable: true, get: function () { return scheduler_priorities_1.NormalPriority; } });
Object.defineProperty(exports, "unstable_UserBlockingPriority", { enumerable: true, get: function () { return scheduler_priorities_1.UserBlockingPriority; } });
var scheduler_feature_flags_1 = require("@zenflux/react-scheduler/src/scheduler-feature-flags");
var scheduler_min_heap_1 = require("@zenflux/react-scheduler/src/scheduler-min-heap");
var scheduler_profiling_1 = require("@zenflux/react-scheduler/src/scheduler-profiling");
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
var currentMockTime = 0;
var scheduledCallback = null;
var scheduledTimeout = null;
var timeoutTime = -1;
var yieldedValues = null;
var expectedNumberOfYields = -1;
var didStop = false;
var isFlushing = false;
var needsPaint = false;
var shouldYieldForPaint = false;
var disableYieldValue = false;
function setDisableYieldValue(newValue) {
    disableYieldValue = newValue;
}
exports.unstable_setDisableYieldValue = setDisableYieldValue;
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
            requestHostCallback(flushWork);
        }
        else {
            var firstTimer = (0, scheduler_min_heap_1.peek)(timerQueue);
            if (firstTimer !== null) {
                requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
            }
        }
    }
}
function flushWork(hasTimeRemaining, initialTime) {
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
                return workLoop(hasTimeRemaining, initialTime);
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
            return workLoop(hasTimeRemaining, initialTime);
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
function workLoop(hasTimeRemaining, initialTime) {
    var currentTime = initialTime;
    advanceTimers(currentTime);
    currentTask = (0, scheduler_min_heap_1.peek)(taskQueue);
    while (currentTask !== null && !(scheduler_feature_flags_1.enableSchedulerDebugging && isSchedulerPaused)) {
        if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
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
                if (shouldYieldForPaint) {
                    needsPaint = true;
                    return true;
                }
                else { // If `shouldYieldForPaint` is false, we keep flushing synchronously
                    // without yielding to the main thread. This is the behavior of the
                    // `toFlushAndYield` and `toFlushAndYieldThrough` testing helpers .
                }
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
            requestHostCallback(flushWork);
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
        requestHostCallback(flushWork);
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
function requestHostCallback(callback) {
    scheduledCallback = callback;
}
function requestHostTimeout(callback, ms) {
    scheduledTimeout = callback;
    timeoutTime = currentMockTime + ms;
}
function cancelHostTimeout() {
    scheduledTimeout = null;
    timeoutTime = -1;
}
function shouldYieldToHost() {
    if (expectedNumberOfYields === 0 && yieldedValues === null || expectedNumberOfYields !== -1 && yieldedValues !== null && yieldedValues.length >= expectedNumberOfYields || shouldYieldForPaint && needsPaint) {
        // We yielded at least as many values as expected. Stop flushing.
        didStop = true;
        return true;
    }
    return false;
}
exports.unstable_shouldYield = shouldYieldToHost;
function getCurrentTime() {
    return currentMockTime;
}
exports.unstable_now = getCurrentTime;
function forceFrameRate() {
}
exports.unstable_forceFrameRate = forceFrameRate;
function reset() {
    if (isFlushing) {
        throw new Error("Cannot reset while already flushing work.");
    }
    currentMockTime = 0;
    scheduledCallback = null;
    scheduledTimeout = null;
    timeoutTime = -1;
    yieldedValues = null;
    expectedNumberOfYields = -1;
    didStop = false;
    isFlushing = false;
    needsPaint = false;
}
exports.reset = reset;
// Should only be used via an assertion helper that inspects the yielded values.
function unstable_flushNumberOfYields(count) {
    if (isFlushing) {
        throw new Error("Already flushing work.");
    }
    if (scheduledCallback !== null) {
        var cb = scheduledCallback;
        expectedNumberOfYields = count;
        isFlushing = true;
        try {
            var hasMoreWork = true;
            do {
                hasMoreWork = cb(true, currentMockTime);
            } while (hasMoreWork && !didStop);
            if (!hasMoreWork) {
                scheduledCallback = null;
            }
        }
        finally {
            expectedNumberOfYields = -1;
            didStop = false;
            isFlushing = false;
        }
    }
}
exports.unstable_flushNumberOfYields = unstable_flushNumberOfYields;
function unstable_flushUntilNextPaint() {
    if (isFlushing) {
        throw new Error("Already flushing work.");
    }
    if (scheduledCallback !== null) {
        var cb = scheduledCallback;
        shouldYieldForPaint = true;
        needsPaint = false;
        isFlushing = true;
        try {
            var hasMoreWork = true;
            do {
                hasMoreWork = cb(true, currentMockTime);
            } while (hasMoreWork && !didStop);
            if (!hasMoreWork) {
                scheduledCallback = null;
            }
        }
        finally {
            shouldYieldForPaint = false;
            didStop = false;
            isFlushing = false;
        }
    }
    return false;
}
exports.unstable_flushUntilNextPaint = unstable_flushUntilNextPaint;
function unstable_hasPendingWork() {
    return scheduledCallback !== null;
}
exports.unstable_hasPendingWork = unstable_hasPendingWork;
function unstable_flushExpired() {
    if (isFlushing) {
        throw new Error("Already flushing work.");
    }
    if (scheduledCallback !== null) {
        isFlushing = true;
        try {
            var hasMoreWork = scheduledCallback(false, currentMockTime);
            if (!hasMoreWork) {
                scheduledCallback = null;
            }
        }
        finally {
            isFlushing = false;
        }
    }
}
exports.unstable_flushExpired = unstable_flushExpired;
function unstable_flushAllWithoutAsserting() {
    // Returns false if no work was flushed.
    if (isFlushing) {
        throw new Error("Already flushing work.");
    }
    if (scheduledCallback !== null) {
        var cb = scheduledCallback;
        isFlushing = true;
        try {
            var hasMoreWork = true;
            do {
                hasMoreWork = cb(true, currentMockTime);
            } while (hasMoreWork);
            if (!hasMoreWork) {
                scheduledCallback = null;
            }
            return true;
        }
        finally {
            isFlushing = false;
        }
    }
    else {
        return false;
    }
}
exports.unstable_flushAllWithoutAsserting = unstable_flushAllWithoutAsserting;
function unstable_clearLog() {
    if (yieldedValues === null) {
        return [];
    }
    var values = yieldedValues;
    yieldedValues = null;
    return values;
}
exports.unstable_clearLog = unstable_clearLog;
function unstable_flushAll() {
    if (yieldedValues !== null) {
        throw new Error("Log is not empty. Assert on the log of yielded values before " + "flushing additional work.");
    }
    unstable_flushAllWithoutAsserting();
    if (yieldedValues !== null) {
        throw new Error("While flushing work, something yielded a value. Use an " + "assertion helper to assert on the log of yielded values, e.g. " + "expect(Scheduler).toFlushAndYield([...])");
    }
}
exports.unstable_flushAll = unstable_flushAll;
function log(value) {
    if (console.log.name === "disabledLog" || disableYieldValue) {
        // If console.log has been patched, we assume we're in render
        // replaying and we ignore any values yielding in the second pass.
        return;
    }
    if (yieldedValues === null) {
        yieldedValues = [value];
    }
    else {
        yieldedValues.push(value);
    }
}
exports.log = log;
function unstable_advanceTime(ms) {
    if (console.log.name === "disabledLog" || disableYieldValue) {
        // If console.log has been patched, we assume we're in render
        // replaying and we ignore any time advancing in the second pass.
        return;
    }
    currentMockTime += ms;
    if (scheduledTimeout !== null && timeoutTime <= currentMockTime) {
        scheduledTimeout(currentMockTime);
        timeoutTime = -1;
        scheduledTimeout = null;
    }
}
exports.unstable_advanceTime = unstable_advanceTime;
function requestPaint() {
    needsPaint = true;
}
exports.unstable_requestPaint = requestPaint;
exports.unstable_Profiling = scheduler_feature_flags_1.enableProfiling ? {
    startLoggingProfilingEvents: scheduler_profiling_1.startLoggingProfilingEvents,
    stopLoggingProfilingEvents: scheduler_profiling_1.stopLoggingProfilingEvents
} : null;
