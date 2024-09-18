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
exports.Commands = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Responsible for manging/running/hooking commands.
 */
var object_base_1 = require("@z-core/bases/object-base");
var command_not_found_1 = require("@z-core/errors/command-not-found");
var command_already_registered_1 = require("@z-core/errors/command-already-registered");
var Commands = /** @class */ (function (_super) {
    __extends(Commands, _super);
    function Commands() {
        var _this = _super.call(this) || this;
        _this.current = {};
        _this.currentArgs = {};
        _this.trace = [];
        _this.commands = {};
        _this.onBeforeHooks = {};
        _this.onBeforeUIHooks = {};
        _this.onAfterHooks = {};
        _this.onAfterOnceHooks = {};
        _this.onAfterUIHooks = {};
        _this.onAfterAffectHooks = {};
        var type = _this.constructor;
        _this.logger = new zCore.classes.Logger(type);
        _this.logger.startsEmpty(_this.constructor);
        return _this;
    }
    Commands.getName = function () {
        return "ZenFlux/Core/Managers/Commands";
    };
    Commands.runCallbacks = function (callbacks, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var callbacksLength, i, callback;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        callbacksLength = (callbacks === null || callbacks === void 0 ? void 0 : callbacks.length) || 0;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < callbacksLength)) return [3 /*break*/, 4];
                        callback = options.pop === true ? callbacks.pop() : callbacks[i];
                        if (!callback) {
                            throw new Error("Callback is not defined.");
                        }
                        return [4 /*yield*/, callback(args, options)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        ++i;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Commands.hookCommand = function (stack, hookCommand, context) {
        if (!stack[hookCommand]) {
            stack[hookCommand] = [];
        }
        stack[hookCommand].push(context);
    };
    Commands.prototype.run = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof command === "string") {
                            command = this.getCommandInstance(command, args, options);
                        }
                        this.attachCurrent(command, args);
                        return [4 /*yield*/, this.runInstance(command, args, options)];
                    case 1:
                        result = _a.sent();
                        this.detachCurrent(command);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Commands.prototype.register = function (commands, controller) {
        var _this = this;
        var result = {};
        Object.values(commands).forEach(function (command) {
            var commandName = command.getName();
            if (_this.commands[commandName]) {
                throw new command_already_registered_1.CommandAlreadyRegistered(command);
            }
            command.setController(controller);
            _this.commands[commandName] = command;
            result[commandName] = command;
        });
        return result;
    };
    Commands.prototype.getAll = function () {
        return this.commands;
    };
    Commands.prototype.getByName = function (name) {
        return this.commands[name];
    };
    Commands.prototype.getLogger = function () {
        return this.logger;
    };
    Commands.prototype.getCommandInstance = function (name, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        var CommandClass = this.commands[name];
        if (!CommandClass) {
            throw new command_not_found_1.CommandNotFound(name);
        }
        // @ts-ignore
        return new CommandClass(args, options);
    };
    /**
     * Used to set hooks that effects only data and not UI.
     */
    Commands.prototype.onBefore = function (hookCommand, callback) {
        Commands.hookCommand(this.onBeforeHooks, hookCommand, callback);
    };
    /**
     * Used to set hooks that effects only UI.
     */
    Commands.prototype.onBeforeUI = function (hookCommand, callback) {
        Commands.hookCommand(this.onBeforeUIHooks, hookCommand, callback);
    };
    /**
     * Used to set hooks that effects only data and not UI.
     */
    Commands.prototype.onAfter = function (hookCommand, callback) {
        Commands.hookCommand(this.onAfterHooks, hookCommand, callback);
    };
    /**
     * Used to set hooks that effects only UI.
     */
    Commands.prototype.onAfterUI = function (command, callback) {
        Commands.hookCommand(this.onAfterUIHooks, command, callback);
    };
    /**
     * Used to set hooks that effects only data and not UI.
     */
    Commands.prototype.onAfterOnce = function (command, callback) {
        Commands.hookCommand(this.onAfterOnceHooks, command, callback);
    };
    /**
     * Used to register a trigger that runs command after `hookCommand` run's.
     */
    Commands.prototype.onAfterAffect = function (hookCommand, affectCommand) {
        Commands.hookCommand(this.onAfterAffectHooks, hookCommand, affectCommand);
    };
    Commands.prototype.onBeforeRun = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        if (this.onBeforeHooks[command.getName()]) {
            var callbacks = this.onBeforeHooks[command.getName()];
            callbacks.forEach(function (callback) { return callback(args, options); });
        }
        if (this.onBeforeUIHooks[command.getName()]) {
            var callbacks = this.onBeforeUIHooks[command.getName()];
            callbacks.forEach(function (callback) { return callback(args, options); });
        }
    };
    Commands.prototype.runInstance = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = null;
                        this.logger.startsWith(this.runInstance, {
                            command: command.getName(),
                            options: options,
                            args: args,
                        });
                        this.onBeforeRun(command, args, options);
                        return [4 /*yield*/, command.run()];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.onAfterRun(command, args, options, result)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Commands.prototype.onAfterRun = function (command, args, options, result) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = Object.assign({}, options);
                        if (!this.onAfterAffectHooks[command.getName()]) return [3 /*break*/, 2];
                        this.onAfterAffectHooks[command.getName()].forEach(function (command) {
                            args.result = result;
                            result = _this.run(command.toString(), args, options);
                        });
                        return [4 /*yield*/, result];
                    case 1:
                        result = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!this.onAfterHooks) return [3 /*break*/, 4];
                        args.result = result;
                        return [4 /*yield*/, Commands.runCallbacks(Object.assign([], this.onAfterHooks[command.getName()]), args, options)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!this.onAfterOnceHooks) return [3 /*break*/, 6];
                        return [4 /*yield*/, Commands.runCallbacks(this.onAfterOnceHooks[command.getName()], args, __assign(__assign({}, options), { pop: true }))];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (this.onAfterUIHooks) {
                            Commands.runCallbacks(Object.assign([], this.onAfterUIHooks[command.getName()]), args, options);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Commands.prototype.attachCurrent = function (command, args) {
        if (args === void 0) { args = {}; }
        this.current[command.getName()] = command;
        this.currentArgs[command.getName()] = args;
        this.trace.push(command.getName());
        Commands.trace.push(command.getName());
    };
    Commands.prototype.detachCurrent = function (command) {
        delete this.current[command.getName()];
        delete this.currentArgs[command.getName()];
        Commands.trace.pop();
        this.trace.pop();
    };
    Commands.trace = [];
    return Commands;
}(object_base_1.ObjectBase));
exports.Commands = Commands;
