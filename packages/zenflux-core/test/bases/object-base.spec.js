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
var object_base__public_1 = require("../__mock__/bases/object-base--public");
describe("bases", function () {
    describe("ObjectBase", function () {
        test("getName()", function () {
            // Arrange.
            var core = /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                class_1.prototype.getName = function () {
                    return "ZenCore/Test/GetName";
                };
                return class_1;
            }(object_base__public_1.__ObjectBase__Public__));
            // Act.
            var name = new core().getName();
            // Assert.
            expect(name).toBe("ZenCore/Test/GetName");
        });
        test("getName():: should throw error when no 'getName' is defined", function () {
            expect(function () {
                new /** @class */ (function (_super) {
                    __extends(core, _super);
                    function core() {
                        return _super !== null && _super.apply(this, arguments) || this;
                    }
                    return core;
                }(object_base__public_1.__ObjectBase__Public__))();
            }).toThrow("ForceMethod implementation: at: 'ObjectBase' method: 'getName'");
        });
        test("getUniqueId()", function () {
            // TODO
        });
        test("getHierarchyNames()", function () {
            // TODO
        });
    });
});
