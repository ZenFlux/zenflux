"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
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
exports.act = void 0;
// This version of `act` is only used by our tests. Unlike the public version
// of `act`, it's designed to work identically in both production and
// development. It may have slightly different behavior from the public
// version, too, since our constraints in our test suite are not the same as
// those of developers using React — we're testing React itself, as opposed to
// building an app with React.
var Scheduler = require("@zenflux/react-scheduler/mock");
var enqueue_task_js_1 = require("@zenflux/react-internal-test-utils/src/enqueue-task.js");
var actingUpdatesScopeDepth = 0;
function waitForMicrotasks() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    (0, enqueue_task_js_1.enqueueTask)(function () { return resolve(); });
                })];
        });
    });
}
// @ts-expect-error T1064
function act(scope) {
    return __awaiter(this, void 0, void 0, function () {
        var previousIsActEnvironment, previousActingUpdatesScopeDepth, error, result, j, depth;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (Scheduler.unstable_flushUntilNextPaint === undefined) {
                        throw Error("This version of `act` requires a special mock build of Scheduler.");
                    }
                    // $FlowFixMe[cannot-resolve-name]: Flow doesn't know about global Jest object
                    if (!jest.isMockFunction(setTimeout)) {
                        throw Error("This version of `act` requires Jest's timer mocks " +
                            "(i.e. jest.useFakeTimers).");
                    }
                    previousIsActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
                    previousActingUpdatesScopeDepth = actingUpdatesScopeDepth;
                    actingUpdatesScopeDepth++;
                    if (actingUpdatesScopeDepth === 1) {
                        // Because this is not the "real" `act`, we set this to `false` so React
                        // knows not to fire `act` warnings.
                        global.IS_REACT_ACT_ENVIRONMENT = false;
                    }
                    error = new Error();
                    Error.captureStackTrace(error, act);
                    // Call the provided scope function after an async gap. This is an extra
                    // precaution to ensure that our tests do not accidentally rely on the act
                    // scope adding work to the queue synchronously. We don't do this in the
                    // public version of `act`, though we maybe should in the future.
                    return [4 /*yield*/, waitForMicrotasks()];
                case 1:
                    // Call the provided scope function after an async gap. This is an extra
                    // precaution to ensure that our tests do not accidentally rely on the act
                    // scope adding work to the queue synchronously. We don't do this in the
                    // public version of `act`, though we maybe should in the future.
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 11, 12]);
                    return [4 /*yield*/, scope()];
                case 3:
                    result = _a.sent();
                    _a.label = 4;
                case 4: 
                // Wait until end of current task/microtask.
                return [4 /*yield*/, waitForMicrotasks()];
                case 5:
                    // Wait until end of current task/microtask.
                    _a.sent();
                    // $FlowFixMe[cannot-resolve-name]: Flow doesn't know about global Jest object
                    if (jest.isEnvironmentTornDown()) {
                        error.message =
                            "The Jest environment was torn down before `act` completed. This " +
                                "probably means you forgot to `await` an `act` call.";
                        throw error;
                    }
                    if (!!Scheduler.unstable_hasPendingWork()) return [3 /*break*/, 8];
                    j = jest;
                    if (!(j.getTimerCount() > 0)) return [3 /*break*/, 7];
                    // There's a pending timer. Flush it now. We only do this in order to
                    // force Suspense fallbacks to display; the fact that it's a timer
                    // is an implementation detail. If there are other timers scheduled,
                    // those will also fire now, too, which is not ideal. (The public
                    // version of `act` doesn't do this.) For this reason, we should try
                    // to avoid using timers in our internal tests.
                    j.runOnlyPendingTimers();
                    // If a committing a fallback triggers another update, it might not
                    // get scheduled until a microtask. So wait one more time.
                    return [4 /*yield*/, waitForMicrotasks()];
                case 6:
                    // If a committing a fallback triggers another update, it might not
                    // get scheduled until a microtask. So wait one more time.
                    _a.sent();
                    _a.label = 7;
                case 7:
                    if (Scheduler.unstable_hasPendingWork()) {
                        // Committing a fallback scheduled additional work. Continue flushing.
                    }
                    else {
                        // There's no pending work, even after both the microtask queue
                        // and the timer queue are empty. Stop flushing.
                        return [3 /*break*/, 10];
                    }
                    _a.label = 8;
                case 8:
                    // flushUntilNextPaint stops when React yields execution. Allow microtasks
                    // queue to flush before continuing.
                    Scheduler.unstable_flushUntilNextPaint();
                    _a.label = 9;
                case 9:
                    if (true) return [3 /*break*/, 4];
                    _a.label = 10;
                case 10: return [2 /*return*/, result];
                case 11:
                    depth = actingUpdatesScopeDepth;
                    if (depth === 1) {
                        global.IS_REACT_ACT_ENVIRONMENT = previousIsActEnvironment;
                    }
                    actingUpdatesScopeDepth = depth - 1;
                    if (actingUpdatesScopeDepth !== previousActingUpdatesScopeDepth) {
                        // if it's _less than_ previousActingUpdatesScopeDepth, then we can
                        // assume the 'other' one has warned
                        Scheduler.unstable_clearLog();
                        error.message =
                            "You seem to have overlapping act() calls, this is not supported. " +
                                "Be sure to await previous act() calls before making a new one. ";
                        throw error;
                    }
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    });
}
exports.act = act;
