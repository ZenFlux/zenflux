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
exports.zTSCreateDeclarationWorker = exports.zTSCreateDiagnosticWorker = exports.zTSDeclarationInWorker = exports.zTSDiagnosticInWorker = exports.zTSCreateDeclaration = exports.zTSPreDiagnostics = exports.zTSGetCompilerHost = exports.zTSConfigRead = exports.zTSConfigGetPath = exports.zCustomizeDiagnostic = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_fs_1 = require("node:fs");
var node_process_1 = require("node:process");
var node_path_1 = require("node:path");
var node_util_1 = require("node:util");
var utils_1 = require("@zenflux/worker/utils");
var typescript_1 = require("typescript");
var promise_1 = require("@zenflux/utils/src/promise");
var typescript_2 = require("@zenflux/cli/src/utils/typescript");
var console_thread_send_1 = require("@zenflux/cli/src/console/console-thread-send");
var console_thread_receive_1 = require("@zenflux/cli/src/console/console-thread-receive");
var api_extractor_1 = require("@zenflux/cli/src/core/api-extractor");
var workspace_1 = require("@zenflux/cli/src/core/workspace");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
// TODO: Avoid this, create threadPool with max threads = cpu cores.
var diagnosticWorkers = new Map(), declarationWorkers = new Map();
var waitingTSConfigs = new Map();
var pathsCache = {}, configCache = {}, configValidationCache = {}, cacheCompilerHost = {}, cacheProgram = {};
function zCustomizeDiagnostic(diagnostic) {
    var _a;
    var isIntroduceFile = false;
    var str = typescript_1.default.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    // Make the message more readable and useful
    var customized = str.replace(/'([^']*)'/g, function (_, match) {
        var pathSegments = match.split("/");
        if (match.startsWith("/") && pathSegments[pathSegments.length - 1].includes(".")) {
            // Some IDE's support path links
            isIntroduceFile = true;
            return node_util_1.default.inspect("file://" + match);
        }
        else {
            return node_util_1.default.inspect(match);
        }
    });
    // TypeScript doesn't show always the file name, for easier error handling we will add it.
    if (!isIntroduceFile && ((_a = diagnostic.file) === null || _a === void 0 ? void 0 : _a.fileName)) {
        var filename = diagnostic.file.fileName;
        if (diagnostic.start) {
            var _b = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _b.line, character = _b.character;
            filename += ":".concat(line + 1, ":").concat(character + 1);
        }
        return customized + " caused by: file://" + filename;
    }
    return customized;
}
exports.zCustomizeDiagnostic = zCustomizeDiagnostic;
/**
 * Function zTSConfigGetPath() - This function returns the path to the TypeScript configuration file based on the specified format.
 * It checks for different TypeScript configuration files depending on the environment and format.
 *
 * Fallback order:
 * -. tsconfig.{format}.dev.json
 * -. tsconfig.dev.json
 * -. tsconfig.{format}.json
 * -. tsconfig.json
 */
function zTSConfigGetPath(format, targetPath, showErrors) {
    if (showErrors === void 0) { showErrors = true; }
    function generateCacheKey(format, targetPath) {
        return "".concat(targetPath, "_").concat(format);
    }
    ;
    function logDebug(message) {
        console_manager_1.ConsoleManager.$.debug(function () { return ["typescript", zTSConfigGetPath.name, message]; });
    }
    ;
    function fileExists(filePath) {
        logDebug("".concat(node_util_1.default.inspect(filePath), " file exists check"));
        var exists = node_fs_1.default.existsSync(filePath);
        logDebug("".concat(node_util_1.default.inspect(filePath), " ").concat(exists ? "found" : "not found"));
        return exists;
    }
    ;
    function getTSConfigPath(configFileName) {
        return node_path_1.default.join(targetPath, configFileName);
    }
    function getTSConfigBundlePath(source) {
        if (source === void 0) { source = getTSConfigPath; }
        if (node_process_1.default.env.NODE_ENV === "development") {
            var devFormatFilePath = source("tsconfig.".concat(format, ".dev.json"));
            if (fileExists(devFormatFilePath)) {
                return devFormatFilePath;
            }
            var devFilePath = source("tsconfig.dev.json");
            if (fileExists(devFilePath)) {
                return devFilePath;
            }
        }
        var formatFilePath = source("tsconfig.".concat(format, ".json"));
        if (fileExists(formatFilePath)) {
            return formatFilePath;
        }
        var defaultFilePath = source("tsconfig.json");
        if (fileExists(defaultFilePath)) {
            return defaultFilePath;
        }
    }
    var cacheKey = generateCacheKey(format, targetPath);
    if (pathsCache[cacheKey]) {
        return pathsCache[cacheKey];
    }
    var tsConfigPath = getTSConfigBundlePath();
    if (tsConfigPath) {
        return pathsCache[cacheKey] = tsConfigPath;
    }
    if (showErrors) {
        console_manager_1.ConsoleManager.$.error("tsconfig.json not found");
    }
}
exports.zTSConfigGetPath = zTSConfigGetPath;
/**
 * Function zTSConfigRead() - Read and parse TypeScript configuration from tsconfig.json file.
 */
