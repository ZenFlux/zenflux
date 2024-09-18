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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var logger_browser_infra_1 = require("@z-logging/modules/logger-browser-infra");
var utils_1 = require("@z-logging/utils");
var Logger = /** @class */ (function (_super) {
    __extends(Logger, _super);
    function Logger() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Logger.getName = function () {
        return "ZenFlux/Logging/Modules/Logger";
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Logger.prototype.log = function (caller, message) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        this.printFunctionNotify("lg", caller, message);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Logger.prototype.warn = function (caller, message) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Logger.prototype.error = function (caller, message) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Logger.prototype.info = function (caller, message) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Logger.prototype.debug = function (caller, message) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        this.printFunctionNotify("db", caller, message);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Logger.prototype.startsEmpty = function (caller) {
        this.printFunctionNotify("▶", caller, "");
    };
    Logger.prototype.startsWith = function (caller, params) {
        this.printObjectEfficient("▶", caller, params);
    };
    Logger.prototype.dump = function (caller, params, notice) {
        if (params === void 0) { params = {}; }
        if (notice === void 0) { notice = ""; }
        for (var key in params) {
            if (typeof params[key] === "object") {
                params[key] = JSON.stringify(logger_browser_infra_1.LoggerBrowserInfra.useObjectMapper(params[key]), (0, utils_1.reduceCircularReferences)());
            }
            this.printInLineElement("dp", caller, key, params[key], notice);
        }
    };
    Logger.prototype.drop = function (caller, according, data) {
        for (var key in according) {
            this.printInLineElement("dr", caller, key, according[key], "corresponding");
        }
        this.output(data);
    };
    /**
     * TODO: Should respect debug levels, when to throw...
     */
    Logger.prototype.throw = function (caller, output, name, params) {
        if (name === void 0) { name = "null"; }
        if (params === void 0) { params = {}; }
        this.printFunctionNotify("tw", caller, output);
        if (params) {
            this.printInNextLineObject("tw", caller, name, params);
        }
        throw new Error().stack;
    };
    Logger.prototype.clone = function () {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    };
    return Logger;
}(logger_browser_infra_1.LoggerBrowserInfra));
exports.Logger = Logger;
exports.default = Logger;
