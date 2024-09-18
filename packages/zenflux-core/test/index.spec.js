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
/**
 * Validate that the `ZenCore` get cleared on each test.
 * In other words - ensuring that `setup.ts` is working correctly.
 */
var ZenCore = require("../src/exports");
describe("ZenCore", function () {
    it("Add something for next test", function () {
        // Arrange
        ZenCore.managers.controllers.register(new /** @class */ (function (_super) {
            __extends(MyController, _super);
            function MyController() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            MyController.getName = function () {
                return "Test/Controller";
            };
            MyController.prototype.getCommands = function () {
                return {
                    "test": /** @class */ (function (_super) {
                        __extends(class_1, _super);
                        function class_1() {
                            return _super !== null && _super.apply(this, arguments) || this;
                        }
                        return class_1;
                    }(ZenCore.commandBases.CommandPublic))
                };
            };
            return MyController;
        }(ZenCore.bases.ControllerBase)));
        // Validate controller is registered.
        expect(ZenCore.managers.controllers.get("Test/Controller")).toBeDefined();
    });
    it("validate commands being refreshed each test", function () {
        // The prev test `add something` which is the assertion.
        // Assert - Commands is empty.
        expect(ZenCore.managers.commands.getAll()).toEqual({});
    });
});
