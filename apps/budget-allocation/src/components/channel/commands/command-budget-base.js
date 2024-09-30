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
exports.CommandBudgetBase = void 0;
var command_base_1 = require("@zenflux/react-commander/command-base");
var CommandBudgetBase = /** @class */ (function (_super) {
    __extends(CommandBudgetBase, _super);
    function CommandBudgetBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CommandBudgetBase.prototype.validateArgs = function (args) {
        var source = args.source, value = args.value;
        if (!source) {
            throw new Error("`args.source` is required or invalid");
        }
        if (typeof value !== "string") {
            throw new Error("`args.value` has to be string");
        }
    };
    return CommandBudgetBase;
}(command_base_1.CommandBase));
exports.CommandBudgetBase = CommandBudgetBase;
