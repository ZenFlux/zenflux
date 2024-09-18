"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
var core_ts_1 = require("./_internal/core.ts");
// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
var constants_1 = require("./_internal/constants");
var CommandsManager = /** @class */ (function () {
    function CommandsManager() {
        this.commands = {};
    }
    CommandsManager.prototype.register = function (args) {
        var _this = this;
        var componentName = args.componentName, commands = args.commands;
        if (this.commands[componentName]) {
        }
        var createdCommands = [];
        if (!this.commands[componentName]) {
            this.commands[componentName] = {};
        }
        commands.forEach(function (command) {
            var commandName = command.getName();
            var commandInstance = new command(args);
            _this.commands[componentName][commandName] = commandInstance;
            createdCommands.push(commandInstance);
        });
        return createdCommands;
    };
    CommandsManager.prototype.run = function (id, args, callback) {
        var _a;
        var componentNameUnique = id.componentNameUnique, componentName = id.componentName, commandName = id.commandName;
        var command = (_a = this.commands[componentName]) === null || _a === void 0 ? void 0 : _a[commandName];
        if (!command) {
            throw new Error("Command '".concat(commandName, "' not registered for component '").concat(componentName, "'"));
        }
        console.log("Commands.run() '".concat(commandName, "' for component '").concat(componentNameUnique, "'"), args);
        var singleComponentContext = core_ts_1.default[constants_1.GET_INTERNAL_SYMBOL](componentNameUnique);
        var executionResult;
        if (singleComponentContext.getState) {
            executionResult = command.execute(singleComponentContext.emitter, args, {
                state: singleComponentContext.getState(),
                setState: singleComponentContext.setState,
            });
        }
        else {
            executionResult = command.execute(singleComponentContext.emitter, args);
        }
        if (callback) {
            callback(executionResult);
        }
        return executionResult;
    };
    CommandsManager.prototype.unregister = function (componentName) {
        this.unhookWithinComponent(componentName);
        delete this.commands[componentName];
    };
    CommandsManager.prototype.hook = function (id, callback, options) {
        var componentNameUnique = id.componentNameUnique, componentName = id.componentName, commandName = id.commandName;
        if (!this.commands[componentName]) {
            throw new Error("Component '".concat(componentName, "' not registered"));
        }
        var singleComponentContext = core_ts_1.default[constants_1.GET_INTERNAL_SYMBOL](componentNameUnique);
        // Check if id exist within the component context
        if (!singleComponentContext.commands[commandName]) {
            throw new Error("Command '".concat(commandName, "' not registered for component '").concat(componentNameUnique, "'"));
        }
        var listeners = singleComponentContext.emitter.listeners(commandName);
        if (!(options === null || options === void 0 ? void 0 : options.__ignoreDuplicatedHookError)) {
            // Check if the same callback is already registered
            if (listeners.length > 0 && listeners.find(function (l) { return l.name === callback.name; })) {
                console.warn("Probably duplicated hook in '".concat(commandName, "'\n") +
                    "callback '".concat(callback.name, "()' already hooked for component '").concat(componentNameUnique, "'") +
                    "The hook will be ignored, to avoid this error bound the callback or pass options: { __ignoreDuplicatedHookError: true }");
                return;
            }
        }
        return singleComponentContext.emitter.on(commandName, callback);
    };
    CommandsManager.prototype.unhook = function (id) {
        var _a;
        var componentNameUnique = id.componentNameUnique, componentName = id.componentName, commandName = id.commandName;
        if (!this.commands[componentName]) {
            throw new Error("Component '".concat(componentName, "' not registered"));
        }
        // @ts-ignore - If it hot reloads then skip the error
        var shouldSilentError = !!typeof ((_a = import.meta.hot) === null || _a === void 0 ? void 0 : _a.hmrClient.pruneMap.size);
        var singleComponentContext = core_ts_1.default[constants_1.GET_INTERNAL_SYMBOL](componentNameUnique, shouldSilentError);
        if (!singleComponentContext && shouldSilentError) {
            return;
        }
        // Check if id exist within the component context
        if (!singleComponentContext.commands[commandName]) {
            throw new Error("Command '".concat(commandName, "' not registered for component '").concat(componentNameUnique, "'"));
        }
        return singleComponentContext.emitter.removeAllListeners(commandName);
    };
    CommandsManager.prototype.unhookWithinComponent = function (componentNameUnique) {
        var singleComponentContext = core_ts_1.default[constants_1.GET_INTERNAL_SYMBOL](componentNameUnique, true);
        singleComponentContext && Object.keys(singleComponentContext.commands).forEach(function (commandName) {
            singleComponentContext.emitter.removeAllListeners(commandName);
        });
    };
    CommandsManager.prototype.get = function (componentName, shouldSilentError) {
        if (shouldSilentError === void 0) { shouldSilentError = false; }
        if (!shouldSilentError && !this.commands[componentName]) {
            throw new Error("Component '".concat(componentName, "' not registered"));
        }
        return this.commands[componentName];
    };
    CommandsManager.prototype.getCommands = function () {
        return this.commands;
    };
    CommandsManager.prototype.isHooked = function (id) {
        var componentNameUnique = id.componentNameUnique, commandName = id.commandName;
        var singleComponentContext = core_ts_1.default[constants_1.GET_INTERNAL_SYMBOL](componentNameUnique, true);
        if (!singleComponentContext) {
            return false;
        }
        var listeners = singleComponentContext.emitter.listeners(commandName);
        return listeners.length > 0;
    };
    CommandsManager.prototype.isContextRegistered = function (componentNameUnique) {
        return !!core_ts_1.default[constants_1.GET_INTERNAL_SYMBOL](componentNameUnique, true);
    };
    return CommandsManager;
}());
exports.commands = new CommandsManager();
if (import.meta.env.DEV) {
    window.$$commands = exports.commands;
}
exports.default = exports.commands;
