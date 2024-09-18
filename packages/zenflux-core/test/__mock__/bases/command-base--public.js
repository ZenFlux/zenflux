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
exports.__CommandBase__Public__ = void 0;
var command_base_1 = require("../../../src/command-bases/command-base");
var __CommandBase__Public__ = /** @class */ (function (_super) {
    __extends(__CommandBase__Public__, _super);
    function __CommandBase__Public__() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __CommandBase__Public__.prototype.initialize = function (args, options) {
        _super.prototype.initialize.call(this, args, options);
    };
    __CommandBase__Public__.prototype.getArgs = function () {
        return this.args;
    };
    __CommandBase__Public__.prototype.getOptions = function () {
        return this.options;
    };
    return __CommandBase__Public__;
}(command_base_1.CommandBase));
exports.__CommandBase__Public__ = __CommandBase__Public__;
