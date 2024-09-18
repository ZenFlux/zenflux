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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCommands = void 0;
var events_1 = require("events");
var react_1 = require("react");
var rxjs_1 = require("rxjs");
// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
var constants_1 = require("./_internal/constants");
// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
var core_1 = require("./_internal/core");
var commands_context_1 = require("@zenflux/react-commander/commands-context");
var commands_manager_1 = require("@zenflux/react-commander/commands-manager");
var commands_provider_1 = require("@zenflux/react-commander/commands-provider");
function withCommands(componentName, Component) {
    var _a;
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var commands, state;
    if (args.length === 1) {
        commands = args[0];
    }
    else if (args.length === 2) {
        state = args[0];
        commands = args[1];
    }
    else {
        throw new Error("Invalid arguments");
    }
    function stringifyToLevel(obj, level) {
        var cache = new Map();
        var str = JSON.stringify(obj, function (key, value) {
            if (typeof value === "object" && value !== null) {
                if (cache.size > level)
                    return; // Limit depth
                if (cache.has(value))
                    return; // Duplicate reference
                cache.set(value, true);
            }
            return value;
        });
        cache.clear(); // Enable garbage collection
        return str;
    }
    var comparedObjects = new WeakMap();
    function compareObjects(obj1, obj2, level) {
        // Check if the objects have already been compared
        if (comparedObjects.has(obj1) && comparedObjects.get(obj1) === obj2) {
            return true;
        }
        var strObj1 = stringifyToLevel(obj1, level);
        var strObj2 = stringifyToLevel(obj2, level);
        var isEqual = strObj1 === strObj2;
        // If the objects are equal, store them in the WeakMap
        if (isEqual) {
            comparedObjects.set(obj1, obj2);
            comparedObjects.set(obj2, obj1);
        }
        return isEqual;
    }
    var Store = /** @class */ (function () {
        function Store(initialState) {
            this.currentState = new rxjs_1.BehaviorSubject(initialState);
            this.prevState = initialState;
        }
        Store.prototype.getState = function () {
            return this.silentState || this.currentState.getValue();
        };
        Store.prototype.getPrevState = function () {
            return this.prevState;
        };
        Store.prototype.setState = function (newState, silent) {
            if (silent === void 0) { silent = false; }
            this.prevState = this.currentState.getValue();
            if (silent) {
                this.silentState = newState;
                return;
            }
            this.silentState = null;
            this.currentState.next(newState);
        };
        Store.prototype.hasChanged = function (level) {
            if (level === void 0) { level = 2; }
            if (this.prevState === this.currentState) {
                return false;
            }
            return !compareObjects(this.prevState, this.currentState.getValue(), level);
        };
        Store.prototype.subscribe = function (callback) {
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
            this.subscription = this.currentState.subscribe(callback);
            callback(this.getState());
            return this.subscription;
        };
        return Store;
    }());
    if (state) {
        var originalFunction_1 = Component, originalName = Component.displayName || Component.name || "Component";
        // This approach give us ability to inject second argument to the functional component.
        Component = function (props) {
            return originalFunction_1(props, state);
        };
        Object.defineProperty(Component, originalName, { value: originalName, writable: false });
        Component.displayName = "withInjectedState(".concat(originalName, ")");
    }
    var WrappedComponent = (_a = /** @class */ (function (_super) {
            __extends(WrappedComponent, _super);
            function WrappedComponent(props, context) {
                var _this = _super.call(this, props) || this;
                _this.$$commander = {
                    isMounted: false,
                    lifecycleHandlers: {},
                };
                _this.context = context;
                _this.state = {};
                _this.store = new Store(state);
                _this.registerInternalContext();
                return _this;
            }
            WrappedComponent.prototype.isMounted = function () {
                return this.$$commander.isMounted;
            };
            WrappedComponent.prototype.registerInternalContext = function () {
                var _this = this;
                var _b;
                var id = this.context.getNameUnique();
                if ((_b = this.props[constants_1.INTERNAL_PROPS]) === null || _b === void 0 ? void 0 : _b.handlers) {
                    this.$$commander.lifecycleHandlers = this.props[constants_1.INTERNAL_PROPS].handlers;
                }
                if (commands_manager_1.default.isContextRegistered(id)) {
                    return;
                }
                var self = this;
                core_1.default[constants_1.REGISTER_INTERNAL_SYMBOL]({
                    componentName: componentName,
                    componentNameUnique: id,
                    commands: commands_manager_1.default.get(componentName),
                    emitter: new events_1.EventEmitter(),
                    key: self.props.$$key,
                    isMounted: function () { return self.isMounted(); },
                    getComponentContext: function () { return self.context; },
                    getState: function () { return _this.store ? _this.store.getState() : _this.state; },
                    setState: function (state, callback) {
                        _this.store.setState(__assign(__assign({}, _this.store.getState()), state), !_this.isMounted());
                        if (callback) {
                            callback(_this.store.getState());
                        }
                    },
                    lifecycleHandlers: this.$$commander.lifecycleHandlers,
                });
            };
            WrappedComponent.prototype.componentWillUnmount = function () {
                this.$$commander.isMounted = false;
                if (this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_UNMOUNT]) {
                    this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_UNMOUNT](core_1.default[constants_1.GET_INTERNAL_SYMBOL](this.context.getNameUnique()));
                }
                var componentNameUnique = this.context.getNameUnique();
                core_1.default[constants_1.UNREGISTER_INTERNAL_SYMBOL](componentNameUnique);
            };
            /**
             * Using `componentDidMount` in a strict mode causes component to unmount therefor the context need to be
             * re-registered.
             */
            WrappedComponent.prototype.componentDidMount = function () {
                var _this = this;
                var _b;
                var id = this.context.getNameUnique();
                this.$$commander.isMounted = true;
                this.registerInternalContext();
                (_b = this.store) === null || _b === void 0 ? void 0 : _b.subscribe(function (_state) {
                    var _b;
                    if (!((_b = _this.context.getComponentRef()) === null || _b === void 0 ? void 0 : _b.current)) {
                        return;
                    }
                    _this.forceUpdate();
                });
                core_1.default[constants_1.SET_TO_CONTEXT_SYMBOL](id, { props: this.props });
                if (this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_MOUNT]) {
                    this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_MOUNT](core_1.default[constants_1.GET_INTERNAL_SYMBOL](this.context.getNameUnique()));
                }
            };
            WrappedComponent.prototype.componentDidUpdate = function (prevProps, prevState, snapshot) {
                if (this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_UPDATE]) {
                    var context = core_1.default[constants_1.GET_INTERNAL_SYMBOL](this.context.getNameUnique());
                    this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_UPDATE](context, {
                        currentProps: this.props,
                        currentState: this.store.getState(),
                        prevProps: prevProps,
                        prevState: this.store.getPrevState(),
                        snapshot: snapshot,
                    });
                }
            };
            WrappedComponent.prototype.render = function () {
                if (this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_LOAD]) {
                    this.$$commander.lifecycleHandlers[constants_1.INTERNAL_ON_LOAD](core_1.default[constants_1.GET_INTERNAL_SYMBOL](this.context.getNameUnique()));
                }
                return <Component {...this.props}/>;
            };
            return WrappedComponent;
        }(react_1.default.PureComponent)),
        _a.displayName = "withCommands(".concat(componentName, ")"),
        _a.contextType = commands_context_1.ComponentIdContext,
        _a);
    /**
     * Function `handleAncestorContexts()` - Manage and manipulate the hierarchical context structure
     * This function is designed to handle the relationship between a provided context and its parent context within a given
     * component hierarchy. By checking if the parent context is already set, it assigns the parent context to the current
     * context and ensures the correct child-parent relationships are established. Moreover, it also manages the children of the
     * current context by validating their existence in the internal mapping system, removing any child contexts that do not have
     * a corresponding internal context. This ensures a consistent and error-free context hierarchy within the application's
     * command component structure.
     **/
    function handleAncestorContexts(context, parentContext) {
        if (parentContext.isSet) {
            context.parent = parentContext;
        }
        if (context.parent) {
            if (!context.parent.children) {
                context.parent.children = {};
            }
            context.parent.children[context.getNameUnique()] = context;
        }
        if (context.children) {
            for (var key in context.children) {
                var child = context.children[key];
                var internalContext = core_1.default[constants_1.GET_INTERNAL_SYMBOL](child.getNameUnique(), true);
                if (!internalContext) {
                    delete context.children[key];
                }
            }
        }
    }
    /**
     * React `useId` behave differently in production and development mode, because of `<React.StrictMode>`
     * https://github.com/facebook/react/issues/27103#issuecomment-1763359077
     */
    var UniqueWrappedComponent = react_1.default.forwardRef(function (props, _ref) {
        var parentContext = react_1.default.useContext(commands_context_1.ComponentIdContext);
        var componentNameUnique = "".concat(componentName, "-").concat(react_1.default.useId());
        var componentRef = react_1.default.useRef(null);
        var context = {
            isSet: true,
            getNameUnique: function () { return componentNameUnique; },
            getComponentName: function () { return componentName; },
            getComponentRef: function () { return componentRef; },
        };
        react_1.default.useLayoutEffect(function () {
            handleAncestorContexts(context, parentContext);
        }, [context]);
        return (<commands_provider_1.ComponentIdProvider context={context}>
                <WrappedComponent {...props} ref={componentRef} $$key={performance.now()}/>
            </commands_provider_1.ComponentIdProvider>);
    });
    UniqueWrappedComponent.getName = function () { return componentName; };
    commands_manager_1.default.register({
        componentName: componentName,
        commands: commands,
    });
    return UniqueWrappedComponent;
}
exports.withCommands = withCommands;
