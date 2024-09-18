"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markSchedulerUnsuspended = exports.markSchedulerSuspended = exports.markTaskYield = exports.markTaskRun = exports.markTaskErrored = exports.markTaskCanceled = exports.markTaskCompleted = exports.markTaskStart = exports.stopLoggingProfilingEvents = exports.startLoggingProfilingEvents = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var scheduler_feature_flags_1 = require("@zenflux/react-scheduler/src/scheduler-feature-flags");
var runIdCounter = 0;
var mainThreadIdCounter = 0;
// Bytes per element is 4
var INITIAL_EVENT_LOG_SIZE = 131072;
var MAX_EVENT_LOG_SIZE = 524288; // Equivalent to 2 megabytes
var eventLogSize = 0;
var eventLogBuffer = null;
var eventLog = null;
var eventLogIndex = 0;
var TaskStartEvent = 1;
var TaskCompleteEvent = 2;
var TaskErrorEvent = 3;
var TaskCancelEvent = 4;
var TaskRunEvent = 5;
var TaskYieldEvent = 6;
var SchedulerSuspendEvent = 7;
var SchedulerResumeEvent = 8;
function logEvent(entries) {
    if (eventLog !== null) {
        var offset = eventLogIndex;
        eventLogIndex += entries.length;
        if (eventLogIndex + 1 > eventLogSize) {
            eventLogSize *= 2;
            if (eventLogSize > MAX_EVENT_LOG_SIZE) {
                // Using console['error'] to evade Babel and ESLint
                console["error"]("Scheduler Profiling: Event log exceeded maximum size. Don't " + "forget to call `stopLoggingProfilingEvents()`.");
                stopLoggingProfilingEvents();
                return;
            }
            var newEventLog = new Int32Array(eventLogSize * 4);
            // $FlowFixMe[incompatible-call] found when upgrading Flow
            newEventLog.set(eventLog);
            eventLogBuffer = newEventLog.buffer;
            eventLog = newEventLog;
        }
        eventLog.set(entries, offset);
    }
}
function startLoggingProfilingEvents() {
    eventLogSize = INITIAL_EVENT_LOG_SIZE;
    eventLogBuffer = new ArrayBuffer(eventLogSize * 4);
    eventLog = new Int32Array(eventLogBuffer);
    eventLogIndex = 0;
}
exports.startLoggingProfilingEvents = startLoggingProfilingEvents;
function stopLoggingProfilingEvents() {
    var buffer = eventLogBuffer;
    eventLogSize = 0;
    eventLogBuffer = null;
    eventLog = null;
    eventLogIndex = 0;
    return buffer;
}
exports.stopLoggingProfilingEvents = stopLoggingProfilingEvents;
function markTaskStart(task, ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        if (eventLog !== null) {
            // performance.now returns a float, representing milliseconds. When the
            // event is logged, it's coerced to an int. Convert to microseconds to
            // maintain extra degrees of precision.
            logEvent([TaskStartEvent, ms * 1000, task.id, task.priorityLevel]);
        }
    }
}
exports.markTaskStart = markTaskStart;
function markTaskCompleted(task, ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        if (eventLog !== null) {
            logEvent([TaskCompleteEvent, ms * 1000, task.id]);
        }
    }
}
exports.markTaskCompleted = markTaskCompleted;
function markTaskCanceled(task, ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        if (eventLog !== null) {
            logEvent([TaskCancelEvent, ms * 1000, task.id]);
        }
    }
}
exports.markTaskCanceled = markTaskCanceled;
function markTaskErrored(task, ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        if (eventLog !== null) {
            logEvent([TaskErrorEvent, ms * 1000, task.id]);
        }
    }
}
exports.markTaskErrored = markTaskErrored;
function markTaskRun(task, ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        runIdCounter++;
        if (eventLog !== null) {
            logEvent([TaskRunEvent, ms * 1000, task.id, runIdCounter]);
        }
    }
}
exports.markTaskRun = markTaskRun;
function markTaskYield(task, ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        if (eventLog !== null) {
            logEvent([TaskYieldEvent, ms * 1000, task.id, runIdCounter]);
        }
    }
}
exports.markTaskYield = markTaskYield;
function markSchedulerSuspended(ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        mainThreadIdCounter++;
        if (eventLog !== null) {
            logEvent([SchedulerSuspendEvent, ms * 1000, mainThreadIdCounter]);
        }
    }
}
exports.markSchedulerSuspended = markSchedulerSuspended;
function markSchedulerUnsuspended(ms) {
    if (scheduler_feature_flags_1.enableProfiling) {
        if (eventLog !== null) {
            logEvent([SchedulerResumeEvent, ms * 1000, mainThreadIdCounter]);
        }
    }
}
exports.markSchedulerUnsuspended = markSchedulerUnsuspended;
