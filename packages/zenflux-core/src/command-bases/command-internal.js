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
exports.CommandInternal = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description CommandInternal, is used when part of the logic needed to be in the command but not represent a user action.
 */
var command_base_1 = require("@z-core/command-bases/command-base");
var CommandInternal = /** @class */ (function (_super) {
    __extends(CommandInternal, _super);
    function CommandInternal() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CommandInternal.getName = function () {
        return "ZenFlux/Core/CommandBases/CommandInternal";
    };
    return CommandInternal;
}(command_base_1.CommandBase));
exports.CommandInternal = CommandInternal;
