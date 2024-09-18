"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectBase = void 0;
/**
 * The `ObjectBase` class is a foundational class serves as the base for other classes in the system.
 * It is responsible for managing the name and unique identifier of derived classes.
 * This class provides the basic structure for classes that need to have a unique identifier
 * and a common way to retrieve their names.
 *
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
var force_method_implementation_1 = require("@z-core/errors/force-method-implementation");
var ObjectBase = /** @class */ (function () {
    /**
     * Initializes the name and unique identifier for the instance.
     */
    function ObjectBase() {
        this.name = "__UNDEFINED_NAME__";
        // Initialize the name by calling the abstract method getName()
        this.name = this.getName();
        // Generate a unique identifier using a combination of timestamp and random numbers
        var timestamp = performance.now() * 1000000;
        var random1 = BigInt(Math.floor(Math.random() * 1000000));
        var random2 = BigInt(Math.floor(Math.random() * 1000000));
        this._id = "".concat(timestamp).concat(random1).concat(random2);
    }
    /**
     * Static method to retrieve the name of the class. This method is abstract and must be implemented
     * by derived classes.
     */
    ObjectBase.getName = function () {
        throw new force_method_implementation_1.ForceMethodBase("ObjectBase", "getName");
    };
    /**
     * Retrieves the name of the current instance by calling the static `getName()` method of the
     * constructor (derived class).
     */
    ObjectBase.prototype.getName = function () {
        return this.constructor.getName();
    };
    /**
     * Retrieves the unique identifier of the current instance.
     */
    ObjectBase.prototype.getUniqueId = function () {
        return this._id;
    };
    /**
     * Retrieves the initial name that was set during construction. This name may be "__UNDEFINED_NAME__"
     * if the `getName()` method of the derived class does not provide a valid name.
     */
    ObjectBase.prototype.getInitialName = function () {
        return this.name;
    };
    /**
     * Retrieves an array of hierarchical class names from the current instance up to the `ObjectBase` class.
     */
    ObjectBase.prototype.getHierarchyNames = function () {
        var classNames = [];
        var obj = Object.getPrototypeOf(this);
        var className;
        // Traverse the prototype chain and collect class names until the base ObjectBase class is reached.
        while ((className = obj.getName()) !== "Object") {
            classNames.push(className);
            obj = Object.getPrototypeOf(obj);
            // Break the loop if the prototype's constructor is ObjectBase (reached the base class).
            if (obj.constructor === ObjectBase) {
                break;
            }
        }
        return classNames;
    };
    return ObjectBase;
}());
exports.ObjectBase = ObjectBase;
