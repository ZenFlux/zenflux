"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBase = void 0;
var events_1 = require("events");
/**
 * Each created command is registered within the commands manager, and the instance created only once per command.
 */
var CommandBase = /** @class */ (function () {
    function CommandBase(args) {
        var _newTarget = this.constructor;
        this.args = args;
        this.options = {};
        this.commandName = _newTarget.getName();
    }
    CommandBase.getName = function () {
        throw new Error("You have should implement `static getName()` method, since the commands run by name ;)");
    };
    CommandBase.globalHook = function (callback) {
        this.globalEmitter.on(this.getName(), callback);
    };
    CommandBase.globalUnhook = function () {
        var _this = this;
        this.globalEmitter.listeners(this.getName()).forEach(function (listener) {
            _this.globalEmitter.off(_this.getName(), listener);
        });
    };
    CommandBase.prototype.global = function () {
        var global = this.constructor;
        return global;
    };
    CommandBase.prototype.execute = function (emitter, args, options) {
        var _a, _b;
        if (options) {
            this.options = options;
        }
        (_a = this.validateArgs) === null || _a === void 0 ? void 0 : _a.call(this, args, options);
        var result = (_b = this.apply) === null || _b === void 0 ? void 0 : _b.call(this, args);
        emitter.emit(this.commandName, result, args);
        this.global().globalEmitter.emit(this.commandName, result, args);
        this.options = {};
        return result;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    CommandBase.prototype.validateArgs = function (args, options) {
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    CommandBase.prototype.apply = function (args) {
    };
    Object.defineProperty(CommandBase.prototype, "state", {
        get: function () {
            this.validateState();
            return this.options.state;
        },
        enumerable: false,
        configurable: true
    });
    CommandBase.prototype.setState = function (state, callback) {
        var _this = this;
        this.validateState();
        return new Promise(function (resolve) {
            _this.options.setState(state, function (currentState) {
                callback === null || callback === void 0 ? void 0 : callback(currentState);
                resolve(currentState);
            });
        });
    };
    CommandBase.prototype.validateState = function () {
        if ("undefined" === typeof this.options.state || "function" !== typeof this.options.setState) {
            throw new Error("There is no state for the current command, you should use `withCommands( component, class, state, commands )` including the state to enable it");
        }
    };
    CommandBase.globalEmitter = new events_1.EventEmitter();
    return CommandBase;
}());
exports.CommandBase = CommandBase;
