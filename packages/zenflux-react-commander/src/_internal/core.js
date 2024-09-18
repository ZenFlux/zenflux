"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
var constants_1 = require("./constants");
var context = {};
// This will hold the sorted keys for the binary search
var sortedContextKeys = [];
/**
 * Core class is responsible for managing the command context for each component.
 * It provides methods to register, unregister, get and link components.
 */
var Core = /** @class */ (function () {
    function Core() {
    }
    /**
     * Registers the context for a React component.
     */
    Core.prototype[constants_1.REGISTER_INTERNAL_SYMBOL] = function (args) {
        var componentNameUnique = args.componentNameUnique, componentName = args.componentName, commands = args.commands, emitter = args.emitter, getComponentContext = args.getComponentContext, getState = args.getState, setState = args.setState, isMounted = args.isMounted, key = args.key, lifecycleHandlers = args.lifecycleHandlers;
        this.__devDebug("Registering component '".concat(componentNameUnique, "'"));
        // Check if the component is registered
        if (context[componentNameUnique]) {
            throw new Error("Component '".concat(componentNameUnique, "' already registered"));
        }
        // Register the context
        context[componentNameUnique] = {
            commands: commands,
            componentName: componentName,
            componentNameUnique: componentNameUnique,
            emitter: emitter,
            getComponentContext: getComponentContext,
            getState: getState,
            setState: setState,
            isMounted: isMounted,
            key: key,
            props: undefined,
            lifecycleHandlers: lifecycleHandlers,
        };
        // Update sorted keys
        this.updateSortedContextKeys();
    };
    /**
     * Unregisters the context.
     */
    Core.prototype[constants_1.UNREGISTER_INTERNAL_SYMBOL] = function (// eslint-disable-line @typescript-eslint/explicit-member-accessibility
    componentNameUnique) {
        this.__devDebug("Unregistering component '".concat(componentNameUnique, "' from the context "));
        // Check if the component is registered
        if (!context[componentNameUnique]) {
            throw new Error("Component '".concat(componentNameUnique, "' not registered"));
        }
        // Clean up emitter
        context[componentNameUnique].emitter.removeAllListeners();
        // Clean up context
        delete context[componentNameUnique];
        // Update sorted keys
        this.updateSortedContextKeys();
    };
    /**
     * Gets the context for a React component.
     */
    Core.prototype[constants_1.GET_INTERNAL_SYMBOL] = function (// eslint-disable-line @typescript-eslint/explicit-member-accessibility
    componentNameUnique, silent) {
        // Check if the component is registered
        if (!silent && !context[componentNameUnique]) {
            throw new Error("Component '".concat(componentNameUnique, "' not registered"));
        }
        return context[componentNameUnique];
    };
    Core.prototype[constants_1.GET_INTERNAL_MATCH_SYMBOL] = function (// eslint-disable-line @typescript-eslint/explicit-member-accessibility
    componentName) {
        if (componentName.includes("*")) {
            var result_1 = [];
            var anyMatchComponent_1 = componentName.substring(0, componentName.length - 1);
            sortedContextKeys.forEach(function (componentNameUnique) {
                if (componentNameUnique.includes(anyMatchComponent_1)) {
                    result_1.push(context[componentNameUnique]);
                }
            });
            return result_1;
        }
        else {
            var index = this.binarySearch(sortedContextKeys, componentName);
            if (index !== -1) {
                return [context[sortedContextKeys[index]]];
            }
        }
        throw new Error("Component '".concat(componentName, "' not found"));
    };
    Core.prototype[constants_1.SET_TO_CONTEXT_SYMBOL] = function (// eslint-disable-line @typescript-eslint/explicit-member-accessibility
    componentNameUnique, data) {
        if (!context[componentNameUnique]) {
            throw new Error("Component '".concat(componentNameUnique, "' not registered"));
        }
        Object.entries(data).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            // @ts-ignore
            context[componentNameUnique][key] = value;
        });
    };
    /**
     * Updates the sorted keys for binary search.
     */
    Core.prototype.updateSortedContextKeys = function () {
        sortedContextKeys = Object.keys(context).sort();
    };
    /**
     * Binary Search function to find a context entry by its symbol
     * @param array - The sorted array of context entry keys.
     * @param symbol - The symbol to find.
     * @returns Index of the found context entry, or -1 if not found.
     */
    Core.prototype.binarySearch = function (array, symbol) {
        var left = 0;
        var right = array.length - 1;
        while (left <= right) {
            var mid = Math.floor((left + right) / 2);
            if (array[mid] === symbol) {
                return mid;
            }
            else if (array[mid] < symbol) {
                left = mid + 1;
            }
            else {
                right = mid - 1;
            }
        }
        return -1; // Symbol not found
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Core.prototype.__devDebug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
    };
    return Core;
}());
var core = new Core();
if ( /* from vite */import.meta.env.DEV) {
    if (window.__DEBUG__) {
        core.__devDebug = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.log.apply(console, args);
        };
    }
    core.__devGetContextLength = function () {
        return Object.keys(context).length;
    };
    core.__devGetContextKeys = function () {
        return Object.keys(context);
    };
    core.__devGetContextValues = function () {
        return Object.values(context).map(function (context) { return context; });
    };
    window.$$core = core;
}
exports.default = core;
