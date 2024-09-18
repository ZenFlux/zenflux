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
exports.ControllerBase = void 0;
/**
 * The `ControllerBase` class is an abstract base class responsible for managing commands and providing a structure
 * for controllers or command spaces.
 *
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
var object_base_1 = require("@z-core/bases/object-base");
var managers = require("@z-core/managers/export");
// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
var ControllerBase = /** @class */ (function (_super) {
    __extends(ControllerBase, _super);
    /**
     * Constructor for `ControllerBase` instances.
     * Initializes the base class and invokes the `initialize()` method.
     */
    function ControllerBase() {
        var _this = _super.call(this) || this;
        // Initialize the controller
        _this.initialize();
        return _this;
    }
    ControllerBase.getName = function () {
        return "ZenFlux/Core/ControllerBase";
    };
    /**
     * Initializes the controller by calling the `register()` method and optionally the `setupHooks()` method.
     */
    ControllerBase.prototype.initialize = function () {
        // Register commands and command types
        this.register();
        // Optionally, set up hooks if the `setupHooks()` method is defined in derived classes
        this.setupHooks && this.setupHooks();
    };
    /**
     * Registers commands and command types by calling manager functions.
     */
    ControllerBase.prototype.register = function () {
        // Register public commands
        this.commands = managers.commands.register(this.getCommands(), this);
        // Register RESTful commands
        this.restful = managers.restful.register(this.getRestful(), this);
        // Register internal commands
        this.internal = managers.internal.register(this.getInternal(), this);
    };
    /**
     * Retrieve the public commands associated with this controller.
     * Derived classes can override this method to specify their own commands.
     */
    ControllerBase.prototype.getCommands = function () {
        return {};
    };
    /**
     * Retrieve the RESTful commands associated with this controller.
     * Derived classes can override this method to specify their own RESTful commands.
     */
    ControllerBase.prototype.getRestful = function () {
        return {};
    };
    /**
     * Retrieve the internal commands associated with this controller.
     * Derived classes can override this method to specify their own internal commands.
     */
    ControllerBase.prototype.getInternal = function () {
        return {};
    };
    /**
     * A hook method that can be optionally overridden in derived classes to set up hooks or event listeners.
     */
    ControllerBase.prototype.setupHooks = function () { };
    return ControllerBase;
}(object_base_1.ObjectBase));
exports.ControllerBase = ControllerBase;
