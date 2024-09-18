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
exports.ConsoleManager = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var process_1 = require("process");
var console_1 = require("@zenflux/cli/src/modules/console/console");
var package_json_1 = require("@zenflux/cli/package.json");
var ConsoleManager = /** @class */ (function (_super) {
    __extends(ConsoleManager, _super);
    function ConsoleManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ConsoleManager.getInstance = function () {
        if (!ConsoleManager.instance) {
            ConsoleManager.instance = new ConsoleManager({
                stdout: process_1.default.stdout,
                stderr: process_1.default.stderr,
            });
        }
        return ConsoleManager.instance;
    };
    ConsoleManager.setInstance = function (instance) {
        ConsoleManager.instance = instance;
    };
    Object.defineProperty(ConsoleManager, "$", {
        get: function () {
            return ConsoleManager.getInstance();
        },
        enumerable: false,
        configurable: true
    });
    ConsoleManager.module = function () {
        return console_1.Console;
    };
    ConsoleManager.prototype.getPrefix = function () {
        return "[".concat(package_json_1.default.name, "@").concat(package_json_1.default.version, "]:");
    };
    return ConsoleManager;
}(console_1.Console));
exports.ConsoleManager = ConsoleManager;
