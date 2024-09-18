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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.CommandBuildBase = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_path_1 = require("node:path");
var node_process_1 = require("node:process");
var node_util_1 = require("node:util");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var command_config_base_1 = require("@zenflux/cli/src/base/command-config-base");
var console_build_1 = require("@zenflux/cli/src/console/console-build");
var rollup_1 = require("@zenflux/cli/src/core/rollup");
var typescript_1 = require("@zenflux/cli/src/core/typescript");
var config_1 = require("@zenflux/cli/src/definitions/config");
var CommandBuildBase = /** @class */ (function (_super) {
    __extends(CommandBuildBase, _super);
    function CommandBuildBase(args, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, args, options) || this;
        _this.args = args;
        _this.options = options;
        _this.rollupConfig = {};
        // TODO: Avoid using `process.env.NODE_ENV` use CommandBase instead
        if (args.includes("--dev")) {
            node_process_1.default.env.NODE_ENV = "development";
        }
        return _this;
    }
    CommandBuildBase.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Ensure that original console instance is saved.
                console_manager_1.ConsoleManager.getInstance();
                // Set global console instance as rollupConsole.
                console_manager_1.ConsoleManager.setInstance(this.getRollupConsole());
                return [2 /*return*/, _super.prototype.initialize.call(this)];
            });
        });
    };
    CommandBuildBase.prototype.showHelp = function (name) {
        _super.prototype.showHelp.call(this, name);
        // Describe what the `--dev` option does for the command
        console_manager_1.ConsoleManager.$.log(node_util_1.default.inspect({
            "--dev": {
                description: "Run in development mode",
                behaviors: [
                    "Shows all api-exporter diagnostics",
                    "No minification",
                    "Loading different tsconfig file: tsconfig.{format}.dev.json",
                    "Sets process.env.NODE_ENV to 'development'"
                ]
            },
            "--no-diagnostic": {
                description: "Disable typescript diagnostics",
                behaviors: [
                    "No typescript diagnostics"
                ]
            },
            "--no-declaration": {
                description: "Disable typescript declaration",
                behaviors: [
                    "No declaration file generation",
                    "No api-exporter will be used"
                ]
            },
        }));
    };
    CommandBuildBase.prototype.loadConfigs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promise = _super.prototype.loadConfigs.call(this);
                        return [4 /*yield*/, promise];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Promise.all(this.getConfigs().map(function (config) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, _b;
                                var _this = this;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            this.getRollupConsole().verbose(function () { return [
                                                _this.constructor.name,
                                                _this.loadConfigs.name,
                                                "Start building rollup config for: ".concat(node_util_1.default.inspect(config.outputName), " config path: ").concat(node_util_1.default.inspect(config.path))
                                            ]; });
                                            _a = this.rollupConfig;
                                            _b = config.path + "-" + config.outputName;
                                            return [4 /*yield*/, this.getConfigForEachFormat(config)];
                                        case 1:
                                            _a[_b] = _c.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, promise];
                }
            });
        });
    };
    CommandBuildBase.prototype.getRollupConsole = function () {
        return console_build_1.rollupConsole;
    };
    CommandBuildBase.prototype.getTSDiagnosticsConsole = function () {
        return console_build_1.tsDiagnosticConsole;
    };
    CommandBuildBase.prototype.getTSDeclarationConsole = function () {
        return console_build_1.tsDeclarationConsole;
    };
    CommandBuildBase.prototype.getTotalDiagnosticMessage = function (passed, failed, startTimestamp) {
        return [
            "Passed: ".concat(node_util_1.default.inspect(passed), ", Failed: \u001B[31m").concat(failed, "\u001B[0m"),
            "Toke ".concat(node_util_1.default.inspect(Date.now() - startTimestamp), "ms")
        ];
    };
    CommandBuildBase.prototype.handleTSDiagnostics = function (config, options) {
        if (options === void 0) { options = {
            useCache: false,
            haltOnError: node_process_1.default.argv.includes("--haltOnDiagnosticError"),
        }; }
        return __awaiter(this, void 0, void 0, function () {
            var tsDiagnosticConsole, id, otherConfigs, otherTSConfigs, promise;
            return __generator(this, function (_a) {
                if (node_process_1.default.argv.includes("--no-diagnostic")) {
                    return [2 /*return*/];
                }
                tsDiagnosticConsole = this.getTSDiagnosticsConsole(), id = this.getIdByConfig(config), otherConfigs = this.getConfigs().filter(function (c) { return c !== config; });
                otherTSConfigs = otherConfigs.map(function (c) { return (0, typescript_1.zTSConfigRead)(null, node_path_1.default.dirname(c.path)); });
                tsDiagnosticConsole.log("send", "to DS-" + id, node_util_1.default.inspect(config.outputName));
                promise = (0, typescript_1.zTSCreateDiagnosticWorker)((0, typescript_1.zTSConfigRead)(null, node_path_1.default.dirname(config.path)), __assign({ id: id, otherTSConfigs: otherTSConfigs, config: config }, options), tsDiagnosticConsole);
                promise.catch(function () { }).then(function () {
                    tsDiagnosticConsole.log("recv", "from DS-" + id, node_util_1.default.inspect(config.outputName));
                });
                return [2 /*return*/, promise];
            });
        });
    };
    CommandBuildBase.prototype.handleTSDeclaration = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var tsDeclarationConsole, id, otherConfigs, otherTSConfigs, result;
            return __generator(this, function (_a) {
                if (node_process_1.default.argv.includes("--no-declaration")) {
                    return [2 /*return*/];
                }
                tsDeclarationConsole = this.getTSDeclarationConsole(), id = this.getIdByConfig(config), otherConfigs = this.getConfigs().filter(function (c) { return c !== config; }), otherTSConfigs = otherConfigs.map(function (c) { return (0, typescript_1.zTSConfigRead)(null, node_path_1.default.dirname(c.path)); });
                tsDeclarationConsole.log("send", "to DE-" + id, node_util_1.default.inspect(config.outputName));
                result = (0, typescript_1.zTSCreateDeclarationWorker)((0, typescript_1.zTSConfigRead)(null, node_path_1.default.dirname(config.path)), {
                    id: id,
                    config: config,
                    otherTSConfigs: otherTSConfigs
                }, tsDeclarationConsole);
                result.catch(function () { }).then(function () {
                    tsDeclarationConsole.log("recv", "from DE-" + id, node_util_1.default.inspect(config.outputName));
                });
                return [2 /*return*/, result];
            });
        });
    };
    CommandBuildBase.prototype.onBuiltAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configs, uniqueConfigs, startTimestamp, promises, passed, failed;
            var _this = this;
            return __generator(this, function (_a) {
                configs = this.getConfigs(), uniqueConfigs = this.getUniqueConfigs(configs), startTimestamp = Date.now(), promises = [];
                passed = 0, failed = 0;
                uniqueConfigs.forEach(function (config) { return _this.handleTSDiagnostics(config).catch(function () {
                    // Do nothing.
                }); });
                uniqueConfigs.forEach(function (config) {
                    var promise = _this.handleTSDeclaration(config)
                        .then(function () { return passed++; })
                        .catch(function () { return failed++; });
                    promises.push(promise);
                });
                if (!node_process_1.default.argv.includes("--no-declaration")) {
                    return [2 /*return*/, Promise.all(promises).finally(function () {
                            var _a;
                            (_a = _this.getTSDeclarationConsole()).log.apply(_a, __spreadArray(["Total"], _this.getTotalDiagnosticMessage(passed, failed, startTimestamp), false));
                        })];
                }
                return [2 /*return*/];
            });
        });
    };
    CommandBuildBase.prototype.getRollupConfig = function (config) {
        // TODO: Use helper function if its used in more than one place
        return this.rollupConfig[config.path + "-" + config.outputName];
    };
    CommandBuildBase.prototype.getIdByConfig = function (config) {
        return this.getUniqueConfigs(this.getConfigs()).indexOf(config);
    };
    CommandBuildBase.prototype.getUniqueConfigs = function (configs) {
        return configs.filter(function (config, index, self) {
            // Should filter duplicate config.paths.
            return index === self.findIndex(function (c) {
                return c.path === config.path;
            });
        });
    };
    CommandBuildBase.prototype.getConfigForEachFormat = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(config.format.map(function (format) { return (0, rollup_1.zRollupGetConfig)(__assign(__assign(__assign({}, config_1.Z_CONFIG_DEFAULTS), config), { format: format }), node_path_1.default.dirname(config.path)); }))];
            });
        });
    };
    return CommandBuildBase;
}(command_config_base_1.CommandConfigBase));
exports.CommandBuildBase = CommandBuildBase;