function zTSConfigRead(format, projectPath) {
    var cacheKey = projectPath + "_" + format;
    if (configCache[cacheKey]) {
        return configCache[cacheKey];
    }
    var tsConfigPath = zTSConfigGetPath(format, projectPath, false);
    if (!tsConfigPath) {
        throw new Error("tsconfig.json not found");
    }
    console_manager_1.ConsoleManager.$.debug(function () { return [
        "Ts-Config",
        zTSConfigRead.name,
        "Reading and parsing ".concat(node_util_1.default.inspect(tsConfigPath), " of project ").concat(node_util_1.default.inspect(projectPath))
    ]; });
    var data = typescript_1.default.readConfigFile(tsConfigPath, typescript_1.default.sys.readFile);
    if (data.error) {
        var error = new Error();
        error.cause = tsConfigPath;
        error.name = "\x1b[31mTypeScript 'tsconfig' configuration error\x1b[0m";
        error.message = "\n" + zCustomizeDiagnostic(data.error);
        throw error;
    }
    var content = typescript_1.default.parseJsonConfigFileContent(data.config, typescript_1.default.sys, projectPath);
    if (content.errors.length) {
        var error = new Error();
        error.cause = tsConfigPath;
        error.name = "\x1b[31mTypeScript 'tsconfig' parse error\x1b[0m";
        error.message = "\n" + content.errors.map(function (error) { return zCustomizeDiagnostic(error); })
            .join("\n\n");
        console_manager_1.ConsoleManager.$.error(error);
        if (content.options.noEmitOnError) {
            node_process_1.default.exit(1);
        }
    }
    configCache[cacheKey] = Object.assign({}, content);
    content.options.rootDir = content.options.rootDir || projectPath;
    content.options.configFilePath = tsConfigPath;
    return content;
}
exports.zTSConfigRead = zTSConfigRead;
/**
 * Function zTSGetCompilerHost() - Retrieves the compiler host for a given TypeScript configuration.
 *
 * Retrieves the compiler host for a given TypeScript configuration.
 */
function zTSGetCompilerHost(tsConfig, activeConsole) {
    if (activeConsole === void 0) { activeConsole = console_manager_1.ConsoleManager.$; }
    var outPath = tsConfig.options.declarationDir || tsConfig.options.outDir;
    if (!outPath) {
        throw new Error("".concat(tsConfig.options.configFilePath, ": 'declarationDir' or 'outDir' is required"));
    }
    // Get from cache
    if (cacheCompilerHost[outPath]) {
        return cacheCompilerHost[outPath];
    }
    var compilerHost = typescript_1.default.createCompilerHost(tsConfig.options, true), compilerHostGetSourceFile = compilerHost.getSourceFile;
    compilerHost.getSourceFile = function (fileName, languageVersion, onError, shouldCreateNewSourceFile) {
        // Exclude internal TypeScript files from validation
        if (fileName.startsWith(outPath)) {
            activeConsole.verbose(function () { return [
                "".concat(zTSGetCompilerHost.name, "::").concat(compilerHost.getSourceFile.name),
                "Skipping '".concat(fileName, "', internal TypeScript file")
            ]; });
            return;
        }
        return compilerHostGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };
    cacheCompilerHost[tsConfig.options.configFilePath] = compilerHost;
    return compilerHost;
}
exports.zTSGetCompilerHost = zTSGetCompilerHost;
/**
 * Function zTSPreDiagnostics() - Runs pre-diagnostics for specific TypeScript configuration.
 *
 * This function runs TypeScript's pre-emit diagnostics on the provided TypeScript configuration.
 *
 * This means it checks for errors in your TypeScript code before it gets compiled to JavaScript.
 *
 * Catching errors at this stage can save time during the development process.
 */
