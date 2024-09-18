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
exports.Controllers = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Responsible for manging controllers, each controller is global singleton instance.
 */
var controller_already_registered_1 = require("@z-core/errors/controller-already-registered");
var object_base_1 = require("@z-core/bases/object-base");
var Controllers = /** @class */ (function (_super) {
    __extends(Controllers, _super);
    function Controllers() {
        var _this = _super.call(this) || this;
        _this.controllers = {};
        return _this;
    }
    Controllers.getName = function () {
        return "ZenFlux/Core/Managers/Controllers";
    };
    Controllers.prototype.get = function (name) {
        return this.controllers[name];
    };
    Controllers.prototype.getAll = function () {
        return this.controllers;
    };
    Controllers.prototype.register = function (controller) {
        if (this.controllers[controller.getName()]) {
            throw new controller_already_registered_1.ControllerAlreadyRegistered(controller);
        }
        // Register.
        this.controllers[controller.getName()] = controller;
        return controller;
    };
    return Controllers;
}(object_base_1.ObjectBase));
exports.Controllers = Controllers;
