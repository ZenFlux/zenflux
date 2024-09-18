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
exports.Internal = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Responsible for manging internal commands, To serve commands that are not triggered by user.
 */
var commands_1 = require("@z-core/managers/commands");
var Internal = /** @class */ (function (_super) {
    __extends(Internal, _super);
    function Internal() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Internal.getName = function () {
        return "ZenFlux/Core/Managers/Internal";
    };
    return Internal;
}(commands_1.Commands));
exports.Internal = Internal;
