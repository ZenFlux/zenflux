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
exports.Console = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_console_1 = require("node:console");
var node_inspector_1 = require("node:inspector");
var process_1 = require("process");
var DEFAULT_LOG_FLAGS = {
    log: 1,
    error: 2,
    warn: 4,
    info: 8,
    verbose: 16,
    debug: 32,
    inspectorDebug: 64,
};
// Currently default log flag are all except verbose and debug
var logFlags = DEFAULT_LOG_FLAGS.log |
    DEFAULT_LOG_FLAGS.error |
    DEFAULT_LOG_FLAGS.warn |
    DEFAULT_LOG_FLAGS.info;
if (process_1.default.argv.includes("--verbose")) {
    logFlags |= DEFAULT_LOG_FLAGS.verbose;
}
if (process_1.default.argv.includes("--debug")) {
    logFlags |= DEFAULT_LOG_FLAGS.debug;
}
if (node_inspector_1.default.url()) {
    logFlags |= DEFAULT_LOG_FLAGS.inspectorDebug;
}
var Console = /** @class */ (function (_super) {
    __extends(Console, _super);
    function Console(options) {
        var _this = _super.call(this, options) || this;
        setTimeout(_this.initialize.bind(_this));
        return _this;
    }
    Console.isFlagEnabled = function (flag) {
        return (logFlags & DEFAULT_LOG_FLAGS[flag]) !== 0;
    };
    Console.prototype.initialize = function () {
        if (!Console.isFlagEnabled("verbose")) {
            this.verbose = function () { };
        }
        // TODO: Its probably better to send debug directly to inspector instead of sending it via main-thread.
        // Enable debug only when debugger connected
        if (!Console.isFlagEnabled("debug") && !Console.isFlagEnabled("inspectorDebug")) {
            this.debug = function () { };
        }
        this.prefix = this.getPrefix();
    };
    Console.prototype.prepareFormat = function (args, method) {
        var _a;
        args = this.getArgs(method, args);
        if ((_a = this.prefix) === null || _a === void 0 ? void 0 : _a.length) {
            args.unshift(this.prefix);
        }
        if (this.getFormat) {
            args = [this.getFormat(method, args)];
        }
        return args;
    };
    Console.prototype.getPrefix = function () {
        return "";
    };
    Console.prototype.getArgs = function (method, args) {
        switch (method.name) {
            case this.verbose.name:
            case this.debug.name:
                var result = args[0]();
                args = Array.isArray(result) ? result : [result];
                break;
        }
        return args;
    };
    Console.prototype.output = function (method, args, prepareFormat) {
        var _a;
        if (prepareFormat === void 0) { prepareFormat = this.prepareFormat.bind(this); }
        args = prepareFormat(args, method);
        switch (method.name) {
            case this.verbose.name:
                _super.prototype.log.apply(this, args);
                break;
            case this.debug.name:
                if (node_inspector_1.default.url()) {
                    // @ts-ignore
                    (_a = node_inspector_1.default.console).log.apply(_a, args);
                }
                if (process_1.default.argv.includes("--debug")) {
                    _super.prototype.log.apply(this, args);
                }
                break;
            case this.log.name:
                _super.prototype.log.apply(this, args);
                break;
            case this.error.name:
                _super.prototype.error.apply(this, args);
                break;
            case this.warn.name:
                _super.prototype.warn.apply(this, args);
                break;
            case this.info.name:
                _super.prototype.info.apply(this, args);
                break;
            default:
                throw new Error("Unknown method: ".concat(method.name));
        }
    };
    // TODO: Move out
    Console.prototype.prompt = function (message) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.log(message);
            process_1.default.stdin.resume();
            process_1.default.stdin.once("data", function (data) {
                process_1.default.stdin.pause();
                resolve(data.toString().trim());
            });
        });
    };
    // TODO: Move out
    Console.prototype.confirm = function (message) {
        var _this = this;
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var answer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prompt("".concat(message, " (y/n)"))];
                    case 1:
                        answer = _a.sent();
                        resolve(answer === "y");
                        return [2 /*return*/];
                }
            });
        }); });
    };
    Console.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.output(this.log, args);
    };
    Console.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.output(this.error, args);
    };
    Console.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.output(this.warn, args);
    };
    Console.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.output(this.info, args);
    };
    Console.prototype.verbose = function (callback) {
        this.output(this.verbose, [callback]);
    };
    Console.prototype.debug = function (callback) {
        this.output(this.debug, [callback]);
    };
    return Console;
}(node_console_1.Console));
exports.Console = Console;
