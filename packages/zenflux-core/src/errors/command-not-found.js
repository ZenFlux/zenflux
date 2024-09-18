"use strict";
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
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
exports.CommandNotFound = void 0;
/**
 * @internal
 */
var CommandNotFound = /** @class */ (function (_super) {
    __extends(CommandNotFound, _super);
    function CommandNotFound(command) {
        return _super.call(this, "Command: '".concat(command, "' is not found")) || this;
    }
    return CommandNotFound;
}(Error));
exports.CommandNotFound = CommandNotFound;
