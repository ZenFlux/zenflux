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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_util_1 = require("node:util");
var node_process_1 = require("node:process");
var command_build_base_1 = require("@zenflux/cli/src/base/command-build-base");
var build_1 = require("@zenflux/cli/src/core/build");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var Build = /** @class */ (function (_super) {
    __extends(Build, _super);
    function Build() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Build.prototype.runImpl = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, configs, promises, _loop_1, this_1, _i, configs_1, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now(), configs = this.getConfigs();
                        if (!configs.length) {
                            console_manager_1.ConsoleManager.$.log("Build", "config", "no available configs found");
                            return [2 /*return*/];
                        }
                        promises = [];
                        _loop_1 = function (config) {
                            var rollupConfig = this_1.getRollupConfig(config);
                            var options = { config: config };
                            var promise = void 0;
                            promise = (0, build_1.zRollupCreateBuildWorker)(rollupConfig, __assign(__assign({}, options), { threadId: configs.indexOf(config), otherConfigs: configs.filter(function (c) { return c !== config; }) }), this_1.getRollupConsole());
                            promise.then(function () { var _a; return (_a = config.onBuilt) === null || _a === void 0 ? void 0 : _a.call(config); });
                            promises.push(promise);
                        };
                        this_1 = this;
                        for (_i = 0, configs_1 = configs; _i < configs_1.length; _i++) {
                            config = configs_1[_i];
                            _loop_1(config);
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        console_manager_1.ConsoleManager.$.log("Build", "done", "in (".concat(Date.now() - startTime, "ms)"));
                        this.onBuiltAll().finally(function () {
                            // TODO: Create worker manager to terminate workers.
                            node_process_1.default.exit(0);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Build.prototype.showHelp = function (name) {
        _super.prototype.showHelp.call(this, name);
        console_manager_1.ConsoleManager.$.log(node_util_1.default.inspect({
            "--haltOnDiagnosticError": {
                description: "Halt on typescript diagnostic error",
                behaviors: "Kill the process if typescript diagnostic error occurred"
            }
        }));
    };
    return Build;
}(command_build_base_1.CommandBuildBase));
exports.default = Build;