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
exports.ConsoleThreadReceive = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var definitions_1 = require("@zenflux/worker/definitions");
var console_thread_format_1 = require("@zenflux/cli/src/console/console-thread-format");
/**
 * The `ConsoleThreadReceive` class is an adapter like, a part of a console system that is designed to handle console output in a multithreaded environment.
 *
 * It extends the `ConsoleThreadFormat` class, which is a wrapper around the native `console` that allows for console output to be formatted in a specific way.
 *
 * It allows for console output to be handled in a way that is aware of the multithreaded environment,
 * ensuring that messages from different threads are outputted correctly.
 */
var ConsoleThreadReceive = /** @class */ (function (_super) {
    __extends(ConsoleThreadReceive, _super);
    function ConsoleThreadReceive(console, threadId) {
        var _this = _super.call(this) || this;
        _this.console = console;
        _this.threadId = threadId;
        return _this;
    }
    ConsoleThreadReceive.connect = function (worker, console) {
        var newConsole = new ConsoleThreadReceive(console, worker.getId());
        definitions_1.DEFAULT_WORKER_EVENTS.forEach(function (event) {
            worker.on(event, function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                (_a = newConsole[event]).call.apply(_a, __spreadArray([newConsole], args, false));
            });
        });
        return newConsole;
    };
    ConsoleThreadReceive.prototype.getName = function () {
        return this.console.getName();
    };
    ConsoleThreadReceive.prototype.getThreadId = function () {
        return this.threadId;
    };
    ConsoleThreadReceive.prototype.getThreadCode = function () {
        return this.console.getThreadCode();
    };
    ConsoleThreadReceive.prototype.getPrefix = function () {
        // Behave same as `this.console` but with different threadId.
        return this.console.getPrefix.call(this);
    };
    ConsoleThreadReceive.prototype.output = function (method, args) {
        // Behave same as `this.console` but with different threadId.
        this.console.output(method, args, this.prepareFormat.bind(this));
    };
    ConsoleThreadReceive.prototype.prepareFormat = function (args, method) {
        args = this.console.getArgs(method, args);
        if (this.prefix.length) {
            args.unshift(this.prefix);
        }
        if (this.console.getFormat) {
            args = [this.console.getFormat(method, args)];
        }
        return args;
    };
    return ConsoleThreadReceive;
}(console_thread_format_1.ConsoleThreadFormat));
exports.ConsoleThreadReceive = ConsoleThreadReceive;
