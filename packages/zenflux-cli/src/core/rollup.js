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
exports.zRollupGetConfig = exports.zRollupGetOutput = exports.zRollupGetPlugins = exports.zRollupPluginModuleResolve = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_path_1 = require("node:path");
var node_process_1 = require("node:process");
var node_util_1 = require("node:util");
var plugin_node_resolve_1 = require("@rollup/plugin-node-resolve");
var plugin_commonjs_1 = require("@rollup/plugin-commonjs");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var global_1 = require("@zenflux/cli/src/core/global");
var workspace_1 = require("@zenflux/cli/src/core/workspace");
var rollup_cjs_async_wrap_plugin_1 = require("@zenflux/cli/src/core/rollup-plugins/rollup-cjs-async-wrap/rollup-cjs-async-wrap-plugin");
var rollup_custom_loader_plugin_1 = require("@zenflux/cli/src/core/rollup-plugins/rollup-custom-loader/rollup-custom-loader-plugin");
var rollup_swc_plugin_1 = require("@zenflux/cli/src/core/rollup-plugins/rollup-swc/rollup-swc-plugin");
var typescript_1 = require("@zenflux/cli/src/core/typescript");
var package_json_1 = require("@zenflux/cli/package.json");
var DEFAULT_BASE_SRC_PATH = "/src";
function zRollupPluginModuleResolve(args) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        function resolveExt(tryResolvePath) {
            // If resolved path has no extension
            if (!node_path_1.default.extname(tryResolvePath)) {
                // Try to resolve with each extension
                for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
                    var ext = extensions_1[_i];
                    var tryPath = tryResolvePath + ext;
                    // Check if tryPath exist in args.tsConfig.fileNames
                    if (tsConfig.fileNames.includes(tryPath)) {
                        return tryPath;
                    }
                }
            }
            return null;
        }
        function resolveRelative(modulePath) {
            if (relativeCache.has(modulePath)) {
                return relativeCache.get(modulePath);
            }
            if (tsConfig.fileNames.includes(modulePath)) {
                return modulePath;
            }
            var tryResolvePath = node_path_1.default.resolve(baseSrcPath, modulePath);
            return resolveExt(tryResolvePath);
        }
        function resolveWorkspace(modulePath) {
            var _a, _b;
            if (workspaceCache.has(modulePath)) {
                return workspaceCache.get(modulePath);
            }
            // Cross `modulePath` with `packages`
            var modulePathParts = modulePath.split("/", 2), modulePathRest = modulePath.substring(modulePathParts[0].length + ((_b = (_a = modulePathParts[1]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) + 1, modulePath.length);
            var _loop_1 = function (packageName, packageObj) {
                if (packageName === modulePathParts[0] || packageName === modulePathParts[0] + "/" + modulePathParts[1]) {
                    var tryPath_1 = node_path_1.default.join(packageObj.getPath(), modulePathRest);
                    console_manager_1.ConsoleManager.$.debug(function () { return ["path-resolve", resolveRelative.name, node_util_1.default.inspect(tryPath_1)]; });
                    var tryResolve = resolveExt(tryPath_1);
                    if (tryResolve) {
                        workspaceCache.set(modulePath, tryResolve);
                        return { value: tryResolve };
                    }
                }
            };
            for (var _i = 0, _c = Object.entries(workspacePackages); _i < _c.length; _i++) {
                var _d = _c[_i], packageName = _d[0], packageObj = _d[1];
                var state_1 = _loop_1(packageName, packageObj);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        }
        function resolveAbsolute(modulePath) {
            if (absoluteCache.has(modulePath)) {
                return absoluteCache.get(modulePath);
            }
            // Check if modulePath exist in args.tsConfig.fileNames
            if (tsConfig.fileNames.includes(modulePath)) {
                return modulePath;
            }
            return resolveExt(modulePath);
        }
        var tsConfig, projectPath, baseSrcPath, extensions, workspacePackages, relativeCache, workspaceCache, absoluteCache;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    tsConfig = args.tsConfig, projectPath = args.projectPath, baseSrcPath = (_a = tsConfig === null || tsConfig === void 0 ? void 0 : tsConfig.options.baseUrl) !== null && _a !== void 0 ? _a : function useDefaultSrcPath() {
                        var srcPath = node_path_1.default.join(projectPath, DEFAULT_BASE_SRC_PATH);
                        console_manager_1.ConsoleManager.$.debug(function () { return ["path-resolve", useDefaultSrcPath.name, node_util_1.default.inspect(srcPath)]; });
                        return srcPath;
                    }(), extensions = args.extensions;
                    return [4 /*yield*/, (0, workspace_1.zWorkspaceGetPackages)("auto")];
                case 1:
                    workspacePackages = _b.sent();
                    relativeCache = new Map(), workspaceCache = new Map(), absoluteCache = new Map();
                    return [2 /*return*/, {
                            name: "z-rollup-plugin-resolve",
                            resolveId: function (source) {
                                var isAbsolute = node_path_1.default.isAbsolute(source);
                                // Try relative path
                                if (!isAbsolute && source.startsWith(".")) {
                                    var tryResolve_1 = resolveRelative(source);
                                    if (tryResolve_1) {
                                        console_manager_1.ConsoleManager.$.debug(function () { return ["path-resolve", resolveRelative.name, node_util_1.default.inspect(tryResolve_1)]; });
                                        return {
                                            id: tryResolve_1,
                                            external: false,
                                            resolvedBy: zRollupPluginModuleResolve.name,
                                        };
                                    }
                                }
                                if (!isAbsolute) {
                                    // Try workspace path
                                    var tryResolve_2 = resolveWorkspace(source);
                                    if (tryResolve_2) {
                                        console_manager_1.ConsoleManager.$.debug(function () { return ["path-resolve", resolveWorkspace.name, node_util_1.default.inspect(tryResolve_2)]; });
                                        return {
                                            id: tryResolve_2,
                                            external: false,
                                            resolvedBy: zRollupPluginModuleResolve.name,
                                        };
                                    }
                                }
                                if (isAbsolute) {
                                    // Try absolute path
                                    var tryResolve_3 = resolveAbsolute(source);
                                    if (tryResolve_3) {
                                        console_manager_1.ConsoleManager.$.debug(function () { return ["path-resolve", resolveAbsolute.name, node_util_1.default.inspect(tryResolve_3)]; });
                                        return {
                                            id: tryResolve_3,
                                            external: false,
                                            resolvedBy: zRollupPluginModuleResolve.name,
                                        };
                                    }
                                }
                            },
                        }];
            }
        });
    });
}
exports.zRollupPluginModuleResolve = zRollupPluginModuleResolve;
/**
 * Function zRollupGetPlugins(): This function returns an array of Rollup plugins based on the provided arguments.
 */