function zTSPreDiagnostics(tsConfig, options, activeConsole) {
    if (activeConsole === void 0) { activeConsole = console_manager_1.ConsoleManager.$; }
    // ---
    var _a = options.useCache, useCache = _a === void 0 ? true : _a, _b = options.haltOnError, haltOnError = _b === void 0 ? false : _b;
    /**
     * Validation should run only once per tsconfig.json file, validation and declaration generation
     * should be based on main `tsconfig.json` file, not on `tsconfig.es.json` or `tsconfig.es.dev.json`, etc.
     */
    if (useCache && configValidationCache[tsConfig.options.configFilePath]) {
        activeConsole.verbose(function () { return [
            zTSPreDiagnostics.name,
            "Skipping validation for '".concat(tsConfig.options.configFilePath, "', already validated")
        ]; });
        return;
    }
    var compilerHost = zTSGetCompilerHost(tsConfig);
    var program = typescript_1.default.createProgram(tsConfig.fileNames, Object.assign({}, tsConfig.options, {
        noEmit: true,
        // In case `tsconfig.dev.json` is used, we don't want to generate source maps or declarations for diagnostic
        inlineSourceMap: false,
        sourceMap: false,
        inlineSources: false,
        declaration: false,
        declarationMap: false,
        declarationDir: undefined,
    }), compilerHost, cacheProgram[tsConfig.options.configFilePath]);
    cacheProgram[tsConfig.options.configFilePath] = program;
    var diagnostics = typescript_1.default.getPreEmitDiagnostics(program);
    configValidationCache[tsConfig.options.configFilePath] = true;
    if (diagnostics.length) {
        var error = new Error();
        error.name = "\u001B[31mTypeScript validation has ".concat(diagnostics.length, " error(s)\u001B[0m config: ").concat("file://" + tsConfig.options.configFilePath);
        error.message = "\n" + diagnostics.map(function (error) { return zCustomizeDiagnostic(error); }).join("\n\n");
        activeConsole.error(error);
        if (haltOnError || tsConfig.options.noEmitOnError) {
            node_process_1.default.exit(1);
        }
    }
    return diagnostics;
}
exports.zTSPreDiagnostics = zTSPreDiagnostics;
function zTSCreateDeclaration(tsConfig, config, activeConsole) {
    if (activeConsole === void 0) { activeConsole = console_manager_1.ConsoleManager.$; }
    var compilerHost = zTSGetCompilerHost(tsConfig);
    var program = typescript_1.default.createProgram(tsConfig.fileNames, Object.assign({}, tsConfig.options, {
        declaration: true,
        noEmit: false,
        emitDeclarationOnly: true,
        declarationDir: tsConfig.options.declarationDir || tsConfig.options.outDir,
    }), compilerHost, cacheProgram[tsConfig.options.configFilePath]);
    cacheProgram[tsConfig.options.configFilePath] = program;
    // Remove old declaration .d.ts files
    var declarationPath = tsConfig.options.declarationDir || tsConfig.options.outDir;
    if (!declarationPath) {
        throw new Error("".concat(tsConfig.options.configFilePath, ": 'declarationDir' or 'outDir' is required"));
    }
    var result = program.emit();
    if (result.diagnostics.length) {
        var error = new Error();
        error.name = "\u001B[31mTypeScript declaration has ".concat(result.diagnostics.length, " error(s)\u001B[0m config: ").concat("file://" + tsConfig.options.configFilePath);
        error.message = "\n" + result.diagnostics.map(function (error) { return zCustomizeDiagnostic(error); }).join("\n\n");
        activeConsole.error(error);
    }
    else {
        activeConsole.verbose(function () { return [
            zTSCreateDeclaration.name,
            "Declaration created for '".concat(tsConfig.options.configFilePath, "'")
        ]; });
        var projectPath = node_path_1.default.dirname(config.path);
        // Check if we need to generate dts file.
        if (config.inputDtsPath) {
            var result_1 = (0, api_extractor_1.zApiExporter)(projectPath, config.inputDtsPath, config.outputDtsPath, activeConsole);
            (result_1 === null || result_1 === void 0 ? void 0 : result_1.succeeded) && activeConsole.log(api_extractor_1.zApiExporter.name, "Writing - done", "'".concat(node_path_1.default.isAbsolute(config.outputDtsPath) ? config.outputDtsPath : node_path_1.default.join(projectPath, config.outputDtsPath), "'"));
        }
    }
    return result.diagnostics.length <= 0;
}
exports.zTSCreateDeclaration = zTSCreateDeclaration;
function zTSDiagnosticInWorker(tsConfigFilePath, options, host) {
    (0, utils_1.ensureInWorker)();
    // Hook console logs to thread messages.
    console_manager_1.ConsoleManager.setInstance(new console_thread_send_1.ConsoleThreadSend(host));
    var tsConfig = zTSConfigRead(null, node_path_1.default.dirname(tsConfigFilePath));
    host.sendLog("run", node_util_1.default.inspect(options.config.outputName));
    return zTSPreDiagnostics(tsConfig, options);
}
exports.zTSDiagnosticInWorker = zTSDiagnosticInWorker;
function zTSDeclarationInWorker(tsConfigFilePath, config, host) {
    (0, utils_1.ensureInWorker)();
    // Hook console logs to thread messages.
    console_manager_1.ConsoleManager.setInstance(new console_thread_send_1.ConsoleThreadSend(host));
    var tsConfig = zTSConfigRead(null, node_path_1.default.dirname(tsConfigFilePath));
    host.sendLog("run", node_util_1.default.inspect(config.outputName));
    return zTSCreateDeclaration(tsConfig, config);
}
exports.zTSDeclarationInWorker = zTSDeclarationInWorker;
function zTSCreateDiagnosticWorker(tsConfig, options, activeConsole) {
    return __awaiter(this, void 0, void 0, function () {
        var zCreateWorker, worker, thread;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!diagnosticWorkers.has(options.id)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("@zenflux/worker"); })];
                case 1:
                    zCreateWorker = (_a.sent()).zCreateWorker;
                    worker = zCreateWorker({
                        name: "Diagnostic",
                        id: options.id,
                        display: tsConfig.options.configFilePath,
                        workArgs: [tsConfig.options.configFilePath, options],
                        workFunction: zTSDiagnosticInWorker,
                    });
                    console_thread_receive_1.ConsoleThreadReceive.connect(worker, activeConsole);
                    diagnosticWorkers.set(options.id, worker);
                    _a.label = 2;
                case 2:
                    thread = diagnosticWorkers.get(options.id);
                    if (!thread) {
                        throw new Error("Thread not found.");
                    }
                    if (!thread.isAlive()) {
                        diagnosticWorkers.delete(options.id);
                        return [2 /*return*/, zTSCreateDiagnosticWorker(tsConfig, options, activeConsole)];
                    }
                    return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var buildPromise;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // Main thread will wait for dependencies before starting the worker.
                                    return [4 /*yield*/, zTSWaitForDependencies(tsConfig, options.otherTSConfigs, activeConsole)];
                                    case 1:
                                        // Main thread will wait for dependencies before starting the worker.
                                        _a.sent();
                                        buildPromise = thread.run();
                                        buildPromise.catch(function (error) {
                                            activeConsole.error("error", "from DI-" + options.id, "\n ->", error);
                                            if (options.haltOnError) {
                                                throw error;
                                            }
                                            // Skip declaration worker if diagnostic worker errors.
                                            var declarationThread = declarationWorkers.get(options.id);
                                            if (declarationThread) {
                                                activeConsole.verbose(function () { return [
                                                    zTSCreateDiagnosticWorker.name,
                                                    "Skipping declaration worker DI".concat(options.id)
                                                ]; });
                                                declarationThread.skipNextRun(); //
                                            }
                                        });
                                        buildPromise.then(resolve).catch(reject);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
            }
        });
    });
}
exports.zTSCreateDiagnosticWorker = zTSCreateDiagnosticWorker;
function zTSCreateDeclarationWorker(tsConfig, options, activeConsole) {
    return __awaiter(this, void 0, void 0, function () {
        var zCreateWorker, worker, thread, promise;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!declarationWorkers.has(options.id)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("@zenflux/worker"); })];
                case 1:
                    zCreateWorker = (_a.sent()).zCreateWorker;
                    worker = zCreateWorker({
                        name: "Declaration",
                        id: options.id,
                        display: tsConfig.options.configFilePath,
                        workArgs: [tsConfig.options.configFilePath, options.config],
                        workFunction: zTSDeclarationInWorker,
                    });
                    console_thread_receive_1.ConsoleThreadReceive.connect(worker, activeConsole);
                    declarationWorkers.set(options.id, worker);
                    _a.label = 2;
                case 2:
                    thread = declarationWorkers.get(options.id);
                    if (!thread) {
                        throw new Error("Thread not found.");
                    }
                    if (!thread.isAlive()) {
                        declarationWorkers.delete(options.id);
                        return [2 /*return*/, zTSCreateDeclarationWorker(tsConfig, options, activeConsole)];
                    }
                    promise = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var diagnosticThread, shouldRun, buildPromise;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: 
                                // Main thread will wait for dependencies before starting the worker.
                                return [4 /*yield*/, zTSWaitForDependencies(tsConfig, options.otherTSConfigs, activeConsole)];
                                case 1:
                                    // Main thread will wait for dependencies before starting the worker.
                                    _a.sent();
                                    diagnosticThread = diagnosticWorkers.get(options.id);
                                    if (!diagnosticThread) {
                                        reject("Diagnostic worker DI".concat(options.id, " not found"));
                                    }
                                    activeConsole.verbose(function () { return [
                                        zTSCreateDeclarationWorker.name,
                                        "Waiting for diagnostic worker DI".concat(options.id, " to finish")
                                    ]; });
                                    return [4 /*yield*/, (diagnosticThread === null || diagnosticThread === void 0 ? void 0 : diagnosticThread.waitForDone().catch(reject))];
                                case 2:
                                    shouldRun = _a.sent();
                                    activeConsole.verbose(function () { return [
                                        zTSCreateDeclarationWorker.name,
                                        "Done waiting for diagnostic worker DI".concat(options.id)
                                    ]; });
                                    if (!shouldRun) {
                                        return [2 /*return*/];
                                    }
                                    buildPromise = thread.run();
                                    buildPromise.catch(function (error) {
                                        if (error.message.includes("Killed by diagnostic worker")) {
                                            activeConsole.verbose(function () { return [
                                                zTSCreateDeclarationWorker.name,
                                                error.message
                                            ]; });
                                        }
                                        else {
                                            activeConsole.error("error", "from DI-" + options.id, "\n ->", error);
                                        }
                                        reject(error);
                                    });
                                    buildPromise.then(resolve);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    promise.catch(function () { }).finally(function () { return zTSResumeDependencies(tsConfig, activeConsole); });
                    return [2 /*return*/, promise];
            }
        });
    });
}
exports.zTSCreateDeclarationWorker = zTSCreateDeclarationWorker;
function zTSWaitForDependencies(tsConfig, otherTSConfigs, activeConsole) {
    var _a;
    if (activeConsole === void 0) { activeConsole = console_manager_1.ConsoleManager.$; }
    return __awaiter(this, void 0, void 0, function () {
        var promise, pkg, pkgDependencies, dependencies, availableDependencies_1, promise;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // If promise is already exist then await it.
                    if (waitingTSConfigs.has(tsConfig.options.configFilePath)) {
                        promise = (_a = waitingTSConfigs.get(tsConfig.options.configFilePath)) === null || _a === void 0 ? void 0 : _a.promise;
                        if (promise === null || promise === void 0 ? void 0 : promise.isPending) {
                            return [2 /*return*/, promise.await];
                        }
                        return [2 /*return*/];
                    }
                    pkg = (0, typescript_2.zTSGetPackageByTSConfig)(tsConfig), pkgDependencies = (0, workspace_1.zWorkspaceGetWorkspaceDependencies)((_b = {},
                        _b[pkg.json.name] = pkg,
                        _b)), dependencies = pkgDependencies[pkg.json.name].dependencies;
                    if (!Object.keys(dependencies).length) return [3 /*break*/, 2];
                    availableDependencies_1 = {};
                    otherTSConfigs.forEach(function (c) {
                        var pkg = (0, typescript_2.zTSGetPackageByTSConfig)(c);
                        if (dependencies[pkg.json.name]) {
                            availableDependencies_1[pkg.json.name] = true;
                        }
                    });
                    if (!Object.keys(availableDependencies_1).length) return [3 /*break*/, 2];
                    activeConsole.verbose(function () { return [
                        zTSWaitForDependencies.name,
                        "Package:",
                        node_util_1.default.inspect(pkg.json.name),
                        "Available dependencies:",
                        node_util_1.default.inspect(Object.keys(availableDependencies_1), { breakLength: Infinity }),
                    ]; });
                    promise = (0, promise_1.zCreateResolvablePromise)();
                    // Insert current config to the waiting list.
                    waitingTSConfigs.set(tsConfig.options.configFilePath, {
                        promise: promise,
                        dependencies: availableDependencies_1
                    });
                    return [4 /*yield*/, promise.await];
                case 1:
                    _c.sent();
                    activeConsole.verbose(function () { return [
                        zTSWaitForDependencies.name,
                        "Resume",
                        "Package:",
                        node_util_1.default.inspect(pkg.json.name),
                    ]; });
                    _c.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function zTSResumeDependencies(tsConfig, activeConsole) {
    if (activeConsole === void 0) { activeConsole = console_manager_1.ConsoleManager.$; }
    return __awaiter(this, void 0, void 0, function () {
        var pkg, _i, waitingTSConfigs_1, _a, configFilePath, _b, promise, dependencies;
        return __generator(this, function (_c) {
            if (!waitingTSConfigs.size) {
                return [2 /*return*/];
            }
            pkg = (0, typescript_2.zTSGetPackageByTSConfig)(tsConfig);
            // Loop through all waiting TSConfigs
            for (_i = 0, waitingTSConfigs_1 = waitingTSConfigs; _i < waitingTSConfigs_1.length; _i++) {
                _a = waitingTSConfigs_1[_i], configFilePath = _a[0], _b = _a[1], promise = _b.promise, dependencies = _b.dependencies;
                // If current resumed TSConfig is in the dependencies list then remove it from the dependencies list.
                if (dependencies[pkg.json.name]) {
                    activeConsole.verbose(function () { return [
                        zTSResumeDependencies.name,
                        "Package:",
                        node_util_1.default.inspect((0, typescript_2.zTSGetPackageByTSConfig)(tsConfig).json.name),
                        "Removing dependency:",
                        node_util_1.default.inspect(pkg.json.name),
                    ]; });
                    delete dependencies[pkg.json.name];
                }
                // If no left dependencies then resolve the promise.
                if (!Object.keys(dependencies).length) {
                    activeConsole.verbose(function () { return [
                        zTSResumeDependencies.name,
                        "Package:",
                        node_util_1.default.inspect(pkg.json.name),
                        "Resuming",
                    ]; });
                    // Remove the TSConfig from the waiting list.
                    waitingTSConfigs.delete(configFilePath);
                    promise.resolve();
                }
            }
            return [2 /*return*/];
        });
    });
}
