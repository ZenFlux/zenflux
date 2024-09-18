"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertLog = exports.waitForDiscrete = exports.waitForPaint = exports.unstable_waitForExpired = exports.waitForThrow = exports.waitForAll = exports.waitFor = exports.waitForMicrotasks = exports.act = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var SchedulerMock = require("@zenflux/react-scheduler/mock");
var jest_diff_1 = require("jest-diff");
var expect_utils_1 = require("@jest/expect-utils");
var enqueue_task_1 = require("@zenflux/react-internal-test-utils/src/enqueue-task");
var internal_act_1 = require("@zenflux/react-internal-test-utils/src/internal-act");
Object.defineProperty(exports, "act", { enumerable: true, get: function () { return internal_act_1.act; } });
function assertYieldsWereCleared(caller) {
    var actualYields = SchedulerMock.unstable_clearLog();
    if (actualYields.length !== 0) {
        var error = Error("The event log is not empty. Call assertLog(...) first.");
        Error.captureStackTrace(error, caller);
        throw error;
    }
}
function waitForMicrotasks() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    (0, enqueue_task_1.enqueueTask)(function () { return resolve(); });
                })];
        });
    });
}
exports.waitForMicrotasks = waitForMicrotasks;
function waitFor(expectedLog, options) {
    return __awaiter(this, void 0, void 0, function () {
        var error, stopAfter, actualLog;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertYieldsWereCleared(waitFor);
                    error = new Error();
                    Error.captureStackTrace(error, waitFor);
                    stopAfter = expectedLog.length;
                    actualLog = [];
                    _a.label = 1;
                case 1: 
                // Wait until end of current task/microtask.
                return [4 /*yield*/, waitForMicrotasks()];
                case 2:
                    // Wait until end of current task/microtask.
                    _a.sent();
                    if (!SchedulerMock.unstable_hasPendingWork()) return [3 /*break*/, 6];
                    SchedulerMock.unstable_flushNumberOfYields(stopAfter - actualLog.length);
                    actualLog.push.apply(actualLog, SchedulerMock.unstable_clearLog());
                    if (!(stopAfter > actualLog.length)) return [3 /*break*/, 3];
                    return [3 /*break*/, 5];
                case 3: 
                // Once we've reached the expected sequence, wait one more microtask to
                // flush any remaining synchronous work.
                return [4 /*yield*/, waitForMicrotasks()];
                case 4:
                    // Once we've reached the expected sequence, wait one more microtask to
                    // flush any remaining synchronous work.
                    _a.sent();
                    actualLog.push.apply(actualLog, SchedulerMock.unstable_clearLog());
                    return [3 /*break*/, 8];
                case 5: return [3 /*break*/, 7];
                case 6: 
                // There's no pending work, even after a microtask.
                return [3 /*break*/, 8];
                case 7:
                    if (true) return [3 /*break*/, 1];
                    _a.label = 8;
                case 8:
                    if (options && options.additionalLogsAfterAttemptingToYield) {
                        expectedLog = expectedLog.concat(options.additionalLogsAfterAttemptingToYield);
                    }
                    if ((0, expect_utils_1.equals)(actualLog, expectedLog)) {
                        return [2 /*return*/];
                    }
                    error.message = "" +
                        "Expected sequence of events did not occur.\n" +
                        (0, jest_diff_1.diff)(expectedLog, actualLog) +
                        "\n";
                    throw error;
            }
        });
    });
}
exports.waitFor = waitFor;
function waitForAll(expectedLog) {
    return __awaiter(this, void 0, void 0, function () {
        var error, actualLog;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertYieldsWereCleared(waitForAll);
                    error = new Error();
                    Error.captureStackTrace(error, waitForAll);
                    _a.label = 1;
                case 1: 
                // Wait until end of current task/microtask.
                return [4 /*yield*/, waitForMicrotasks()];
                case 2:
                    // Wait until end of current task/microtask.
                    _a.sent();
                    if (!SchedulerMock.unstable_hasPendingWork()) {
                        // There's no pending work, even after a microtask. Stop flushing.
                        return [3 /*break*/, 4];
                    }
                    SchedulerMock.unstable_flushAllWithoutAsserting();
                    _a.label = 3;
                case 3:
                    if (true) return [3 /*break*/, 1];
                    _a.label = 4;
                case 4:
                    actualLog = SchedulerMock.unstable_clearLog();
                    if ((0, expect_utils_1.equals)(actualLog, expectedLog)) {
                        return [2 /*return*/];
                    }
                    error.message = "\n" +
                        "Expected sequence of events did not occur.\n" +
                        (0, jest_diff_1.diff)(expectedLog, actualLog) +
                        "\n";
                    throw error;
            }
        });
    });
}
exports.waitForAll = waitForAll;
function waitForThrow(expectedError) {
    return __awaiter(this, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertYieldsWereCleared(waitForThrow);
                    error = new Error();
                    Error.captureStackTrace(error, waitForThrow);
                    _a.label = 1;
                case 1: 
                // Wait until end of current task/microtask.
                return [4 /*yield*/, waitForMicrotasks()];
                case 2:
                    // Wait until end of current task/microtask.
                    _a.sent();
                    if (!SchedulerMock.unstable_hasPendingWork()) {
                        // There's no pending work, even after a microtask. Stop flushing.
                        error.message = "Expected something to throw, but nothing did.";
                        throw error;
                    }
                    try {
                        SchedulerMock.unstable_flushAllWithoutAsserting();
                    }
                    catch (x) {
                        if (expectedError === undefined) {
                            // If no expected error was provided, then assume the caller is OK with
                            // any error being thrown. We're returning the error so they can do
                            // their own checks, if they wish.
                            return [2 /*return*/, x];
                        }
                        if ((0, expect_utils_1.equals)(x, expectedError)) {
                            return [2 /*return*/, x];
                        }
                        if (typeof expectedError === "string" &&
                            typeof x === "object" &&
                            x !== null &&
                            typeof x.message === "string") {
                            if (x.message.includes(expectedError)) {
                                return [2 /*return*/, x];
                            }
                            else {
                                error.message = "" +
                                    "Expected error was not thrown.\n" +
                                    (0, jest_diff_1.diff)(expectedError, x.message) +
                                    "\n";
                                throw error;
                            }
                        }
                        // Not error object
                        error.message = "" +
                            "Expected error was not thrown.\n" +
                            (0, jest_diff_1.diff)(expectedError, x) +
                            "\n";
                        throw error;
                    }
                    _a.label = 3;
                case 3:
                    if (true) return [3 /*break*/, 1];
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.waitForThrow = waitForThrow;
// This is prefixed with `unstable_` because you should almost always try to
// avoid using it in tests. It's really only for testing a particular
// implementation detail (update starvation prevention).
function unstable_waitForExpired(expectedLog) {
    return __awaiter(this, void 0, void 0, function () {
        var error, actualLog;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertYieldsWereCleared(unstable_waitForExpired);
                    error = new Error();
                    Error.captureStackTrace(error, unstable_waitForExpired);
                    // Wait until end of current task/microtask.
                    return [4 /*yield*/, waitForMicrotasks()];
                case 1:
                    // Wait until end of current task/microtask.
                    _a.sent();
                    SchedulerMock.unstable_flushExpired();
                    actualLog = SchedulerMock.unstable_clearLog();
                    if ((0, expect_utils_1.equals)(actualLog, expectedLog)) {
                        return [2 /*return*/];
                    }
                    error.message = "" +
                        "Expected sequence of events did not occur.\n" +
                        (0, jest_diff_1.diff)(expectedLog, actualLog) +
                        "\n";
                    throw error;
            }
        });
    });
}
exports.unstable_waitForExpired = unstable_waitForExpired;
// TODO: This name is a bit misleading currently because it will stop as soon as
// React yields for any reason, not just for a paint. I've left it this way for
// now because that's how untable_flushUntilNextPaint already worked, but maybe
// we should split these use cases into separate APIs.
function waitForPaint(expectedLog) {
    return __awaiter(this, void 0, void 0, function () {
        var error, actualLog;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertYieldsWereCleared(waitForPaint);
                    error = new Error();
                    Error.captureStackTrace(error, waitForPaint);
                    // Wait until end of current task/microtask.
                    return [4 /*yield*/, waitForMicrotasks()];
                case 1:
                    // Wait until end of current task/microtask.
                    _a.sent();
                    if (!SchedulerMock.unstable_hasPendingWork()) return [3 /*break*/, 3];
                    // Flush until React yields.
                    SchedulerMock.unstable_flushUntilNextPaint();
                    // Wait one more microtask to flush any remaining synchronous work.
                    return [4 /*yield*/, waitForMicrotasks()];
                case 2:
                    // Wait one more microtask to flush any remaining synchronous work.
                    _a.sent();
                    _a.label = 3;
                case 3:
                    actualLog = SchedulerMock.unstable_clearLog();
                    if ((0, expect_utils_1.equals)(actualLog, expectedLog)) {
                        return [2 /*return*/];
                    }
                    error.message = "" +
                        "Expected sequence of events did not occur." +
                        (0, jest_diff_1.diff)(expectedLog, actualLog) +
                        "\n";
                    throw error;
            }
        });
    });
}
exports.waitForPaint = waitForPaint;
function waitForDiscrete(expectedLog) {
    return __awaiter(this, void 0, void 0, function () {
        var error, actualLog;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assertYieldsWereCleared(waitForDiscrete);
                    error = new Error();
                    Error.captureStackTrace(error, waitForDiscrete);
                    // Wait until end of current task/microtask.
                    return [4 /*yield*/, waitForMicrotasks()];
                case 1:
                    // Wait until end of current task/microtask.
                    _a.sent();
                    actualLog = SchedulerMock.unstable_clearLog();
                    if ((0, expect_utils_1.equals)(actualLog, expectedLog)) {
                        return [2 /*return*/];
                    }
                    error.message = "" +
                        "Expected sequence of events did not occur.\n" +
                        (0, jest_diff_1.diff)(expectedLog, actualLog) +
                        "\n";
                    throw error;
            }
        });
    });
}
exports.waitForDiscrete = waitForDiscrete;
function assertLog(expectedLog) {
    var actualLog = SchedulerMock.unstable_clearLog();
    if ((0, expect_utils_1.equals)(actualLog, expectedLog)) {
        return;
    }
    var error = new Error("" +
        "Expected sequence of events did not occur.\n" +
        (0, jest_diff_1.diff)(expectedLog, actualLog) +
        "\n");
    Error.captureStackTrace(error, assertLog);
    throw error;
}
exports.assertLog = assertLog;