var zRollupGetPlugins = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var extensions, format, requiredArgs, plugins, _a, _b, nodeResolvePlugin;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                extensions = args.extensions, format = args.format;
                requiredArgs = args;
                if ("undefined" === typeof args.tsConfig) {
                    requiredArgs.tsConfig = (0, typescript_1.zTSConfigRead)(format, args.projectPath);
                }
                plugins = [];
                _b = (_a = plugins).push;
                return [4 /*yield*/, zRollupPluginModuleResolve(requiredArgs)];
            case 1:
                _b.apply(_a, [_c.sent()]);
                nodeResolvePlugin = (0, plugin_node_resolve_1.default)({
                    extensions: extensions,
                    preferBuiltins: true,
                    modulePaths: [(0, global_1.zGlobalPathsGet)().workspace + "/node_modules/"],
                });
                plugins.push(nodeResolvePlugin);
                plugins.push((0, plugin_commonjs_1.default)({}));
                plugins.push((0, rollup_swc_plugin_1.default)(requiredArgs));
                if (args.enableCustomLoader) {
                    plugins.push((0, rollup_custom_loader_plugin_1.default)(requiredArgs));
                }
                if (args.enableCjsAsyncWrap) {
                    plugins.push((0, rollup_cjs_async_wrap_plugin_1.default)(requiredArgs));
                }
                return [2 /*return*/, plugins];
        }
    });
}); };
exports.zRollupGetPlugins = zRollupGetPlugins;
/**
 * Function zRollupGetOutput(): Generates an OutputOptions object based on the provided arguments.
 * It configures the output format, file path, and other options for the Rollup output.
 */
