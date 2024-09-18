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
exports.ForceMethodImplementation = exports.ForceMethodBase = void 0;
/**
 * @internal
 */
var ForceMethodBase = /** @class */ (function (_super) {
    __extends(ForceMethodBase, _super);
    function ForceMethodBase(className, methodName) {
        return _super.call(this, "ForceMethod implementation: at: '".concat(className, "' method: '").concat(methodName, "'")) || this;
    }
    return ForceMethodBase;
}(Error));
exports.ForceMethodBase = ForceMethodBase;
/**
 * @public
 */
var ForceMethodImplementation = /** @class */ (function (_super) {
    __extends(ForceMethodImplementation, _super);
    function ForceMethodImplementation(context, methodName) {
        return _super.call(this, "ForceMethod implementation: at: '".concat("string" === typeof context ? context : context.getName(), "' method: '").concat(methodName, "'")) || this;
    }
    return ForceMethodImplementation;
}(Error));
exports.ForceMethodImplementation = ForceMethodImplementation;
