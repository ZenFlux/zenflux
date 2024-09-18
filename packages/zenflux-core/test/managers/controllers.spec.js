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
var ZenCore = require("../../src/exports");
describe("managers", function () {
    describe("Controllers", function () {
        test("get() & register()", function () {
            // Arrange.
            var controller = ZenCore.managers.controllers.register(new /** @class */ (function (_super) {
                __extends(MyController, _super);
                function MyController() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                MyController.getName = function () {
                    return "Test/Controller";
                };
                return MyController;
            }(ZenCore.bases.ControllerBase)));
            // Act - Get controller.
            var result = ZenCore.managers.controllers.get(controller.getName());
            // Assert.
            expect(result.getName()).toBe(controller.getName());
        });
    });
});
