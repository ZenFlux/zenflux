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
exports.CommandConfigBase = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_util_1 = require("node:util");
var config_1 = require("@zenflux/cli/src/core/config");
var workspace_1 = require("@zenflux/cli/src/core/workspace");
var global_1 = require("@zenflux/cli/src/core/global");
var command_base_1 = require("@zenflux/cli/src/base/command-base");
var package_1 = require("@zenflux/cli/src/modules/npm/package");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var CommandConfigBase = /** @class */ (function (_super) {
    __extends(CommandConfigBase, _super);
    function CommandConfigBase() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.configs = [];
        _this.isWorkspaceSpecified = false;
        return _this;
    }
    /**
     * Initializes the workspace and project paths based on the command line arguments.
     */
    CommandConfigBase.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var workspaceArgIndex, result, workspacePaths;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workspaceArgIndex = this.args.indexOf("--workspace");
                        if (!(workspaceArgIndex > -1)) return [3 /*break*/, 2];
                        this.isWorkspaceSpecified = true;
                        return [4 /*yield*/, (0, workspace_1.zWorkspaceFindPackages)(this.args[workspaceArgIndex + 1]
                                .split(",")
                                .map(function (i) { return i.trim().replace(/"/g, ""); }), this.initPathsArgs.workspacePath)];
                    case 1:
                        result = _a.sent();
                        if (!Object.keys(result).length) {
                            console_manager_1.ConsoleManager.$.error("build", "workspace", "Package(s) not found: ".concat(node_util_1.default.inspect(this.args[workspaceArgIndex + 1])));
                        }
                        this.initPathsArgs.projectsPaths = Object.values(result).map(function (i) { return i.getPath(); });
                        return [2 /*return*/];
                    case 2:
                        if (!(this.initPathsArgs.workspacePath === this.initPathsArgs.cwd)) return [3 /*break*/, 4];
                        return [4 /*yield*/, (0, workspace_1.zWorkspaceGetPackagesPaths)(new package_1.Package(this.initPathsArgs.cwd))];
                    case 3:
                        workspacePaths = _a.sent();
                        this.initPathsArgs.projectsPaths = workspacePaths.flatMap(function (i) { return i.packages; });
                        return [2 /*return*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CommandConfigBase.prototype.showHelp = function (name) {
        _super.prototype.showHelp.call(this, name);
        console_manager_1.ConsoleManager.$.log(node_util_1.default.inspect({
            "--config": {
                description: "Specify a custom config file",
                // aliases: [ "-c" ],
                examples: [
                    "--config <config-file-name>",
                    "--config zenflux.test.config.ts",
                ]
            },
            "--workspace": {
                description: "Run for specific workspace",
                examples: [
                    "--workspace <company@package-name>",
                    "--workspace <package-name>",
                    "--workspace <package-name-a>, <package-name-b>",
                    "--workspace \"prefix-*\", \"react-*\""
                ]
            }
        }));
    };
    CommandConfigBase.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.run.call(this, false)];
                    case 1:
                        if (!(_a.sent())) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.loadConfigs()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.runImpl()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CommandConfigBase.prototype.loadConfigs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configArgIndex, configFileName, promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        configArgIndex = this.args.indexOf("--config");
                        if (configArgIndex > -1) {
                            configFileName = this.args[configArgIndex + 1];
                        }
                        promises = this.paths.projects.map(function (projectPath) { return __awaiter(_this, void 0, void 0, function () {
                            var path, config;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        path = (0, global_1.zGlobalGetConfigPath)(projectPath, configFileName);
                                        return [4 /*yield*/, (0, config_1.zConfigLoad)(path, this.paths.projects.length > 1)];
                                    case 1:
                                        config = _b.sent();
                                        if (config) {
                                            (_a = this.configs).push.apply(_a, config);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.configs];
                }
            });
        });
    };
    CommandConfigBase.prototype.getConfigs = function () {
        return this.configs;
    };
    CommandConfigBase.prototype.getConfigsPaths = function () {
        var result = {};
        for (var _i = 0, _a = this.configs; _i < _a.length; _i++) {
            var config = _a[_i];
            result[config.path] = true;
        }
        return Object.keys(result);
    };
    return CommandConfigBase;
}(command_base_1.CommandBase));
exports.CommandConfigBase = CommandConfigBase;
