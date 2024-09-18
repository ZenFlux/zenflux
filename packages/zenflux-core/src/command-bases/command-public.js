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
exports.CommandPublic = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description CommandPublic represents a USER action, every class which inherit from this class will USER action.
 * */
var command_base_1 = require("@z-core/command-bases/command-base");
var CommandPublic = /** @class */ (function (_super) {
    __extends(CommandPublic, _super);
    function CommandPublic() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CommandPublic.getName = function () {
        return "ZenFlux/Core/CommandBases/CommandPublic";
    };
    return CommandPublic;
}(command_base_1.CommandBase));
exports.CommandPublic = CommandPublic;
