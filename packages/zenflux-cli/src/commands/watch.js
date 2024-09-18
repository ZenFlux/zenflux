"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * TODO
 * - Sometimes not all the projects are needed to be built, so we need to find a way to build only the projects that are effected by the change.
 * - Add `onConfigReload` restart the watcher with new config.
 *  - @see https://github.com/lukastaegert/rollup/bflob/eb2b51ca48a92ca90644c77550c4ad0c296b17e6/cli/run/watch-cli.ts#L45
 */
var node_util_1 = require("node:util");
var node_process_1 = require("node:process");
var chokidar_1 = require("chokidar");
var timers_1 = require("@zenflux/cli/src/utils/timers");
var build_1 = require("@zenflux/cli/src/core/build");
var global_1 = require("@zenflux/cli/src/core/global");
var command_build_base_1 = require("@zenflux/cli/src/base/command-build-base");
var console_watch_1 = require("@zenflux/cli/src/console/console-watch");
var DEFAULT_ON_CHANGE_DELAY = 2000;
var buildTimePerThread = new Map();
var Watch = /** @class */ (function (_super) {
    __extends(Watch, _super);
    function Watch() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Watch.prototype.getRollupConsole = function () {
        return console_watch_1.rollupConsole;
    };
    Watch.prototype.getTSDiagnosticsConsole = function () {
        return console_watch_1.tsDiagnosticConsole;
    };
    Watch.prototype.getTSDeclarationConsole = function () {
        return console_watch_1.tsDeclarationConsole;
    };
    Watch.prototype.getTotalDiagnosticMessage = function (passed, failed, startTimestamp) {
        return [
            "Passed: {#00ff00-fg}".concat(passed, "{/}, Failed: {#ff0000-fg}").concat(failed, "{/}"),
            "Toke {#0000ff-fg}".concat(Date.now() - startTimestamp, "{#ff0000-fg}ms{/}")
        ];
    };
    Watch.prototype.runImpl = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configs, globalPaths, watcher, totalBuildTime, _loop_1, this_1, _i, configs_1, config;
            var _this = this;
            return __generator(this, function (_a) {
                configs = this.getConfigs();
                globalPaths = (0, global_1.zGlobalPathsGet)();
                watcher = chokidar_1.default.watch(globalPaths.workspace, {
                    ignored: [
                        "**/node_modules/**",
                        "**/dist/**",
                        "**/*.log",
                        function (s) { return s.split("/").some(function (i) { return i.startsWith("."); }); },
                    ],
                    persistent: true
                });
                node_process_1.default.on("exit", function () {
                    console_watch_1.rollupConsole.log("watcher", "Closing");
                    watcher.close();
                });
                watcher.on("error", function (error) {
                    console_watch_1.rollupConsole.error("watcher", "Error", error);
                });
                totalBuildTime = 0;
                _loop_1 = function (config) {
                    var rollupConfig = this_1.getRollupConfig(config);
                    // Each watch will have its own build thread.
                    this_1.watch(rollupConfig, config, watcher, configs.indexOf(config))
                        .onWorkerStart(function (id) {
                        if (buildTimePerThread.size === 0) {
                            totalBuildTime = Date.now();
                            _this.onBuilt(config);
                        }
                        buildTimePerThread.set(id, Date.now());
                        console_watch_1.rollupConsole.verbose(function () { return ["watcher", "send", "to RO-" + id, node_util_1.default.inspect(config.outputName)]; });
                    })
                        .onWorkerEnd(function (id) {
                        var time = buildTimePerThread.get(id);
                        console_watch_1.rollupConsole.log("watcher", "recv", "from RO-" + id, node_util_1.default.inspect(config.outputName), "in {#0000ff-fg}".concat(Date.now() - time, "{#ff0000-fg}ms{/}"));
                        buildTimePerThread.delete(id);
                        if (buildTimePerThread.size === 0) {
                            console_watch_1.rollupConsole.log("watcher", "Total", "{colspan}" + configs.map(function (c) { return "{red-fg}'{/}{blue-fg}".concat(c.outputFileName, "{/}{red-fg}'{/}"); }).join(", ") +
                                " toke {#0000ff-fg}".concat(Date.now() - totalBuildTime, "{#ff0000-fg}ms{/}"));
                            _this.onBuiltAll();
                        }
                    });
                };
                this_1 = this;
                // Create build request with thread per config.
                for (_i = 0, configs_1 = configs; _i < configs_1.length; _i++) {
                    config = configs_1[_i];
                    _loop_1(config);
                }
                return [2 /*return*/];
            });
        });
    };
    Watch.prototype.onBuilt = function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    Watch.prototype.watch = function (rollupOptions, config, watcher, id) {
        var _this = this;
        if (id === void 0) { id = 0; }
        var callbacks = {
            onWorkerStart: function (_id) { },
            onWorkerEnd: function (_id) { }
        };
        var callbacksSetter = {
            onWorkerStart: function (callback) {
                callbacks.onWorkerStart = callback;
                return callbacksSetter;
            },
            onWorkerEnd: function (callback) {
                callbacks.onWorkerEnd = callback;
                return callbacksSetter;
            }
        };
        var build = build_1.zRollupCreateBuildWorker.bind(null, rollupOptions, {
            silent: true,
            config: config,
            threadId: id,
            otherConfigs: this.getConfigs().filter(function (c) { return c !== config; })
        }, console_watch_1.rollupConsole);
        var buildCallback = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        callbacks.onWorkerStart(id);
                        return [4 /*yield*/, build()];
                    case 1:
                        _a.sent();
                        callbacks.onWorkerEnd(id);
                        return [2 /*return*/];
                }
            });
        }); };
        watcher.on("ready", function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, buildCallback()];
                    case 1:
                        _a.sent();
                        watcher.on("change", function (path) {
                            console_watch_1.rollupConsole.verbose(function () { return [
                                "watcher",
                                "Changes",
                                "in RO-" + id,
                                "".concat(node_util_1.default.inspect(config.outputName), " at ").concat(node_util_1.default.inspect(path))
                            ]; });
                            (0, timers_1.zDebounce)("__WATCHER__".concat(id, "__"), function () {
                                buildCallback();
                            }, DEFAULT_ON_CHANGE_DELAY);
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        return callbacksSetter;
    };
    return Watch;
}(command_build_base_1.CommandBuildBase));
exports.default = Watch;
