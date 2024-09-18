"use strict";
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zCreateWorker = exports.Worker = exports.zWorkerGetCount = void 0;
/// <reference types="@zenflux/typescript-vm/import-meta" />
var fs = require("fs");
var process = require("node:process");
var node_url_1 = require("node:url");
var util = require("node:util");
var node_worker_threads_1 = require("node:worker_threads");
var path = require("path");
if (!globalThis.zWorkersCount) {
    globalThis.zWorkersCount = 0;
}
function zWorkerGetCount() {
    return globalThis.zWorkersCount;
}
exports.zWorkerGetCount = zWorkerGetCount;
var Worker = /** @class */ (function () {
    function Worker(name, id, display, workFunction, workPath, workArgs) {
        var _this = this;
        this.name = name;
        this.id = id;
        this.display = display;
        this.workFunction = workFunction;
        this.workPath = workPath;
        this.workArgs = workArgs;
        this.state = "created";
        this.eventCallbacks = new Map();
        var runnerTarget = (0, node_url_1.fileURLToPath)(import.meta.url), paths = __spreadArray(__spreadArray([], process.env.PATH.split(path.delimiter), true), [
            process.env.PWD + "/node_modules/.bin",
        ], false), binPath = paths.find(function (p) {
            return p.endsWith("node_modules/.bin") && fs.existsSync(path.resolve(p, "@z-runner"));
        });
        if (!binPath) {
            throw new Error("'@z-runner' not found in PATHs: ".concat(util.inspect(paths)));
        }
        var runnerPath = path.resolve(binPath, "@z-runner");
        process.env.Z_RUN_TARGET = runnerTarget;
        var argv = [];
        if (process.argv.includes("--zvm-verbose")) {
            argv.push("--zvm-verbose");
        }
        this.worker = new node_worker_threads_1.Worker(runnerPath, {
            name: "z-thread-".concat(this.name, "-").concat(this.id),
            argv: argv,
            // Required by `@z-runner`
            execArgv: [
                "--experimental-vm-modules",
                "--experimental-import-meta-resolve",
            ],
            workerData: {
                zCliRunPath: runnerTarget,
                zCliWorkPath: this.workPath,
                zCliWorkFunction: workFunction.name,
                name: this.name,
                id: this.id,
                display: this.display,
                args: this.workArgs
            }
        });
        globalThis.zWorkersCount++;
        this.worker.on("exit", function () {
            globalThis.zWorkersCount--;
            if (_this.state !== "killed") {
                _this.state = "terminated";
            }
        });
        this.worker.on("message", function (_a) {
            var type = _a[0], args = _a.slice(1);
            if (_this.eventCallbacks.has(type)) {
                if (["verbose", "debug"].includes(type)) {
                    _this.eventCallbacks.get(type).forEach(function (c) { return c.call(null, function () { return args; }); });
                }
                else {
                    _this.eventCallbacks.get(type).forEach(function (c) { return c.call.apply(c, __spreadArray([null], args, false)); });
                }
            }
            else if ("internal-error") {
            }
            else if ("done" !== type) {
                throw new Error("Unhandled message: '".concat(type, "', at worker: '").concat(_this.name + ":" + _this.id, "'"));
            }
        });
    }
    Worker.prototype.getId = function () {
        return this.id;
    };
    Worker.prototype.on = function (event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    };
    Worker.prototype.run = function () {
        var _this = this;
        this.stateReason = undefined;
        if (this.state === "skip-run") {
            this.state = "idle";
            return Promise.resolve("skipped");
        }
        return new Promise(function (resolve, reject) {
            var onMessageCallback = function (_a) {
                var message = _a[0], args = _a.slice(1);
                if (message === "done") {
                    _this.state = "idle";
                    _this.worker.off("message", onMessageCallback);
                    resolve(args[0]);
                }
                else if (message === "internal-error") {
                    _this.state = "error";
                    _this.worker.off("message", onMessageCallback);
                    reject(args[0]);
                }
            };
            _this.worker.on("message", onMessageCallback);
            _this.worker.once("error", function (error) {
                _this.state = "error";
                reject(error);
            });
            _this.worker.once("exit", function () {
                if (_this.isKilled()) {
                    reject(new Error(_this.stateReason || "Thread was killed"));
                }
            });
            _this.state = "running";
            _this.worker.postMessage("run");
        });
    };
    Worker.prototype.skipNextRun = function () {
        this.state = "skip-run";
    };
    Worker.prototype.waitForDone = function () {
        var _this = this;
        // Wait for run "done" message
        return new Promise(function (resolve, reject) {
            var onMessageCallback = function (_a) {
                var message = _a[0], _args = _a.slice(1);
                if (message === "done") {
                    _this.worker.off("message", onMessageCallback);
                    resolve(true);
                }
            };
            _this.worker.once("exit", reject);
            _this.worker.once("error", reject);
            _this.worker.on("message", onMessageCallback);
        });
    };
    Worker.prototype.terminate = function () {
        var _this = this;
        this.worker.postMessage("terminate");
        return new Promise(function (resolve) {
            _this.worker.once("exit", function () {
                _this.state = "terminated";
                resolve(undefined);
            });
        });
    };
    Worker.prototype.kill = function (reason) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.state = "kill-request";
                        this.stateReason = reason;
                        return [4 /*yield*/, this.worker.terminate().then(function () {
                                _this.state = "killed";
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Worker.prototype.isIdle = function () {
        return this.state === "idle";
    };
    Worker.prototype.isAlive = function () {
        return this.state !== "error" && this.state !== "terminated" && !this.isKilled();
    };
    Worker.prototype.isKilled = function () {
        return this.state === "killed" || this.state === "kill-request";
    };
    return Worker;
}());
exports.Worker = Worker;
var workData = node_worker_threads_1.workerData;
if ((workData === null || workData === void 0 ? void 0 : workData.zCliRunPath) === (0, node_url_1.fileURLToPath)(import.meta.url)) {
    if (null === node_worker_threads_1.parentPort) {
        throw new Error("Parent port is not defined");
    }
    var parent_1 = node_worker_threads_1.parentPort;
    var zCliWorkPath = workData.zCliWorkPath, zCliWorkFunction = workData.zCliWorkFunction, name_1 = workData.name, id = workData.id, display = workData.display;
    var workModule = (await Promise.resolve("".concat(zCliWorkPath)).then(function (s) { return require(s); }));
    if (!workModule[zCliWorkFunction]) {
        throw new Error("Function ".concat(util.inspect(zCliWorkFunction), " ") +
            "not found in ".concat(util.inspect(zCliWorkPath), " ") +
            "thread ".concat(util.inspect(name_1), ": ").concat(util.inspect(id)));
    }
    var workFunction_1 = workModule[zCliWorkFunction];
    var threadHost_1 = {
        name: name_1,
        id: id,
        display: display,
        sendMessage: function (type) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            // Serialize args and avoid circular references
            // TODO: Duplicate code
            var reduceCircularReferences = function () {
                var seen = new WeakSet();
                return function (key, value) {
                    if (typeof value === "object" && value !== null) {
                        if (seen.has(value)) {
                            return;
                        }
                        seen.add(value);
                    }
                    return value;
                };
            };
            args = JSON.parse(JSON.stringify(args, reduceCircularReferences()));
            parent_1.postMessage(__spreadArray([type], args, true));
        },
        sendLog: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.sendMessage.apply(this, __spreadArray(["log"], args, false));
        },
        sendWarn: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.sendMessage.apply(this, __spreadArray(["warn"], args, false));
        },
        sendInfo: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.sendMessage.apply(this, __spreadArray(["info"], args, false));
        },
        sendVerbose: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.sendMessage.apply(this, __spreadArray(["verbose"], args, false));
        },
        sendDebug: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.sendMessage.apply(this, __spreadArray(["debug"], args, false));
        },
    };
    var isWorking_1 = false, isRequestedToTerminate_1 = false;
    var terminate_1 = function () {
        process.exit(0);
    };
    var work_1 = function () {
        isWorking_1 = true;
        return workFunction_1.call.apply(workFunction_1, __spreadArray(__spreadArray([null], workData.args, false), [threadHost_1], false));
    };
    var done_1 = function (result) {
        isWorking_1 = false;
        threadHost_1.sendMessage("done", result);
    };
    node_worker_threads_1.parentPort.on("message", function (message) {
        switch (message) {
            case "run":
                var result = work_1();
                if (result instanceof Promise) {
                    result
                        .then(done_1)
                        .catch(function (error) {
                        node_worker_threads_1.parentPort === null || node_worker_threads_1.parentPort === void 0 ? void 0 : node_worker_threads_1.parentPort.postMessage(["internal-error", {
                                name: error.name,
                                message: error.message,
                                code: error.code,
                                stack: error.stack
                            }]);
                    });
                }
                else {
                    done_1(result);
                }
                isRequestedToTerminate_1 && terminate_1();
                break;
            case "terminate":
                if (isWorking_1) {
                    isRequestedToTerminate_1 = true;
                }
                else {
                    terminate_1();
                }
                break;
            default:
                throw new Error("Unknown message: ".concat(message));
        }
    });
}
var zCreateWorker = function (_a) {
    var name = _a.name, _b = _a.id, id = _b === void 0 ? zWorkerGetCount() : _b, _c = _a.display, display = _c === void 0 ? name : _c, workFunction = _a.workFunction, _d = _a.workFilePath, workFilePath = _d === void 0 ? import.meta.refererUrl ? (0, node_url_1.fileURLToPath)(import.meta.refererUrl) : undefined : _d, _e = _a.workArgs, workArgs = _e === void 0 ? [] : _e;
    var isExist = false;
    try {
        isExist = workFilePath && fs.existsSync(workFilePath);
    }
    catch (e) {
    }
    if (!isExist) {
        throw new Error("File not found: ".concat(workFilePath));
    }
    return new Worker(name, id, display, workFunction, workFilePath, workArgs);
};
exports.zCreateWorker = zCreateWorker;
