"use strict";
// noinspection HttpUrlsUsage
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
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_child_process_1 = require("node:child_process");
var node_util_1 = require("node:util");
var node_fs_1 = require("node:fs");
var node_process_1 = require("node:process");
var config_1 = require("@verdaccio/config");
var node_api_1 = require("@verdaccio/node-api");
var registry_1 = require("@zenflux/cli/src/core/registry");
var command_base_1 = require("@zenflux/cli/src/base/command-base");
var zenflux_1 = require("@zenflux/cli/src/definitions/zenflux");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var package_1 = require("@zenflux/cli/src/modules/npm/package");
var net_1 = require("@zenflux/cli/src/utils/net");
var Registry = /** @class */ (function (_super) {
    __extends(Registry, _super);
    function Registry() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Registry.prototype.runImpl = function () {
        return __awaiter(this, void 0, void 0, function () {
            var args, paths, current, _a, _b, port_1, server_1, url_1, onlineHosts, hostId_1, npmRc;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        args = this.args, paths = this.paths;
                        current = (0, registry_1.zRegistryGetNpmRc)(paths.npmRc);
                        _a = args[0];
                        switch (_a) {
                            case "@server": return [3 /*break*/, 1];
                            case "@list": return [3 /*break*/, 6];
                            case "@use": return [3 /*break*/, 8];
                            case "@clean": return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 13];
                    case 1:
                        _b = current;
                        if (!_b) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, net_1.zNetCheckPortOnline)(current.port)];
                    case 2:
                        _b = (_c.sent());
                        _c.label = 3;
                    case 3:
                        if (_b) {
                            console_manager_1.ConsoleManager.$.error("Verdaccio server is already running on port '".concat(current.host, ":").concat(current.port, "' for workspace '").concat(paths.workspace, "'"));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, net_1.zNetFindFreePort)(zenflux_1.DEFAULT_Z_REGISTRY_PORT_RANGE, zenflux_1.DEFAULT_Z_REGISTRY_HOST)];
                    case 4:
                        port_1 = _c.sent();
                        this.serverEnsureVerdaccioConfig();
                        return [4 /*yield*/, (0, node_api_1.runServer)(paths.verdaccioConfig)];
                    case 5:
                        server_1 = _c.sent(), url_1 = "http://".concat(zenflux_1.DEFAULT_Z_REGISTRY_HOST, ":").concat(port_1);
                        server_1.listen(port_1, function () { return __awaiter(_this, void 0, void 0, function () {
                            var response, result, data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console_manager_1.ConsoleManager.$.log("Server running on port ".concat(port_1));
                                        console_manager_1.ConsoleManager.$.log("You can access the registry at ".concat(node_util_1.default.inspect(url_1)));
                                        console_manager_1.ConsoleManager.$.log("Username: ".concat(node_util_1.default.inspect(zenflux_1.DEFAULT_Z_REGISTRY_USER)));
                                        console_manager_1.ConsoleManager.$.log("Password: ".concat(node_util_1.default.inspect(zenflux_1.DEFAULT_Z_REGISTRY_PASSWORD)));
                                        console_manager_1.ConsoleManager.$.log("To close the server, press CTRL + C");
                                        if (!!current) return [3 /*break*/, 3];
                                        return [4 /*yield*/, fetch("".concat(url_1, "/-/user/org.couchdb.user:").concat(zenflux_1.DEFAULT_Z_REGISTRY_USER), {
                                                method: "PUT",
                                                headers: {
                                                    "Accept": "application/json",
                                                    "Content-Type": "application/json"
                                                },
                                                body: JSON.stringify({
                                                    "name": zenflux_1.DEFAULT_Z_REGISTRY_USER,
                                                    "password": zenflux_1.DEFAULT_Z_REGISTRY_PASSWORD,
                                                })
                                            })];
                                    case 1:
                                        response = _a.sent();
                                        return [4 /*yield*/, response.json()];
                                    case 2:
                                        result = _a.sent(), data = "//".concat(zenflux_1.DEFAULT_Z_REGISTRY_HOST, ":").concat(port_1, "/:_authToken=").concat(result.token);
                                        // Save token to `.z/verdaccio/.npmrc`
                                        node_fs_1.default.writeFileSync(paths.npmRc, data);
                                        _a.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        node_process_1.default.on("SIGINT", function () {
                            console_manager_1.ConsoleManager.$.log("Shutting down server...");
                            server_1.close(function () {
                                console_manager_1.ConsoleManager.$.log("Server closed");
                                node_process_1.default.exit(0);
                            });
                        });
                        return [3 /*break*/, 14];
                    case 6: return [4 /*yield*/, (0, registry_1.zRegistryGetAllOnlineNpmRcs)()];
                    case 7:
                        onlineHosts = _c.sent();
                        if (onlineHosts.length === 0) {
                            console_manager_1.ConsoleManager.$.log("No online registry hosts found");
                            return [2 /*return*/];
                        }
                        // Print hosts
                        console_manager_1.ConsoleManager.$.log("Online registry hosts:");
                        onlineHosts.forEach(function (host) {
                            return console_manager_1.ConsoleManager.$.log("Use command: ".concat(node_util_1.default.inspect("".concat(_this.options.name, " @use ").concat(host.id)), " - host: ").concat(host.host, ":").concat(host.port));
                        });
                        return [3 /*break*/, 14];
                    case 8:
                        // If no arguments then showHelp.
                        if (args.length === 1) {
                            return [2 /*return*/, this.showHelp()];
                        }
                        hostId_1 = args[1];
                        return [4 /*yield*/, (0, registry_1.zRegistryGetAllNpmRcs)()];
                    case 9:
                        npmRc = (_c.sent()).find((function (host) { return host.id === hostId_1; }));
                        if (!npmRc) {
                            console_manager_1.ConsoleManager.$.error("No registry host found with id '".concat(hostId_1, "'"));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, net_1.zNetCheckPortOnline)(npmRc.port)];
                    case 10:
                        // Check if host is online
                        if (!(_c.sent())) {
                            console_manager_1.ConsoleManager.$.error("Registry host '".concat(npmRc.host, ":").concat(npmRc.port, "' is not online"));
                            return [2 /*return*/];
                        }
                        // Use npm with custom .npmrc, should be forwarded to npm
                        // eg: `z-cli registry use npm install` to `npm --userconfig .z/verdaccio/.npmrc install
                        node_child_process_1.default.execSync(__spreadArray([
                            "npm --userconfig ".concat(npmRc.path, " --registry http://").concat(npmRc.host, ":").concat(npmRc.port)
                        ], args.slice(2), true).join(" "), { stdio: "inherit" });
                        return [3 /*break*/, 14];
                    case 11:
                        if (!current) {
                            console_manager_1.ConsoleManager.$.error("No registry host is available");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, net_1.zNetCheckPortOnline)(current.port, current.host)];
                    case 12:
                        // Check if current is online
                        if (_c.sent()) {
                            console_manager_1.ConsoleManager.$.error("Registry host '".concat(current.host, ":").concat(current.port, "' is online, and cannot be deleted while"));
                            return [2 /*return*/];
                        }
                        // Remove current `.npmrc`
                        node_fs_1.default.unlinkSync(paths.npmRc);
                        // Remove verdaccio folder
                        node_fs_1.default.rmdirSync(paths.verdaccio, { recursive: true });
                        return [3 /*break*/, 14];
                    case 13:
                        this.showHelp();
                        _c.label = 14;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    Registry.prototype.serverEnsureVerdaccioConfig = function () {
        var paths = this.paths;
        // Check file exists.
        if (!node_fs_1.default.existsSync(paths.verdaccioConfig)) {
            var DEFAULT_VERDACCIO_CONFIG = {
                "storage": paths.verdaccioStorage,
                "auth": {
                    "htpasswd": {
                        "file": paths.verdaccioHtpasswd,
                    }
                },
                "uplinks": {
                    "npmjs": {
                        "url": "https://registry.npmjs.org/"
                    }
                },
                "packages": {
                    // "@zenflux/*": {
                    //     "access": "$all",
                    //     "publish": "$authenticated"
                    // },
                    "@*/*": {
                        "access": "$all",
                        "publish": "$authenticated",
                        "unpublish": "$authenticated",
                        "proxy": "npmjs"
                    },
                    "**": {
                        "access": "$all",
                        "publish": "$authenticated",
                        "unpublish": "$authenticated",
                        "proxy": "npmjs"
                    }
                },
                "server": {
                    "keepAliveTimeout": 60
                },
                "security": {
                    "api": {
                        "legacy": true
                    }
                },
                "middlewares": {
                    "audit": {
                        "enabled": true
                    }
                },
                "log": {
                    "type": "stdout",
                    "format": "pretty",
                    "level": "trace"
                },
                "i18n": {
                    "web": "en-US"
                },
                "configPath": paths.verdaccioConfig,
            };
            console_manager_1.ConsoleManager.$.log("Creating config file at: '".concat(paths.verdaccioConfig, "'"));
            // Create config file
            node_fs_1.default.mkdirSync(paths.verdaccio, { recursive: true });
            node_fs_1.default.writeFileSync(paths.verdaccioConfig, (0, config_1.fromJStoYAML)(DEFAULT_VERDACCIO_CONFIG));
        }
        console_manager_1.ConsoleManager.$.log("Reading config from: '".concat(paths.verdaccioConfig, "'"));
        var verdaccioConfig = (0, config_1.parseConfigFile)(paths.verdaccioConfig);
        // What happen if the project relocated?
        if (verdaccioConfig.configPath !== paths.verdaccioConfig) {
            console_manager_1.ConsoleManager.$.log("Config path change detected, recreating...");
            // Delete config.
            node_fs_1.default.unlinkSync(paths.verdaccioConfig);
            return this.serverEnsureVerdaccioConfig();
        }
        console_manager_1.ConsoleManager.$.log("Reading workspace package.json from: '".concat(paths.workspace, "'"));
        var rootPkg = new package_1.Package(paths.workspace), companyPrefix = "".concat(rootPkg.json.name.split("/")[0], "/*");
        // Ensure that workspace packages are added to verdaccio config
        if (!verdaccioConfig.packages[companyPrefix]) {
            console_manager_1.ConsoleManager.$.log("Adding workspace: ".concat(node_util_1.default.inspect(companyPrefix), " to registry config"));
            console_manager_1.ConsoleManager.$.log("It means that all other packages except the workspace packages will be forwarded to remote: ".concat(node_util_1.default.inspect("registry.npmjs.org"), " registry"));
            // Add workspace to verdaccioConfig
            verdaccioConfig.packages[companyPrefix] = {
                "access": "$all",
                "publish": "$authenticated"
            };
            // Ensure that company prefixed are first in the list
            var packages = Object.entries(verdaccioConfig.packages), companyName_1 = rootPkg.json.name.split("/")[0], companyPackages = packages.filter(function (_a) {
                var key = _a[0];
                return key.startsWith(companyName_1);
            }), otherPackages = packages.filter(function (_a) {
                var key = _a[0];
                return !key.startsWith(companyName_1);
            });
            verdaccioConfig.packages = Object.fromEntries(__spreadArray(__spreadArray([], companyPackages, true), otherPackages, true));
            // Save config
            node_fs_1.default.writeFileSync(paths.verdaccioConfig, (0, config_1.fromJStoYAML)(verdaccioConfig));
        }
    };
    Registry.prototype.showHelp = function (name, optionsText) {
        if (name === void 0) { name = this.options.name; }
        if (optionsText === void 0) { optionsText = "commands"; }
        _super.prototype.showHelp.call(this, name, optionsText);
        console_manager_1.ConsoleManager.$.log(node_util_1.default.inspect({
            "@server": {
                description: "Starts a local npm registry server",
                usage: "".concat(name, " @server")
            },
            "@list": {
                description: "List all online npm registry servers",
                usage: "".concat(name, " @list")
            },
            "@use": {
                description: "Use npm with custom configuration, that will be forwarded to local npm server",
                arguments: {
                    "id": "Id of the npm registry server, can be obtain using: @registry @list command",
                    "command": "A npm command to execute against the registry"
                },
                examples: [
                    "".concat(name, " @use npm <id> <command>"),
                    "".concat(name, " @use npm 4a1a whoami"),
                    "".concat(name, " @use npm 4a1a install"),
                ]
            },
            "@clean": {
                description: "Delete current npm registry server and '.npmrc' token",
                examples: [
                    "".concat(name, " @delete")
                ]
            }
        }));
    };
    return Registry;
}(command_base_1.CommandBase));
exports.default = Registry;
