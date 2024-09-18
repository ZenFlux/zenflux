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
var command_base__public_1 = require("../__mock__/bases/command-base--public");
var errors_1 = require("../../src/errors");
describe("command-bases", function () {
    describe("CommandBase", function () {
        test("initialize()", function () {
            // Arrange.
            var args = {
                test: "test",
            }, options = {
                test: "test",
            };
            var CommandClass = /** @class */ (function (_super) {
                __extends(Command, _super);
                function Command() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Command.getName = function () {
                    return "ZenCore/Commands/Command/Test";
                };
                Command.prototype.getArgs = function () {
                    return this.args;
                };
                Command.prototype.getOptions = function () {
                    return this.options;
                };
                return Command;
            }(command_base__public_1.__CommandBase__Public__));
            var instance = new CommandClass(args, options);
            // Act.
            instance.initialize(args, options);
            // Assert.
            expect(instance.getArgs()).toEqual(args);
            expect(instance.getOptions()).toEqual(options);
        });
        test("apply()", function () {
            // Arrange.
            var CommandClass = /** @class */ (function (_super) {
                __extends(Command, _super);
                function Command() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Command.getName = function () {
                    return "ZenCore/Commands/Command/Test";
                };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Command.prototype.apply = function (args, options) {
                    if (args === void 0) { args = this.args; }
                    if (options === void 0) { options = this.options; }
                    if (args.passed) {
                        this.passed = true;
                    }
                };
                return Command;
            }(ZenCore.commandBases.CommandBase));
            var instance = new CommandClass({ passed: true });
            // Act.
            instance.run();
            // Assert.
            expect(instance.passed).toBe(true);
        });
        test("setController():: Ensure controller cannot set twice", function () {
            // Arrange.
            var CommandClass = /** @class */ (function (_super) {
                __extends(Command, _super);
                function Command() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Command.getName = function () {
                    return "ZenCore/Commands/Command/Test";
                };
                return Command;
            }(ZenCore.commandBases.CommandBase));
            var TestController = /** @class */ (function (_super) {
                __extends(TestController, _super);
                function TestController() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                TestController.getName = function () {
                    return "ZenCore/Controllers/Test";
                };
                return TestController;
            }(ZenCore.bases.ControllerBase));
            CommandClass.setController(new TestController());
            // Act.
            var error = function () { return CommandClass.setController(new TestController()); };
            // Assert.
            expect(error).toThrowError(errors_1.ControllerAlreadySet);
        });
    });
});
