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
exports.zConfigLoad = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var fs_1 = require("fs");
var node_util_1 = require("node:util");
var zenflux_1 = require("@zenflux/cli/src/definitions/zenflux");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var config_1 = require("@zenflux/cli/src/definitions/config");
function hasRequiredKeys(config) {
    return config_1.Z_CONFIG_REQUIRED_KEYS.every(function (key) {
        return config.hasOwnProperty(key);
    });
}
function configValidate(config) {
    if (config.inputDtsPath && !config.outputDtsPath) {
        throw new Error("'".concat(config.path, "' inputDtsPath is defined but outputDtsPath is not"));
    }
    // Validate format not using something else then TZFormatType.
    config.format.forEach(function (i) {
        if (!zenflux_1.DEFAULT_Z_FORMATS.includes(i)) {
            throw new Error("'".concat(config.path, "' format is invalid: '").concat(i, "'"));
        }
    });
}
function configEnsureInternals(config, args) {
    Object.assign(config, args.$defaults || {}, {
        type: args.type,
        path: args.path,
        outputName: args.name,
    });
}
function zConfigLoad(path, silent) {
    if (silent === void 0) { silent = false; }
    return __awaiter(this, void 0, void 0, function () {
        var message_1, config, configType, configs, $defaults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check if target config exists.
                    console_manager_1.ConsoleManager.$.verbose(function () { return ["config", zConfigLoad.name, "Checking if exists: ".concat(node_util_1.default.inspect(path))]; });
                    if (!fs_1.default.existsSync(path)) {
                        message_1 = "File not found: '".concat(path, "'");
                        if (!silent) {
                            throw new Error(message_1);
                        }
                        console_manager_1.ConsoleManager.$.verbose(function () { return ["config", zConfigLoad.name, message_1]; });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.resolve("".concat(path)).then(function (s) { return require(s); })];
                case 1:
                    config = (_a.sent()).default;
                    if (!Object.keys(config).length) {
                        throw new Error("'".concat(path, "' empty or not loaded"));
                    }
                    configType = "unknown";
                    // Determine which config type is it.
                    // - If first level has all `Z_CONFIG_REQUIRED_KEYS` then it's a single config object.
                    if (hasRequiredKeys(config)) {
                        configType = "single";
                    }
                    // - If one of the second level has all `Z_CONFIG_REQUIRED_KEYS` then it's a multi config object.
                    else if (Object.values(config).some(function (i) { return hasRequiredKeys(i); })) {
                        configType = "multi";
                    }
                    else {
                        throw new Error("Invalid config: 'file://".concat(path, "' unable to determine the config type, the required keys are missing\n") +
                            "Ensure you have them both per config: " + config_1.Z_CONFIG_REQUIRED_KEYS.join(", "));
                    }
                    configs = [];
                    if (configType === "single") {
                        configEnsureInternals(config, {
                            path: path,
                            type: configType,
                            name: config.outputName,
                            $defaults: $defaults,
                        });
                        configValidate(config);
                        configs.push(config);
                    }
                    else {
                        Object.entries(config).forEach(function (_a) {
                            var key = _a[0], i = _a[1];
                            if (i && !hasRequiredKeys(i)) {
                                if ("$defaults" === key) {
                                    $defaults = i;
                                }
                                else {
                                    throw new Error("Invalid config: 'file://".concat(path, "' the required keys are missing:\n") +
                                        Object.keys(config_1.Z_CONFIG_REQUIRED_KEYS).join(", "));
                                }
                                return;
                            }
                            configEnsureInternals(i, {
                                path: path,
                                type: configType,
                                name: key,
                                $defaults: $defaults,
                            });
                            configValidate(i);
                            configs.push(i);
                        });
                    }
                    return [2 /*return*/, configs];
            }
        });
    });
}
exports.zConfigLoad = zConfigLoad;
