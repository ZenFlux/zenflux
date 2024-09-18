"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClassInstance = exports.resumeMountClassInstance = exports.mountClassInstance = exports.constructClassInstance = exports.adoptClassInstance = void 0;
var get_component_name_from_type_1 = require("@zenflux/react-shared/src/get-component-name-from-type");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_instance_map_1 = require("@zenflux/react-shared/src/react-instance-map");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var shallow_equal_1 = require("@zenflux/react-shared/src/shallow-equal");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_debug_tracing_1 = require("@zenflux/react-reconciler/src/react-debug-tracing");
var react_fiber_work_in_progress_request_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_context_1 = require("@zenflux/react-reconciler/src/react-fiber-context");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lazy_component_1 = require("@zenflux/react-reconciler/src/react-fiber-lazy-component");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var react_strict_mode_warnings_1 = require("@zenflux/react-reconciler/src/react-strict-mode-warnings");
var fakeInternalInstance = {};
var didWarnAboutStateAssignmentForComponent;
var didWarnAboutUninitializedState;
var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
var didWarnAboutLegacyLifecyclesAndDerivedState;
var didWarnAboutUndefinedDerivedState;
var didWarnAboutDirectlyAssigningPropsToState;
var didWarnAboutContextTypeAndContextTypes;
var didWarnAboutInvalidateContextType;
var didWarnOnInvalidCallback;
if (__DEV__) {
    didWarnAboutStateAssignmentForComponent = new Set();
    didWarnAboutUninitializedState = new Set();
    didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
    didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
    didWarnAboutDirectlyAssigningPropsToState = new Set();
    didWarnAboutUndefinedDerivedState = new Set();
    didWarnAboutContextTypeAndContextTypes = new Set();
    didWarnAboutInvalidateContextType = new Set();
    didWarnOnInvalidCallback = new Set();
    // This is so gross but it's at least non-critical and can be removed if
    // it causes problems. This is meant to give a nicer error message for
    // ReactDOM15.unstable_renderSubtreeIntoContainer(reactDOM16Component,
    // ...)) which otherwise throws a "_processChildContext is not a function"
    // exception.
    Object.defineProperty(fakeInternalInstance, "_processChildContext", {
        enumerable: false,
        value: function () {
            throw new Error("_processChildContext is not available in React 16+. This likely " + "means you have multiple copies of React and are attempting to nest " + "a React 15 tree inside a React 16 tree using " + "unstable_renderSubtreeIntoContainer, which isn't supported. Try " + "to make sure you have only one copy of React (and ideally, switch " + "to ReactDOM.createPortal).");
        }
    });
    Object.freeze(fakeInternalInstance);
}
function warnOnInvalidCallback(callback, callerName) {
    if (__DEV__) {
        if (callback === null || typeof callback === "function") {
            return;
        }
        var key = callerName + "_" + callback;
        if (!didWarnOnInvalidCallback.has(key)) {
            didWarnOnInvalidCallback.add(key);
            console.error("%s(...): Expected the last optional `callback` argument to be a " + "function. Instead received: %s.", callerName, callback);
        }
    }
}
function warnOnUndefinedDerivedState(type, partialState) {
    if (__DEV__) {
        if (partialState === undefined) {
            var componentName = (0, get_component_name_from_type_1.default)(type) || "Component";
            if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
                didWarnAboutUndefinedDerivedState.add(componentName);
                console.error("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. " + "You have returned undefined.", componentName);
            }
        }
    }
}
function applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, nextProps) {
    var prevState = workInProgress.memoizedState;
    var partialState = getDerivedStateFromProps(nextProps, prevState);
    if (__DEV__) {
        if (react_feature_flags_1.debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
            (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(true);
            try {
                // Invoke the function an extra time to help detect side-effects.
                partialState = getDerivedStateFromProps(nextProps, prevState);
            }
            finally {
                (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(false);
            }
        }
        warnOnUndefinedDerivedState(ctor, partialState);
    }
    // Merge the partial state and the previous state.
    var memoizedState = partialState === null || partialState === undefined ? prevState : Object.assign({}, prevState, partialState);
    workInProgress.memoizedState = memoizedState;
    // Once the update queue is empty, persist the derived state onto the
    // base state.
    if (workInProgress.lanes === fiber_lane_constants_1.NoLanes) {
        // Queue is always non-null for classes
        var updateQueue = workInProgress.updateQueue;
        updateQueue.baseState = memoizedState;
    }
}
var classComponentUpdater = {
    isMounted: react_fiber_tree_reflection_1.isMounted,
    // $FlowFixMe[missing-local-annot]
    enqueueSetState: function (inst, payload, callback) {
        var fiber = (0, react_instance_map_1.get)(inst);
        var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(fiber);
        var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
        update.payload = payload;
        if (callback !== undefined && callback !== null) {
            if (__DEV__) {
                warnOnInvalidCallback(callback, "setState");
            }
            update.callback = callback;
        }
        var root = (0, react_fiber_class_update_queue_1.enqueueUpdate)(fiber, update, lane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, lane);
            (0, react_fiber_class_update_queue_1.entangleTransitions)(root, fiber, lane);
        }
        if (__DEV__) {
            if (react_feature_flags_1.enableDebugTracing) {
                if (fiber.mode & type_of_mode_1.TypeOfMode.DebugTracingMode) {
                    var name_1 = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown";
                    (0, react_debug_tracing_1.logStateUpdateScheduled)(name_1, lane, payload);
                }
            }
        }
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markStateUpdateScheduled)(fiber, lane);
        }
    },
    enqueueReplaceState: function (inst, payload, callback) {
        var fiber = (0, react_instance_map_1.get)(inst);
        var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(fiber);
        var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
        update.tag = react_fiber_class_update_queue_1.ReplaceState;
        update.payload = payload;
        if (callback !== undefined && callback !== null) {
            if (__DEV__) {
                warnOnInvalidCallback(callback, "replaceState");
            }
            update.callback = callback;
        }
        var root = (0, react_fiber_class_update_queue_1.enqueueUpdate)(fiber, update, lane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, lane);
            (0, react_fiber_class_update_queue_1.entangleTransitions)(root, fiber, lane);
        }
        if (__DEV__) {
            if (react_feature_flags_1.enableDebugTracing) {
                if (fiber.mode & type_of_mode_1.TypeOfMode.DebugTracingMode) {
                    var name_2 = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown";
                    (0, react_debug_tracing_1.logStateUpdateScheduled)(name_2, lane, payload);
                }
            }
        }
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markStateUpdateScheduled)(fiber, lane);
        }
    },
    // $FlowFixMe[missing-local-annot]
    enqueueForceUpdate: function (inst, callback) {
        var fiber = (0, react_instance_map_1.get)(inst);
        var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(fiber);
        var update = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
        update.tag = react_fiber_class_update_queue_1.ForceUpdate;
        if (callback !== undefined && callback !== null) {
            if (__DEV__) {
                warnOnInvalidCallback(callback, "forceUpdate");
            }
            update.callback = callback;
        }
        var root = (0, react_fiber_class_update_queue_1.enqueueUpdate)(fiber, update, lane);
        if (root !== null) {
            (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, lane);
            (0, react_fiber_class_update_queue_1.entangleTransitions)(root, fiber, lane);
        }
        if (__DEV__) {
            if (react_feature_flags_1.enableDebugTracing) {
                if (fiber.mode & type_of_mode_1.TypeOfMode.DebugTracingMode) {
                    var name_3 = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown";
                    (0, react_debug_tracing_1.logForceUpdateScheduled)(name_3, lane);
                }
            }
        }
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markForceUpdateScheduled)(fiber, lane);
        }
    }
};
function checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext) {
    var instance = workInProgress.stateNode;
    if (typeof instance.shouldComponentUpdate === "function") {
        var shouldUpdate = instance.shouldComponentUpdate(newProps, newState, nextContext);
        if (__DEV__) {
            if (react_feature_flags_1.debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
                (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(true);
                try {
                    // Invoke the function an extra time to help detect side-effects.
                    shouldUpdate = instance.shouldComponentUpdate(newProps, newState, nextContext);
                }
                finally {
                    (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(false);
                }
            }
            if (shouldUpdate === undefined) {
                console.error("%s.shouldComponentUpdate(): Returned undefined instead of a " + "boolean value. Make sure to return true or false.", (0, get_component_name_from_type_1.default)(ctor) || "Component");
            }
        }
        return shouldUpdate;
    }
    if (ctor.prototype && ctor.prototype.isPureReactComponent) {
        return !(0, shallow_equal_1.default)(oldProps, newProps) || !(0, shallow_equal_1.default)(oldState, newState);
    }
    return true;
}
function checkClassInstance(workInProgress, ctor, newProps) {
    var instance = workInProgress.stateNode;
    if (__DEV__) {
        var name_4 = (0, get_component_name_from_type_1.default)(ctor) || "Component";
        var renderPresent = instance.render;
        if (!renderPresent) {
            if (ctor.prototype && typeof ctor.prototype.render === "function") {
                console.error("%s(...): No `render` method found on the returned component " + "instance: did you accidentally return an object from the constructor?", name_4);
            }
            else {
                console.error("%s(...): No `render` method found on the returned component " + "instance: you may have forgotten to define `render`.", name_4);
            }
        }
        if (instance.getInitialState && !instance.getInitialState.isReactClassApproved && !instance.state) {
            console.error("getInitialState was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Did you mean to define a state property instead?", name_4);
        }
        if (instance.getDefaultProps && !instance.getDefaultProps.isReactClassApproved) {
            console.error("getDefaultProps was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Use a static property to define defaultProps instead.", name_4);
        }
        if (instance.propTypes) {
            console.error("propTypes was defined as an instance property on %s. Use a static " + "property to define propTypes instead.", name_4);
        }
        if (instance.contextType) {
            console.error("contextType was defined as an instance property on %s. Use a static " + "property to define contextType instead.", name_4);
        }
        if (react_feature_flags_1.disableLegacyContext) {
            if (ctor.childContextTypes) {
                console.error("%s uses the legacy childContextTypes API which is no longer supported. " + "Use React.createContext() instead.", name_4);
            }
            if (ctor.contextTypes) {
                console.error("%s uses the legacy contextTypes API which is no longer supported. " + "Use React.createContext() with static contextType instead.", name_4);
            }
        }
        else {
            if (instance.contextTypes) {
                console.error("contextTypes was defined as an instance property on %s. Use a static " + "property to define contextTypes instead.", name_4);
            }
            if (ctor.contextType && ctor.contextTypes && !didWarnAboutContextTypeAndContextTypes.has(ctor)) {
                didWarnAboutContextTypeAndContextTypes.add(ctor);
                console.error("%s declares both contextTypes and contextType static properties. " + "The legacy contextTypes property will be ignored.", name_4);
            }
        }
        if (typeof instance.componentShouldUpdate === "function") {
            console.error("%s has a method called " + "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " + "The name is phrased as a question because the function is " + "expected to return a value.", name_4);
        }
        if (ctor.prototype && ctor.prototype.isPureReactComponent && typeof instance.shouldComponentUpdate !== "undefined") {
            console.error("%s has a method called shouldComponentUpdate(). " + "shouldComponentUpdate should not be used when extending React.PureComponent. " + "Please extend React.Component if shouldComponentUpdate is used.", (0, get_component_name_from_type_1.default)(ctor) || "A pure component");
        }
        if (typeof instance.componentDidUnmount === "function") {
            console.error("%s has a method called " + "componentDidUnmount(). But there is no such lifecycle method. " + "Did you mean componentWillUnmount()?", name_4);
        }
        if (typeof instance.componentDidReceiveProps === "function") {
            console.error("%s has a method called " + "componentDidReceiveProps(). But there is no such lifecycle method. " + "If you meant to update the state in response to changing props, " + "use componentWillReceiveProps(). If you meant to fetch data or " + "run side-effects or mutations after React has updated the UI, use componentDidUpdate().", name_4);
        }
        if (typeof instance.componentWillRecieveProps === "function") {
            console.error("%s has a method called " + "componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", name_4);
        }
        if (typeof instance.UNSAFE_componentWillRecieveProps === "function") {
            console.error("%s has a method called " + "UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", name_4);
        }
        var hasMutatedProps = instance.props !== newProps;
        if (instance.props !== undefined && hasMutatedProps) {
            console.error("%s(...): When calling super() in `%s`, make sure to pass " + "up the same props that your component's constructor was passed.", name_4, name_4);
        }
        if (instance.defaultProps) {
            console.error("Setting defaultProps as an instance property on %s is not supported and will be ignored." + " Instead, define defaultProps as a static property on %s.", name_4, name_4);
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function" && typeof instance.componentDidUpdate !== "function" && !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)) {
            didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);
            console.error("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). " + "This component defines getSnapshotBeforeUpdate() only.", (0, get_component_name_from_type_1.default)(ctor));
        }
        if (typeof instance.getDerivedStateFromProps === "function") {
            console.error("%s: getDerivedStateFromProps() is defined as an instance method " + "and will be ignored. Instead, declare it as a static method.", name_4);
        }
        if (typeof instance.getDerivedStateFromError === "function") {
            console.error("%s: getDerivedStateFromError() is defined as an instance method " + "and will be ignored. Instead, declare it as a static method.", name_4);
        }
        if (typeof ctor.getSnapshotBeforeUpdate === "function") {
            console.error("%s: getSnapshotBeforeUpdate() is defined as a static method " + "and will be ignored. Instead, declare it as an instance method.", name_4);
        }
        var state = instance.state;
        if (state && (typeof state !== "object" || Array.isArray(state))) {
            console.error("%s.state: must be set to an object or null", name_4);
        }
        if (typeof instance.getChildContext === "function" && typeof ctor.childContextTypes !== "object") {
            console.error("%s.getChildContext(): childContextTypes must be defined in order to " + "use getChildContext().", name_4);
        }
    }
}
function adoptClassInstance(workInProgress, instance) {
    instance.updater = classComponentUpdater;
    workInProgress.stateNode = instance;
    // The instance needs access to the fiber so that it can schedule updates
    (0, react_instance_map_1.set)(instance, workInProgress);
    if (__DEV__) {
        instance._reactInternalInstance = fakeInternalInstance;
    }
}
exports.adoptClassInstance = adoptClassInstance;
function constructClassInstance(workInProgress, ctor, props) {
    var isLegacyContextConsumer = false;
    var unmaskedContext = react_fiber_context_1.emptyContextObject;
    var context = react_fiber_context_1.emptyContextObject;
    var contextType = ctor.contextType;
    if (__DEV__) {
        if ("contextType" in ctor) {
            var isValid = // Allow null for conditional declaration
             contextType === null || contextType !== undefined && contextType.$$typeof === react_symbols_1.REACT_CONTEXT_TYPE && contextType._context === undefined;
            // Not a <Context.Consumer>
            if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
                didWarnAboutInvalidateContextType.add(ctor);
                var addendum = "";
                if (contextType === undefined) {
                    addendum = " However, it is set to undefined. " + "This can be caused by a typo or by mixing up named and default imports. " + "This can also happen due to a circular dependency, so " + "try moving the createContext() call to a separate file.";
                }
                else if (typeof contextType !== "object") {
                    addendum = " However, it is set to a " + typeof contextType + ".";
                }
                else if (contextType.$$typeof === react_symbols_1.REACT_PROVIDER_TYPE) {
                    addendum = " Did you accidentally pass the Context.Provider instead?";
                }
                else if (contextType._context !== undefined) {
                    // <Context.Consumer>
                    addendum = " Did you accidentally pass the Context.Consumer instead?";
                }
                else {
                    addendum = " However, it is set to an object with keys {" + Object.keys(contextType).join(", ") + "}.";
                }
                console.error("%s defines an invalid contextType. " + "contextType should point to the Context object returned by React.createContext().%s", (0, get_component_name_from_type_1.default)(ctor) || "Component", addendum);
            }
        }
    }
    if (typeof contextType === "object" && contextType !== null) {
        context = (0, react_fiber_new_context_1.readContext)(contextType);
    }
    else if (!react_feature_flags_1.disableLegacyContext) {
        unmaskedContext = (0, react_fiber_context_1.getUnmaskedContext)(workInProgress, ctor, true);
        var contextTypes = ctor.contextTypes;
        isLegacyContextConsumer = contextTypes !== null && contextTypes !== undefined;
        context = isLegacyContextConsumer ? (0, react_fiber_context_1.getMaskedContext)(workInProgress, unmaskedContext) : react_fiber_context_1.emptyContextObject;
    }
    var instance = new ctor(props, context);
    // Instantiate twice to help detect side-effects.
    if (__DEV__) {
        if (react_feature_flags_1.debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
            (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(true);
            try {
                instance = new ctor(props, context); // eslint-disable-line no-new
            }
            finally {
                (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(false);
            }
        }
    }
    var state = workInProgress.memoizedState = instance.state !== null && instance.state !== undefined ? instance.state : null;
    adoptClassInstance(workInProgress, instance);
    if (__DEV__) {
        if (typeof ctor.getDerivedStateFromProps === "function" && state === null) {
            var componentName = (0, get_component_name_from_type_1.default)(ctor) || "Component";
            if (!didWarnAboutUninitializedState.has(componentName)) {
                didWarnAboutUninitializedState.add(componentName);
                console.error("`%s` uses `getDerivedStateFromProps` but its initial state is " + "%s. This is not recommended. Instead, define the initial state by " + "assigning an object to `this.state` in the constructor of `%s`. " + "This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", componentName, instance.state === null ? "null" : "undefined", componentName);
            }
        }
        // If new component APIs are defined, "unsafe" lifecycles won't be called.
        // Warn about these lifecycles if they are present.
        // Don't warn about react-lifecycles-compat polyfilled methods though.
        if (typeof ctor.getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function") {
            var foundWillMountName = null;
            var foundWillReceivePropsName = null;
            var foundWillUpdateName = null;
            if (typeof instance.componentWillMount === "function" && instance.componentWillMount.__suppressDeprecationWarning !== true) {
                foundWillMountName = "componentWillMount";
            }
            else if (typeof instance.UNSAFE_componentWillMount === "function") {
                foundWillMountName = "UNSAFE_componentWillMount";
            }
            if (typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
                foundWillReceivePropsName = "componentWillReceiveProps";
            }
            else if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
                foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps";
            }
            if (typeof instance.componentWillUpdate === "function" && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
                foundWillUpdateName = "componentWillUpdate";
            }
            else if (typeof instance.UNSAFE_componentWillUpdate === "function") {
                foundWillUpdateName = "UNSAFE_componentWillUpdate";
            }
            if (foundWillMountName !== null || foundWillReceivePropsName !== null || foundWillUpdateName !== null) {
                var componentName = (0, get_component_name_from_type_1.default)(ctor) || "Component";
                var newApiName = typeof ctor.getDerivedStateFromProps === "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
                if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(componentName)) {
                    didWarnAboutLegacyLifecyclesAndDerivedState.add(componentName);
                    console.error("Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" + "%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n" + "The above lifecycles should be removed. Learn more about this warning here:\n" + "https://reactjs.org/link/unsafe-component-lifecycles", componentName, newApiName, foundWillMountName !== null ? "\n  ".concat(foundWillMountName) : "", foundWillReceivePropsName !== null ? "\n  ".concat(foundWillReceivePropsName) : "", foundWillUpdateName !== null ? "\n  ".concat(foundWillUpdateName) : "");
                }
            }
        }
    }
    // Cache unmasked context so we can avoid recreating masked context unless necessary.
    // ReactFiberContext usually updates this cache but can't for newly-created instances.
    if (isLegacyContextConsumer) {
        (0, react_fiber_context_1.cacheContext)(workInProgress, unmaskedContext, context);
    }
    return instance;
}
exports.constructClassInstance = constructClassInstance;
function callComponentWillMount(workInProgress, instance) {
    var oldState = instance.state;
    if (typeof instance.componentWillMount === "function") {
        instance.componentWillMount();
    }
    if (typeof instance.UNSAFE_componentWillMount === "function") {
        instance.UNSAFE_componentWillMount();
    }
    if (oldState !== instance.state) {
        if (__DEV__) {
            console.error("%s.componentWillMount(): Assigning directly to this.state is " + "deprecated (except inside a component's " + "constructor). Use setState instead.", (0, react_get_component_name_from_fiber_1.default)(workInProgress) || "Component");
        }
        classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
    }
}
function callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext) {
    var oldState = instance.state;
    if (typeof instance.componentWillReceiveProps === "function") {
        instance.componentWillReceiveProps(newProps, nextContext);
    }
    if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
        instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
    }
    if (instance.state !== oldState) {
        if (__DEV__) {
            var componentName = (0, react_get_component_name_from_fiber_1.default)(workInProgress) || "Component";
            if (!didWarnAboutStateAssignmentForComponent.has(componentName)) {
                didWarnAboutStateAssignmentForComponent.add(componentName);
                console.error("%s.componentWillReceiveProps(): Assigning directly to " + "this.state is deprecated (except inside a component's " + "constructor). Use setState instead.", componentName);
            }
        }
        classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
    }
}
// Invokes the mount life-cycles on a previously never rendered instance.
function mountClassInstance(workInProgress, ctor, newProps, renderLanes) {
    if (__DEV__) {
        checkClassInstance(workInProgress, ctor, newProps);
    }
    var instance = workInProgress.stateNode;
    instance.props = newProps;
    instance.state = workInProgress.memoizedState;
    instance.refs = {};
    (0, react_fiber_class_update_queue_1.initializeUpdateQueue)(workInProgress);
    var contextType = ctor.contextType;
    if (typeof contextType === "object" && contextType !== null) {
        instance.context = (0, react_fiber_new_context_1.readContext)(contextType);
    }
    else if (react_feature_flags_1.disableLegacyContext) {
        instance.context = react_fiber_context_1.emptyContextObject;
    }
    else {
        var unmaskedContext = (0, react_fiber_context_1.getUnmaskedContext)(workInProgress, ctor, true);
        instance.context = (0, react_fiber_context_1.getMaskedContext)(workInProgress, unmaskedContext);
    }
    if (__DEV__) {
        if (instance.state === newProps) {
            var componentName = (0, get_component_name_from_type_1.default)(ctor) || "Component";
            if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
                didWarnAboutDirectlyAssigningPropsToState.add(componentName);
                console.error("%s: It is not recommended to assign props directly to state " + "because updates to props won't be reflected in state. " + "In most cases, it is better to use props directly.", componentName);
            }
        }
        if (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
            react_strict_mode_warnings_1.default.recordLegacyContextWarning(workInProgress, instance);
        }
        react_strict_mode_warnings_1.default.recordUnsafeLifecycleWarnings(workInProgress, instance);
    }
    instance.state = workInProgress.memoizedState;
    var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
        instance.state = workInProgress.memoizedState;
    }
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (typeof ctor.getDerivedStateFromProps !== "function" && typeof instance.getSnapshotBeforeUpdate !== "function" && (typeof instance.UNSAFE_componentWillMount === "function" || typeof instance.componentWillMount === "function")) {
        callComponentWillMount(workInProgress, instance);
        // If we had additional state updates during this life-cycle, let's
        // process them now.
        (0, react_fiber_class_update_queue_1.processUpdateQueue)(workInProgress, newProps, instance, renderLanes);
        instance.state = workInProgress.memoizedState;
    }
    if (typeof instance.componentDidMount === "function") {
        workInProgress.flags |= fiber_flags_1.FiberFlags.Update | fiber_flags_1.FiberFlags.LayoutStatic;
    }
    if (__DEV__ && (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode) {
        workInProgress.flags |= fiber_flags_1.FiberFlags.MountLayoutDev;
    }
}
exports.mountClassInstance = mountClassInstance;
function resumeMountClassInstance(workInProgress, ctor, newProps, renderLanes) {
    var instance = workInProgress.stateNode;
    var oldProps = workInProgress.memoizedProps;
    instance.props = oldProps;
    var oldContext = instance.context;
    var contextType = ctor.contextType;
    var nextContext = react_fiber_context_1.emptyContextObject;
    if (typeof contextType === "object" && contextType !== null) {
        nextContext = (0, react_fiber_new_context_1.readContext)(contextType);
    }
    else if (!react_feature_flags_1.disableLegacyContext) {
        var nextLegacyUnmaskedContext = (0, react_fiber_context_1.getUnmaskedContext)(workInProgress, ctor, true);
        nextContext = (0, react_fiber_context_1.getMaskedContext)(workInProgress, nextLegacyUnmaskedContext);
    }
    var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    var hasNewLifecycles = typeof getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function";
    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === "function" || typeof instance.componentWillReceiveProps === "function")) {
        if (oldProps !== newProps || oldContext !== nextContext) {
            callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
        }
    }
    (0, react_fiber_class_update_queue_1.resetHasForceUpdateBeforeProcessing)();
    var oldState = workInProgress.memoizedState;
    var newState = instance.state = oldState;
    (0, react_fiber_class_update_queue_1.processUpdateQueue)(workInProgress, newProps, instance, renderLanes);
    newState = workInProgress.memoizedState;
    if (oldProps === newProps && oldState === newState && !(0, react_fiber_context_1.hasContextChanged)() && !(0, react_fiber_class_update_queue_1.checkHasForceUpdateAfterProcessing)()) {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidMount === "function") {
            workInProgress.flags |= fiber_flags_1.FiberFlags.Update | fiber_flags_1.FiberFlags.LayoutStatic;
        }
        if (__DEV__ && (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode) {
            workInProgress.flags |= fiber_flags_1.FiberFlags.MountLayoutDev;
        }
        return false;
    }
    if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
        newState = workInProgress.memoizedState;
    }
    var shouldUpdate = (0, react_fiber_class_update_queue_1.checkHasForceUpdateAfterProcessing)() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext);
    if (shouldUpdate) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for components using the new APIs.
        if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillMount === "function" || typeof instance.componentWillMount === "function")) {
            if (typeof instance.componentWillMount === "function") {
                instance.componentWillMount();
            }
            if (typeof instance.UNSAFE_componentWillMount === "function") {
                instance.UNSAFE_componentWillMount();
            }
        }
        if (typeof instance.componentDidMount === "function") {
            workInProgress.flags |= fiber_flags_1.FiberFlags.Update | fiber_flags_1.FiberFlags.LayoutStatic;
        }
        if (__DEV__ && (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode) {
            workInProgress.flags |= fiber_flags_1.FiberFlags.MountLayoutDev;
        }
    }
    else {
        // If an update was already in progress, we should schedule an FiberFlags.Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidMount === "function") {
            workInProgress.flags |= fiber_flags_1.FiberFlags.Update | fiber_flags_1.FiberFlags.LayoutStatic;
        }
        if (__DEV__ && (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode) {
            workInProgress.flags |= fiber_flags_1.FiberFlags.MountLayoutDev;
        }
        // If shouldComponentUpdate returned false, we should still update the
        // memoized state to indicate that this work can be reused.
        workInProgress.memoizedProps = newProps;
        workInProgress.memoizedState = newState;
    }
    // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.
    instance.props = newProps;
    instance.state = newState;
    instance.context = nextContext;
    return shouldUpdate;
}
exports.resumeMountClassInstance = resumeMountClassInstance;
// Invokes the update life-cycles and returns false if it shouldn't rerender.
function updateClassInstance(current, workInProgress, ctor, newProps, renderLanes) {
    var instance = workInProgress.stateNode;
    (0, react_fiber_class_update_queue_1.cloneUpdateQueue)(current, workInProgress);
    var unresolvedOldProps = workInProgress.memoizedProps;
    var oldProps = workInProgress.type === workInProgress.elementType ? unresolvedOldProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(workInProgress.type, unresolvedOldProps);
    instance.props = oldProps;
    var unresolvedNewProps = workInProgress.pendingProps;
    var oldContext = instance.context;
    var contextType = ctor.contextType;
    var nextContext = react_fiber_context_1.emptyContextObject;
    if (typeof contextType === "object" && contextType !== null) {
        nextContext = (0, react_fiber_new_context_1.readContext)(contextType);
    }
    else if (!react_feature_flags_1.disableLegacyContext) {
        var nextUnmaskedContext = (0, react_fiber_context_1.getUnmaskedContext)(workInProgress, ctor, true);
        nextContext = (0, react_fiber_context_1.getMaskedContext)(workInProgress, nextUnmaskedContext);
    }
    var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    var hasNewLifecycles = typeof getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function";
    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === "function" || typeof instance.componentWillReceiveProps === "function")) {
        if (unresolvedOldProps !== unresolvedNewProps || oldContext !== nextContext) {
            callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
        }
    }
    (0, react_fiber_class_update_queue_1.resetHasForceUpdateBeforeProcessing)();
    var oldState = workInProgress.memoizedState;
    var newState = instance.state = oldState;
    (0, react_fiber_class_update_queue_1.processUpdateQueue)(workInProgress, newProps, instance, renderLanes);
    newState = workInProgress.memoizedState;
    if (unresolvedOldProps === unresolvedNewProps && oldState === newState && !(0, react_fiber_context_1.hasContextChanged)() && !(0, react_fiber_class_update_queue_1.checkHasForceUpdateAfterProcessing)() && !(react_feature_flags_1.enableLazyContextPropagation && current !== null && current.dependencies !== null && (0, react_fiber_new_context_1.checkIfContextChanged)(current.dependencies))) {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidUpdate === "function") {
            if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
                workInProgress.flags |= fiber_flags_1.FiberFlags.Update;
            }
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function") {
            if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
                workInProgress.flags |= fiber_flags_1.FiberFlags.Snapshot;
            }
        }
        return false;
    }
    if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
        newState = workInProgress.memoizedState;
    }
    var shouldUpdate = (0, react_fiber_class_update_queue_1.checkHasForceUpdateAfterProcessing)() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext) || // TODO: In some cases, we'll end up checking if context has changed twice,
        // both before and after `shouldComponentUpdate` has been called. Not ideal,
        // but I'm loath to refactor this function. This only happens for memoized
        // components so it's not that common.
        react_feature_flags_1.enableLazyContextPropagation && current !== null && current.dependencies !== null && (0, react_fiber_new_context_1.checkIfContextChanged)(current.dependencies);
    if (shouldUpdate) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for components using the new APIs.
        if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillUpdate === "function" || typeof instance.componentWillUpdate === "function")) {
            if (typeof instance.componentWillUpdate === "function") {
                instance.componentWillUpdate(newProps, newState, nextContext);
            }
            if (typeof instance.UNSAFE_componentWillUpdate === "function") {
                instance.UNSAFE_componentWillUpdate(newProps, newState, nextContext);
            }
        }
        if (typeof instance.componentDidUpdate === "function") {
            workInProgress.flags |= fiber_flags_1.FiberFlags.Update;
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function") {
            workInProgress.flags |= fiber_flags_1.FiberFlags.Snapshot;
        }
    }
    else {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidUpdate === "function") {
            if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
                workInProgress.flags |= fiber_flags_1.FiberFlags.Update;
            }
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function") {
            if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
                workInProgress.flags |= fiber_flags_1.FiberFlags.Snapshot;
            }
        }
        // If shouldComponentUpdate returned false, we should still update the
        // memoized props/state to indicate that this work can be reused.
        workInProgress.memoizedProps = newProps;
        workInProgress.memoizedState = newState;
    }
    // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.
    instance.props = newProps;
    instance.state = newState;
    instance.context = nextContext;
    return shouldUpdate;
}
exports.updateClassInstance = updateClassInstance;