var zRollupGetOutput = function (args, projectPath) {
    var format = args.format, outputName = args.outputName, outputFileName = args.outputFileName;
    var tsConfig = (0, typescript_1.zTSConfigRead)(format, projectPath);
    var outDir = "".concat(tsConfig.options.outDir || projectPath + "/dist");
    var outputExt = "js";
    switch (format) {
        case "cjs":
            outputExt = "cjs";
            break;
        case "es":
            outputExt = "mjs";
            break;
    }
    var result = {
        // TODO: Should be configurable, eg: `{tsConfigOutDir}/{outputFileName}.{format}.{ext}`
        // file: `${ outDir }/${ outputFileName }.${ format }.${ ext }`,
        dir: outDir,
        entryFileNames: "".concat(outputFileName, ".").concat(outputExt),
        chunkFileNames: "".concat(outputFileName, "-[name].").concat(outputExt),
        sourcemap: tsConfig.options.sourceMap,
        format: format,
        indent: false,
        exports: "named",
        banner: "" +
            "/**\n" +
            " * Bundled with love using the help of ".concat(package_json_1.default.name, " toolkit v").concat(package_json_1.default.version, "\n") +
            " * Bundle name: ".concat(outputName, " fileName: '").concat(outputFileName, "', built at ").concat(new Date(), "\n") +
            " */\n",
    };
    if (outputName) {
        result.name = outputName;
    }
    return result;
};
exports.zRollupGetOutput = zRollupGetOutput;
/**
 * Function zRollupGetConfig(): This function generates a Rollup configuration object based on the provided arguments.
 * It assembles the input, output, and plugin configurations for Rollup.
 */
var zRollupGetConfig = function (args, projectPath) { return __awaiter(void 0, void 0, void 0, function () {
    var extensions, external, format, inputPath, outputFileName, outputName, result, outputArgs, pluginsArgs, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                extensions = args.extensions, external = args.external, format = args.format, inputPath = args.inputPath, outputFileName = args.outputFileName, outputName = args.outputName;
                result = {
                    input: node_path_1.default.isAbsolute(inputPath) ? inputPath : node_path_1.default.resolve(projectPath, inputPath),
                    external: external,
                    // Rollup is not trushworthy enough to do treeshaking, assuming swc will do it better
                    treeshake: false,
                };
                outputArgs = {
                    format: format,
                    outputName: outputName,
                    outputFileName: outputFileName
                };
                if (outputName) {
                    outputArgs.outputName = outputName;
                }
                result.output = (0, exports.zRollupGetOutput)(outputArgs, projectPath);
                pluginsArgs = {
                    extensions: extensions,
                    format: format,
                    moduleForwarding: args.moduleForwarding,
                    sourcemap: !!result.output.sourcemap,
                    minify: "development" !== node_process_1.default.env.NODE_ENV,
                    projectPath: projectPath,
                    enableCustomLoader: !!args.enableCustomLoader,
                    enableCjsAsyncWrap: !!args.enableCjsAsyncWrap,
                };
                _a = result;
                return [4 /*yield*/, (0, exports.zRollupGetPlugins)(pluginsArgs)];
            case 1:
                _a.plugins = _b.sent();
                return [2 /*return*/, result];
        }
    });
}); };
exports.zRollupGetConfig = zRollupGetConfig;
