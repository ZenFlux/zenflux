"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managers = exports.interfaces = exports.errors = exports.commandBases = exports.bases = exports.config = exports.onAfterInitialize = exports.destroy = exports.initialize = exports.classes = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
// @ts-ignore - TODO handle error in jest
var pkg = require("../package.json");
var exports_index_1 = require("@z-core/exports-index");
Object.defineProperty(exports, "bases", { enumerable: true, get: function () { return exports_index_1.bases; } });
Object.defineProperty(exports, "commandBases", { enumerable: true, get: function () { return exports_index_1.commandBases; } });
Object.defineProperty(exports, "errors", { enumerable: true, get: function () { return exports_index_1.errors; } });
Object.defineProperty(exports, "interfaces", { enumerable: true, get: function () { return exports_index_1.interfaces; } });
Object.defineProperty(exports, "managers", { enumerable: true, get: function () { return exports_index_1.managers; } });
exports.classes = {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    /* eslint-disable @typescript-eslint/explicit-member-accessibility */
    Logger: /** @class */ (function () {
        function NullLogger(owner, params) {
            if (params === void 0) { params = {}; }
        }
        NullLogger.prototype.log = function (caller, message) {
            var params = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                params[_i - 2] = arguments[_i];
            }
        };
        NullLogger.prototype.warn = function (caller, message) {
            var params = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                params[_i - 2] = arguments[_i];
            }
        };
        NullLogger.prototype.error = function (caller, message) {
            var params = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                params[_i - 2] = arguments[_i];
            }
        };
        NullLogger.prototype.info = function (caller, message) {
            var params = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                params[_i - 2] = arguments[_i];
            }
        };
        NullLogger.prototype.debug = function (caller, message) {
            var params = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                params[_i - 2] = arguments[_i];
            }
        };
        NullLogger.prototype.startsEmpty = function (caller) { };
        NullLogger.prototype.startsWith = function (caller, params) { };
        NullLogger.prototype.dump = function (caller, data) { };
        NullLogger.prototype.drop = function (caller, according, data) { };
        return NullLogger;
    }())
    /* eslint-enable */
};
var exportedConfig = {
    version: pkg.version,
};
function initialize(config) {
    if ("undefined" !== typeof __ZEN_CORE__IS_INITIALIZED__ && __ZEN_CORE__IS_INITIALIZED__) {
        throw new Error("ZenCore is already initialized.");
    }
    exportedConfig = (config || exportedConfig);
    exports_index_1.managers.initialize(exportedConfig);
    globalThis.__ZEN_CORE__IS_INITIALIZED__ = true;
}
exports.initialize = initialize;
function destroy() {
    exports_index_1.managers.destroy();
    globalThis.__ZEN_CORE__IS_INITIALIZED__ = false;
}
exports.destroy = destroy;
function onAfterInitialize(callback) {
    exports_index_1.managers.afterInitializeCallbacks.push(callback);
}
exports.onAfterInitialize = onAfterInitialize;
exports.config = exportedConfig;
