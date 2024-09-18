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
exports.__CommandRestful__Public__ = void 0;
var ZenCore = require("../../../src/exports");
var __CommandRestful__Public__ = /** @class */ (function (_super) {
    __extends(__CommandRestful__Public__, _super);
    function __CommandRestful__Public__() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __CommandRestful__Public__.prototype.apply = function (args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        return _super.prototype.apply.call(this, args, options);
    };
    return __CommandRestful__Public__;
}(ZenCore.commandBases.CommandRestful));
exports.__CommandRestful__Public__ = __CommandRestful__Public__;
