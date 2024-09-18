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
exports.zRollupBuild = exports.zRollupCreateBuildWorker = exports.zRollupBuildInWorker = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * @TODO: Avoid using useless imports from thread, use dynamic imports instead.
 */
var node_path_1 = require("node:path");
var node_process_1 = require("node:process");
var node_util_1 = require("node:util");
var promise_1 = require("@zenflux/utils/src/promise");
var rollup_1 = require("rollup");
var utils_1 = require("@zenflux/worker/utils");
var console_thread_receive_1 = require("@zenflux/cli/src/console/console-thread-receive");
var console_thread_send_1 = require("@zenflux/cli/src/console/console-thread-send");
var rollup_2 = require("@zenflux/cli/src/core/rollup");
var rollup_swc_plugin_1 = require("@zenflux/cli/src/core/rollup-plugins/rollup-swc/rollup-swc-plugin");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var typescript_1 = require("@zenflux/cli/src/utils/typescript");
var threads = new Map(), builders = new Map();
var waitingThreads = new Map();
function rollupBuildInternal(config, options) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var output, isBundleChanged, builderKey, prevBuild, currentBuild, startTime, file;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    output = config.output;
                    if (!output) {
                        throw new Error("Rollup output not found.");
                    }
                    // TODO: This should be only once
                    config.onLog = function (logLevel, message) {
                        var _a;
                        var methods = {
                            "info": console_manager_1.ConsoleManager.$.info,
                            "warn": console_manager_1.ConsoleManager.$.warn,
                            "error": console_manager_1.ConsoleManager.$.error,
                            "debug": function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return console_manager_1.ConsoleManager.$.debug(function () { return args; });
                            },
                            "log": console_manager_1.ConsoleManager.$.log,
                        };
                        if (logLevel === "warn" && ((_a = options.config.omitWarningCodes) === null || _a === void 0 ? void 0 : _a.includes(message.code || "undefined"))) {
                            return;
                        }
                        methods[logLevel].apply(methods, ["build", "rollupBuildInternal", "", node_util_1.default.inspect({
                                message: message,
                                projectPath: options.config.path,
                            })]);
                    };
                    isBundleChanged = true;
                    builderKey = "".concat(output.format, "-").concat((_a = output.file) !== null && _a !== void 0 ? _a : output.entryFileNames);
                    prevBuild = builders.get(builderKey);
                    return [4 /*yield*/, (0, rollup_1.rollup)(config)];
                case 1:
                    currentBuild = _f.sent();
                    if (!prevBuild) {
                        builders.set(builderKey, currentBuild);
                    }
                    else if (!(0, rollup_swc_plugin_1.zRollupSwcCompareCaches)(prevBuild.cache, currentBuild.cache)) {
                        builders.set(builderKey, currentBuild);
                    }
                    else {
                        isBundleChanged = false;
                    }
                    if (!options.silent && !isBundleChanged) {
                        console_manager_1.ConsoleManager.$.log("Writing - Skip ".concat(node_util_1.default.inspect(output.format), " bundle of ").concat(node_util_1.default.inspect((_b = output.file) !== null && _b !== void 0 ? _b : output.entryFileNames)));
                    }
                    startTime = Date.now(), file = (_c = output.file) !== null && _c !== void 0 ? _c : output.entryFileNames;
                    options.silent ||
                        console_manager_1.ConsoleManager.$.log("Writing - Start ".concat(node_util_1.default.inspect(output.format), " bundle to ").concat(node_util_1.default.inspect(file)));
                    return [4 /*yield*/, builders.get(builderKey).write(output)];
                case 2:
                    _f.sent();
                    options.silent ||
                        console_manager_1.ConsoleManager.$.log("Writing - Done ".concat(node_util_1.default.inspect(output.format), " bundle of ").concat(node_util_1.default.inspect(file), " in ").concat(node_util_1.default.inspect(Date.now() - startTime) + "ms"));
                    (_e = (_d = options.config).onBuiltFormat) === null || _e === void 0 ? void 0 : _e.call(_d, output.format);
                    return [2 /*return*/];
            }
        });
    });
}
function zRollupBuildInWorker(rollupOptions, config, host) {
    return __awaiter(this, void 0, void 0, function () {
        var linkedRollupOptions;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, utils_1.ensureInWorker)();
                    // Hook local console logs to worker messages.
                    console_manager_1.ConsoleManager.setInstance(new console_thread_send_1.ConsoleThreadSend(host));
                    rollupOptions = !Array.isArray(rollupOptions) ? [rollupOptions] : rollupOptions;
                    return [4 /*yield*/, Promise.all(rollupOptions.map(function (rollupOptions) { return __awaiter(_this, void 0, void 0, function () {
                            var output, convertFormatToInternalFormat, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        output = rollupOptions.output;
                                        convertFormatToInternalFormat = function (format) {
                                            switch (format) {
                                                case "cjs":
                                                case "commonjs":
                                                    return "cjs";
                                                case "system":
                                                case "systemjs":
                                                    return "system";
                                                case "es":
                                                case "esm":
                                                case "module":
                                                default:
                                                    return "es";
                                            }
                                        };
                                        _a = rollupOptions;
                                        return [4 /*yield*/, (0, rollup_2.zRollupGetPlugins)({
                                                enableCustomLoader: !!config.enableCustomLoader,
                                                enableCjsAsyncWrap: !!config.enableCjsAsyncWrap,
                                                extensions: config.extensions || [],
                                                format: convertFormatToInternalFormat(output.format),
                                                moduleForwarding: config.moduleForwarding,
                                                sourcemap: !!output.sourcemap,
                                                minify: "development" !== node_process_1.default.env.NODE_ENV,
                                                projectPath: node_path_1.default.dirname(config.path)
                                            })];
                                    case 1:
                                        _a.plugins = _b.sent();
                                        return [2 /*return*/, rollupOptions];
                                }
                            });
                        }); }))];
                case 1:
                    linkedRollupOptions = _a.sent();
                    return [4 /*yield*/, Promise.all(linkedRollupOptions.map(function (singleRollupOptions) { return __awaiter(_this, void 0, void 0, function () {
                            var output, outputFile, promise;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        output = singleRollupOptions.output, outputFile = (_a = output.file) !== null && _a !== void 0 ? _a : output.entryFileNames;
                                        // TODO: Sending formated message to the host, not the best practice.
                                        host.sendLog("build", "prepare", node_util_1.default.inspect(config.outputName), "->", outputFile);
                                        promise = rollupBuildInternal(singleRollupOptions, {
                                            silent: true,
                                            config: config,
                                        }).catch(function (error) {
                                            error.cause = config.path;
                                            throw error;
                                        });
                                        return [4 /*yield*/, promise];
                                    case 1:
                                        _b.sent();
                                        host.sendLog("build", "done", node_util_1.default.inspect(config.outputName), "->", outputFile);
                                        // This will ensure `console.$.log` is flushed.
                                        return [2 /*return*/, new Promise(function (resolve) {
                                                setTimeout(resolve, 0);
                                            })];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.zRollupBuildInWorker = zRollupBuildInWorker;
function zRollupCreateBuildWorker(rollupOptions, options, activeConsole) {
    return __awaiter(this, void 0, void 0, function () {
        var config, zCreateWorker, worker, thread, buildPromise;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Plugins cannot be transferred to worker threads, since they are "live" objects/function etc...
                    rollupOptions.forEach(function (o) {
                        delete o.plugins;
                    });
                    config = options.config;
                    if (!!threads.has(options.threadId)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("@zenflux/worker"); })];
                case 1:
                    zCreateWorker = (_a.sent()).zCreateWorker;
                    worker = zCreateWorker({
                        name: "Build",
                        id: options.threadId,
                        display: config.outputName,
                        workFunction: zRollupBuildInWorker,
                        workArgs: [
                            rollupOptions,
                            options.config,
                        ],
                    });
                    console_thread_receive_1.ConsoleThreadReceive.connect(worker, activeConsole);
                    threads.set(options.threadId, worker);
                    _a.label = 2;
                case 2:
                    thread = threads.get(options.threadId);
                    // TODO: Find better way to handle this. some error cause thread to 'exit'. eg: rollup errors or swc...
                    if (!(thread === null || thread === void 0 ? void 0 : thread.isAlive())) {
                        threads.delete(options.threadId);
                        return [2 /*return*/, zRollupCreateBuildWorker(rollupOptions, options, activeConsole)];
                    }
                    if (!thread) {
                        throw new Error("Thread not found.");
                    }
                    return [4 /*yield*/, zBuildThreadWaitForDependencies(options, (0, typescript_1.zTSGetPackageByConfig)(config), config, activeConsole)];
                case 3:
                    _a.sent();
                    buildPromise = thread.run().catch(function (error) {
                        var isDebug = console_manager_1.ConsoleManager.isFlagEnabled("debug") || console_manager_1.ConsoleManager.isFlagEnabled("inspectorDebug");
                        if (error.watchFiles && !isDebug) {
                            delete error.watchFiles;
                        }
                        activeConsole.error("build", "in RO-" + options.threadId, "", node_util_1.default.inspect({ $: error }));
                    });
                    zBuildThreadHandleResume(buildPromise, config);
                    return [2 /*return*/, buildPromise];
            }
        });
    });
}
exports.zRollupCreateBuildWorker = zRollupCreateBuildWorker;
function zRollupBuild(rollupOptions, options) {
    return __awaiter(this, void 0, void 0, function () {
        var buildPromise;
        return __generator(this, function (_a) {
            if (!Array.isArray(rollupOptions)) {
                rollupOptions = [rollupOptions];
            }
            buildPromise = Promise.all(rollupOptions.map(function (rollupOptions) { return rollupBuildInternal(rollupOptions, options); }));
            buildPromise.then(function () {
                var _a, _b;
                (_b = (_a = options.config).onBuilt) === null || _b === void 0 ? void 0 : _b.call(_a);
            });
            return [2 /*return*/, buildPromise];
        });
    });
}
exports.zRollupBuild = zRollupBuild;
function zBuildThreadWaitForDependencies(options, pkg, config, activeConsole) {
    if (activeConsole === void 0) { activeConsole = console_manager_1.ConsoleManager.$; }
    return __awaiter(this, void 0, void 0, function () {
        var zWorkspaceGetWorkspaceDependencies, packagesDependencies, dependencies_1, availableDependencies_1, promise;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require("@zenflux/cli/src/core/workspace"); })];
                case 1:
                    zWorkspaceGetWorkspaceDependencies = (_b.sent()).zWorkspaceGetWorkspaceDependencies;
                    if (!options.otherConfigs.length) return [3 /*break*/, 3];
                    packagesDependencies = zWorkspaceGetWorkspaceDependencies((_a = {},
                        _a[pkg.json.name] = pkg,
                        _a));
                    if (!Object.keys(packagesDependencies[pkg.json.name].dependencies).length) return [3 /*break*/, 3];
                    dependencies_1 = packagesDependencies[pkg.json.name].dependencies;
                    availableDependencies_1 = {};
                    Object.values(options.otherConfigs).forEach(function (config) {
                        var pkg = (0, typescript_1.zTSGetPackageByConfig)(config);
                        if (dependencies_1[pkg.json.name]) {
                            availableDependencies_1[config.outputName] = true;
                        }
                    });
                    if (!Object.keys(availableDependencies_1).length) return [3 /*break*/, 3];
                    activeConsole.verbose(function () { return [
                        "build",
                        zBuildThreadWaitForDependencies.name,
                        "Pause",
                        node_util_1.default.inspect(config.outputName)
                    ]; });
                    promise = (0, promise_1.zCreateResolvablePromise)();
                    waitingThreads.set(options.threadId, {
                        promise: promise,
                        dependencies: availableDependencies_1,
                    });
                    return [4 /*yield*/, promise.await];
                case 2:
                    _b.sent();
                    activeConsole.verbose(function () { return [
                        "build",
                        zBuildThreadWaitForDependencies.name,
                        "Resume",
                        node_util_1.default.inspect(config.outputName)
                    ]; });
                    _b.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function zBuildThreadHandleResume(buildPromise, config) {
    buildPromise.then(function () {
        if (waitingThreads.size === 0) {
            return;
        }
        waitingThreads.forEach(function (_a, threadId) {
            var promise = _a.promise, dependencies = _a.dependencies;
            if (dependencies[config.outputName]) {
                delete dependencies[config.outputName];
            }
            if (0 === Object.keys(dependencies).length) {
                waitingThreads.delete(threadId);
                promise.resolve();
            }
        });
    });
}
