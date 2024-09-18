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
exports.ConsoleThreadFormat = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_process_1 = require("node:process");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var stdout = node_process_1.default.stdout, stderr = node_process_1.default.stderr;
/**
 * `ConsoleThreadFormat` is an abstract class that provides a structure for formatting console threads.
 * It also provides the ability to switch formatting based on logging level.
 */
var ConsoleThreadFormat = /** @class */ (function (_super) {
    __extends(ConsoleThreadFormat, _super);
    /**
     * The constructor checks if the getFormatExtended method is defined and if either the verbose or debug flags are enabled.
     * If these conditions are met, it replaces the getFormat method with the getFormatExtended method.
     */
    function ConsoleThreadFormat() {
        var _this = _super.call(this, {
            stdout: stdout,
            stderr: stderr
        }) || this;
        if (_this.getFormatExtended && (console_manager_1.ConsoleManager.isFlagEnabled("verbose") || console_manager_1.ConsoleManager.isFlagEnabled("debug"))) {
            _this.getFormat = _this.getFormatExtended;
        }
        return _this;
    }
    return ConsoleThreadFormat;
}(console_manager_1.ConsoleManager.module()));
exports.ConsoleThreadFormat = ConsoleThreadFormat;
