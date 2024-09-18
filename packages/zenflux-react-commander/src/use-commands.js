"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnyComponentCommands = exports.useCommanderState = exports.useCommanderChildrenComponents = exports.useCommanderComponent = exports.useCommanderCommand = void 0;
var react_1 = require("react");
// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
var constants_1 = require("./_internal/constants");
// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
var core_1 = require("./_internal/core");
var commands_context_1 = require("@zenflux/react-commander/commands-context");
var commands_manager_1 = require("@zenflux/react-commander/commands-manager");
function getSafeContext(componentName, context) {
    function maybeWrongContext(componentName, componentNameUnique) {
        if (componentName === componentNameUnique) {
            return;
        }
        throw new Error("You are not in: '".concat(componentName, "', you are in '").concat(componentNameUnique, "' which is not your context\n") +
            "If you are trying to reach sub-component context, it has to rendered, before you can use it\n");
    }
    var componentContext = context || react_1.default.useContext(commands_context_1.ComponentIdContext);
    var componentNameContext = componentContext.getComponentName();
    maybeWrongContext(componentName, componentNameContext);
    return componentContext;
}
/**
 * Custom hook to create a command handler for a specific command.
 */
function useCommanderCommand(commandName) {
    var componentContext = react_1.default.useContext(commands_context_1.ComponentIdContext);
    // Get component context
    var componentNameUnique = componentContext.getNameUnique();
    // Get command context
    var commandSignalContext = core_1.default[constants_1.GET_INTERNAL_SYMBOL](componentNameUnique);
    // Set id, used to identify command
    var id = {
        commandName: commandName,
        componentNameUnique: componentNameUnique,
        componentName: commandSignalContext.componentName,
    };
    return {
        run: function (args, callback) { return commands_manager_1.default.run(id, args, callback); },
        hook: function (callback) { return commands_manager_1.default.hook(id, callback); },
        unhook: function () { return commands_manager_1.default.unhook(id); },
        // TODO: Remove.
        getInternalContext: function () { return commandSignalContext; },
    };
}
exports.useCommanderCommand = useCommanderCommand;
/**
 * Custom hook to create a command handler for a specific component.
 */
function useCommanderComponent(componentName, context, options) {
    if (options === void 0) { options = { silent: false }; }
    if (!options.silent) {
        context = getSafeContext(componentName, context);
    }
    var id = context.getNameUnique();
    return {
        run: function (commandName, args, callback) {
            return commands_manager_1.default.run({ commandName: commandName, componentName: componentName, componentNameUnique: id }, args, callback);
        },
        hook: function (commandName, callback) {
            return commands_manager_1.default.hook({ commandName: commandName, componentName: componentName, componentNameUnique: id }, callback);
        },
        unhook: function (commandName) {
            return commands_manager_1.default.unhook({ commandName: commandName, componentName: componentName, componentNameUnique: id });
        },
        // TODO: Remove.
        getId: function () { return id; },
        getKey: function () { return core_1.default[constants_1.GET_INTERNAL_SYMBOL](id).key; },
        isAlive: function () { return !!core_1.default[constants_1.GET_INTERNAL_SYMBOL](id, true); },
        getInternalContext: function () { return core_1.default[constants_1.GET_INTERNAL_SYMBOL](id); },
        getContext: function () { return context; },
        getState: function () { return core_1.default[constants_1.GET_INTERNAL_SYMBOL](id).getState(); },
    };
}
exports.useCommanderComponent = useCommanderComponent;
function useCommanderChildrenComponents(componentName, onChildrenUpdate) {
    var componentContext = react_1.default.useContext(commands_context_1.ComponentIdContext);
    var _a = react_1.default.useState([]), childrenComponents = _a[0], setChildrenComponents = _a[1];
    function getDescendantsKeys(context) {
        var keys = [];
        // Check if the context has children
        if (context.children) {
            // Iterate over each child in the context
            for (var key in context.children) {
                // Add the current child's key to the keys array
                keys.push(key);
                // Recursively get the keys of the descendants of the current child
                // and concatenate them to the keys array
                keys = keys.concat(getDescendantsKeys(context.children[key]));
            }
        }
        // Join all the keys with a separator to form a unique ID
        return keys.join("-");
    }
    react_1.default.useEffect(function () {
        var children = componentContext.children;
        if (!children) {
            throw new Error("Current component: '".concat(componentContext.getComponentName(), "' cannot find: '").concat(componentName, "' children"));
        }
        var newChildrenComponents = [];
        var loopChildren = function (children) {
            for (var childName in children) {
                var child = children[childName];
                if (child.getComponentName() === componentName) {
                    var childComponent = useCommanderComponent(componentName, child);
                    newChildrenComponents.push(childComponent);
                }
                if (child.children) {
                    loopChildren(child.children);
                }
            }
        };
        loopChildren(children);
        setChildrenComponents(newChildrenComponents);
        var callback = onChildrenUpdate === null || onChildrenUpdate === void 0 ? void 0 : onChildrenUpdate(newChildrenComponents);
        return function () {
            callback === null || callback === void 0 ? void 0 : callback();
        };
    }, [getDescendantsKeys(componentContext)]);
    return childrenComponents;
}
exports.useCommanderChildrenComponents = useCommanderChildrenComponents;
function useCommanderState(componentName) {
    var componentContext = getSafeContext(componentName);
    var id = componentContext.getNameUnique();
    var internalContext = core_1.default[constants_1.GET_INTERNAL_SYMBOL](id);
    return [
        (internalContext.getState),
        (internalContext.setState),
        internalContext.isMounted,
    ];
}
exports.useCommanderState = useCommanderState;
/**
 * Unsafe, this command should be used carefully, since it can be used to run commands from any component.
 * It should be used only in cases where you are sure that there are no conflicts, and there are no other ways to do it.
 */
function useAnyComponentCommands(componentName) {
    return core_1.default[constants_1.GET_INTERNAL_MATCH_SYMBOL](componentName + "*");
}
exports.useAnyComponentCommands = useAnyComponentCommands;
