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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerBrowserInfra = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description a logger for web browser.
 *
 * TODO:
 *  - Add dark/light switch for chrome devtools.
 *      - https://stackoverflow.com/questions/41961037/is-there-a-way-to-detect-if-chromes-devtools-are-using-dark-mode
 *      - Maybe 'zenflux-logging` should be chrome extension.
 */
var core_1 = require("@zenflux/core");
var utils_1 = require("@z-logging/utils");
// TODO: Should by dynamic/configure-able.
var MAX_MAPPING_RECURSIVE_DEPTH = 4, UNKNOWN_CALLER_NAME = "anonymous function";
// TODO: Should by dynamic/configure-able.
Error.stackTraceLimit = 50;
var LoggerBrowserInfra = /** @class */ (function (_super) {
    __extends(LoggerBrowserInfra, _super);
    function LoggerBrowserInfra(owner, args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this) || this;
        _this.outputHandler = console.log;
        _this.args = __assign({ repeatedly: false }, args);
        _this.owner = owner;
        _this.initialize();
        return _this;
    }
    LoggerBrowserInfra.getName = function () {
        return "ZenFlux/Logging/Modules/LoggerBrowserInfra";
    };
    /**
     * Reset logger globals.
     */
    LoggerBrowserInfra.reset = function () {
        LoggerBrowserInfra.mappers = [];
        LoggerBrowserInfra.mapperDepth = 0;
        LoggerBrowserInfra.colorsUsed = [];
        LoggerBrowserInfra.colorsOwners = {};
    };
    /**
     * Creates a custom mapper for a specific class type.
     *
     * The mapper is a callback function that can modify or enhance objects mapping.
     */
    LoggerBrowserInfra.createObjectMapper = function (callback) {
        LoggerBrowserInfra.mappers.push(callback);
    };
    /**
     * Gets mapped version of the object by using custom created object mapper.
     */
    LoggerBrowserInfra.useObjectMapper = function (obj, shouldHandleChildren) {
        var _this = this;
        if (shouldHandleChildren === void 0) { shouldHandleChildren = true; }
        if (!obj || Array.isArray(obj) || "object" !== typeof obj) {
            return obj;
        }
        LoggerBrowserInfra.mapperDepth++;
        // Result will lose typeof(obj), instanceOf will not work, now based on callback.
        var result = __assign({}, obj);
        // Run all mappers.
        LoggerBrowserInfra.mappers.forEach(function (mapper) {
            result = mapper(obj) || result;
        });
        // Prevent infinite recursive.
        if (LoggerBrowserInfra.mapperDepth >= MAX_MAPPING_RECURSIVE_DEPTH) {
            LoggerBrowserInfra.mapperDepth--;
            return result;
        }
        // Children handling.
        if (shouldHandleChildren && result) {
            Object.entries(result).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                result[key] = _this.useObjectMapper(value, true);
            });
        }
        LoggerBrowserInfra.mapperDepth--;
        return result;
    };
    LoggerBrowserInfra.prototype.initialize = function () {
        var ownerName = this.owner.getName();
        if (this.args.repeatedly && LoggerBrowserInfra.colorsOwners[ownerName]) {
            this.color = LoggerBrowserInfra.colorsOwners[ownerName];
        }
        else {
            this.color = this.getRandomColor();
            LoggerBrowserInfra.colorsUsed.push(this.color);
        }
        LoggerBrowserInfra.colorsOwners[ownerName] = this.color;
        this.defaultStyle = [
            "color: grey;font-size:7px",
            "display: block",
            "color: ".concat(this.color),
            "color: grey",
            "font-weight: bold",
            "color: #607D8B",
            "font-size: 16px;color: red;font-weight:800",
        ];
    };
    LoggerBrowserInfra.prototype.output = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.outputHandler.apply(this, args);
    };
    LoggerBrowserInfra.prototype.setOutputHandler = function (outputHandler) {
        this.outputHandler = outputHandler;
    };
    LoggerBrowserInfra.prototype.printFunctionNotify = function (prefix, caller, output) {
        var callerName = this.getCallerName(caller);
        this.output.apply(this, ["%c(".concat(prefix, ")-> %c%c").concat(this.owner.getName(), "%c::%c").concat(callerName, "%c() ").concat(output, "%c")].concat(this.defaultStyle));
    };
    LoggerBrowserInfra.prototype.printObjectEfficient = function (prefix, caller, params) {
        params = Object.assign({}, params);
        if (typeof params === "string") {
            this.printInLineString(prefix, caller, params);
            return;
        }
        if (Object.keys(params).length === 1) {
            var key = Object.keys(params)[0];
            var value = Object.values(params)[0];
            // TODO: Check is repeated logic, handle it.
            if ("object" === typeof value) {
                this.printInNextLineObject(prefix, caller, key, value || {});
            }
            else if ("function" === typeof value) {
                this.printInLineFunction(prefix, caller, key, value);
            }
            else {
                this.printInLineElement(prefix, caller, key, value);
            }
            return;
        }
        this.printMultiLineObject(prefix, caller, params);
    };
    LoggerBrowserInfra.prototype.printInLineElement = function (prefix, caller, key, value, notice) {
        if (notice === void 0) { notice = ""; }
        var callerName = this.getCallerName(caller), ownerName = this.owner.getName(), format = notice.length ?
            "%c(".concat(prefix, ")-> %c%c").concat(ownerName, "%c::%c").concat(callerName, "%c() ->> [").concat(notice, "] ->> ").concat(key, ": '").concat(value, "'%c") :
            "%c(".concat(prefix, ")-> %c%c").concat(ownerName, "%c::%c").concat(callerName, "%c() ->> ").concat(key, ": '").concat(value, "'%c");
        this.output.apply(this, [format].concat(this.defaultStyle));
    };
    LoggerBrowserInfra.prototype.printInLineFunction = function (prefix, caller, key, fn) {
        fn = this.getFunctionView(fn);
        this.printInLineElement(prefix, caller, key, fn);
    };
    LoggerBrowserInfra.prototype.printInLineString = function (prefix, caller, string) {
        this.printInLineElement(prefix, caller, "(string)", string);
    };
    LoggerBrowserInfra.prototype.printInNextLineObject = function (prefix, caller, key, obj) {
        var mapped = LoggerBrowserInfra.useObjectMapper(obj), callerName = this.getCallerName(caller);
        this.output.apply(this, [
            "%c(".concat(prefix, ")-> %c%c").concat(this.owner.getName(), "%c::%c").concat(callerName, "%c() ->> ").concat(key, " %c\u2193"),
        ].concat(this.defaultStyle));
        // print in next line
        this.output(mapped);
    };
    LoggerBrowserInfra.prototype.printMultiLineObject = function (prefix, caller, obj) {
        var callerName = this.getCallerName(caller);
        this.output.apply(this, [
            "%c(".concat(prefix, ")-> %c%c").concat(this.owner.getName(), "%c::%c").concat(callerName, "%c(").concat(Object.keys(obj)
                .join(", "), ") %c\u2193"),
        ].concat(this.defaultStyle));
        for (var key in obj) {
            var value = obj[key];
            if (typeof value === "object") {
                var mapped = LoggerBrowserInfra.useObjectMapper(value);
                value = JSON.stringify(mapped, (0, utils_1.reduceCircularReferences)());
            }
            else if (typeof obj[key] == "function") {
                value = this.getFunctionView(value);
            }
            this.output.apply(this, [
                "%c" + key + ": `" + value + "`",
                "color: #a3a3a3",
            ]);
        }
    };
    LoggerBrowserInfra.prototype.getRandomColor = function () {
        var hex = "0123456789ABCDEF";
        var color = "#";
        for (var i = 0; i < 6; i++) {
            color += hex[Math.floor(Math.random() * 16)];
        }
        var similar = LoggerBrowserInfra.colorsUsed.some(function (value) {
            // it returns the ratio of difference... closer to 1.0 is less difference.
            return (0, utils_1.getHexColorDelta)(color, value) >= 0.8;
        });
        // if the color is similar, try again.
        if (similar) {
            return this.getRandomColor();
        }
        return color;
    };
    LoggerBrowserInfra.prototype.getCallerName = function (caller) {
        if ("function" === typeof caller) {
            return caller.prototype instanceof core_1.bases.ObjectBase ? "constructor" : caller.name;
        }
        throw new Error("Invalid caller");
    };
    LoggerBrowserInfra.prototype.getFunctionView = function (fn) {
        var fReturn = UNKNOWN_CALLER_NAME;
        // TODO: Check if needed.
        if (typeof fn !== "string" && fn.name.length !== 0) {
            fReturn = fn.name.split(" ")[1] + "()";
        }
        return fReturn;
    };
    LoggerBrowserInfra.mappers = [];
    LoggerBrowserInfra.mapperDepth = 0;
    LoggerBrowserInfra.colorsOwners = {};
    LoggerBrowserInfra.colorsUsed = [];
    return LoggerBrowserInfra;
}(core_1.bases.ObjectBase));
exports.LoggerBrowserInfra = LoggerBrowserInfra;
