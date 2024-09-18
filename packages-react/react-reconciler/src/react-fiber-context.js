"use strict";
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
exports.findCurrentUnmaskedContext = exports.invalidateContextProvider = exports.pushContextProvider = exports.isContextProvider = exports.processChildContext = exports.pushTopLevelContextObject = exports.popTopLevelContextObject = exports.popContext = exports.hasContextChanged = exports.getMaskedContext = exports.cacheContext = exports.getUnmaskedContext = exports.emptyContextObject = void 0;
var check_prop_types_1 = require("@zenflux/react-shared/src/check-prop-types");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-stack");
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var warnedAboutMissingGetChildContext;
if (__DEV__) {
    warnedAboutMissingGetChildContext = {};
}
exports.emptyContextObject = {};
if (__DEV__) {
    Object.freeze(exports.emptyContextObject);
}
// A cursor to the current merged context object on the stack.
var contextStackCursor = (0, react_fiber_stack_1.createCursor)(exports.emptyContextObject);
// A cursor to a boolean indicating whether the context has changed.
var didPerformWorkStackCursor = (0, react_fiber_stack_1.createCursor)(false);
// Keep track of the previous context object that was on the stack.
// We use this to get access to the parent context after we have already
// pushed the next context provider, and now need to merge their contexts.
var previousContext = exports.emptyContextObject;
function getUnmaskedContext(workInProgress, Component, didPushOwnContextIfProvider) {
    if (react_feature_flags_1.disableLegacyContext) {
        return exports.emptyContextObject;
    }
    else {
        if (didPushOwnContextIfProvider && isContextProvider(Component)) {
            // If the fiber is a context provider itself, when we read its context
            // we may have already pushed its own child context on the stack. A context
            // provider should not "see" its own child context. Therefore we read the
            // previous (parent) context instead for a context provider.
            return previousContext;
        }
        return contextStackCursor.current;
    }
}
exports.getUnmaskedContext = getUnmaskedContext;
function cacheContext(workInProgress, unmaskedContext, maskedContext) {
    if (react_feature_flags_1.disableLegacyContext) {
        return;
    }
    else {
        var instance = workInProgress.stateNode;
        instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
        instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
    }
}
exports.cacheContext = cacheContext;
function getMaskedContext(workInProgress, unmaskedContext) {
    if (react_feature_flags_1.disableLegacyContext) {
        return exports.emptyContextObject;
    }
    else {
        var type = workInProgress.type;
        var contextTypes = type.contextTypes;
        if (!contextTypes) {
            return exports.emptyContextObject;
        }
        // Avoid recreating masked context unless unmasked context has changed.
        // Failing to do this will result in unnecessary calls to componentWillReceiveProps.
        // This may trigger infinite loops if componentWillReceiveProps calls setState.
        var instance = workInProgress.stateNode;
        if (instance && instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext) {
            return instance.__reactInternalMemoizedMaskedChildContext;
        }
        var context = {};
        for (var key in contextTypes) {
            context[key] = unmaskedContext[key];
        }
        if (__DEV__) {
            var name_1 = (0, react_get_component_name_from_fiber_1.default)(workInProgress) || "Unknown";
            (0, check_prop_types_1.default)(contextTypes, context, "context", name_1);
        }
        // Cache unmasked context so we can avoid recreating masked context unless necessary.
        // Context is created before the class component is instantiated so check for instance.
        if (instance) {
            cacheContext(workInProgress, unmaskedContext, context);
        }
        return context;
    }
}
exports.getMaskedContext = getMaskedContext;
function hasContextChanged() {
    if (react_feature_flags_1.disableLegacyContext) {
        return false;
    }
    else {
        return didPerformWorkStackCursor.current;
    }
}
exports.hasContextChanged = hasContextChanged;
function isContextProvider(type) {
    if (react_feature_flags_1.disableLegacyContext) {
        return false;
    }
    else {
        // @ts-ignore
        var childContextTypes = type.childContextTypes;
        return childContextTypes !== null && childContextTypes !== undefined;
    }
}
exports.isContextProvider = isContextProvider;
function popContext(fiber) {
    if (react_feature_flags_1.disableLegacyContext) {
        return;
    }
    else {
        (0, react_fiber_stack_1.pop)(didPerformWorkStackCursor, fiber);
        (0, react_fiber_stack_1.pop)(contextStackCursor, fiber);
    }
}
exports.popContext = popContext;
function popTopLevelContextObject(fiber) {
    if (react_feature_flags_1.disableLegacyContext) {
        return;
    }
    else {
        (0, react_fiber_stack_1.pop)(didPerformWorkStackCursor, fiber);
        (0, react_fiber_stack_1.pop)(contextStackCursor, fiber);
    }
}
exports.popTopLevelContextObject = popTopLevelContextObject;
function pushTopLevelContextObject(fiber, context, didChange) {
    if (react_feature_flags_1.disableLegacyContext) {
        return;
    }
    else {
        if (contextStackCursor.current !== exports.emptyContextObject) {
            throw new Error("Unexpected context found on stack. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
        (0, react_fiber_stack_1.push)(contextStackCursor, context, fiber);
        (0, react_fiber_stack_1.push)(didPerformWorkStackCursor, didChange, fiber);
    }
}
exports.pushTopLevelContextObject = pushTopLevelContextObject;
function processChildContext(fiber, type, parentContext) {
    if (react_feature_flags_1.disableLegacyContext) {
        return parentContext;
    }
    else {
        var instance = fiber.stateNode;
        var childContextTypes = type.childContextTypes;
        // TODO (bvaughn) Replace this behavior with an invariant() in the future.
        // It has only been added in Fiber to match the (unintentional) behavior in Stack.
        if (typeof instance.getChildContext !== "function") {
            if (__DEV__) {
                var componentName = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown";
                if (!warnedAboutMissingGetChildContext[componentName]) {
                    warnedAboutMissingGetChildContext[componentName] = true;
                    console.error("%s.childContextTypes is specified but there is no getChildContext() method " + "on the instance. You can either define getChildContext() on %s or remove " + "childContextTypes from it.", componentName, componentName);
                }
            }
            return parentContext;
        }
        var childContext = instance.getChildContext();
        for (var contextKey in childContext) {
            if (!(contextKey in childContextTypes)) {
                throw new Error("".concat((0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown", ".getChildContext(): key \"").concat(contextKey, "\" is not defined in childContextTypes."));
            }
        }
        if (__DEV__) {
            var name_2 = (0, react_get_component_name_from_fiber_1.default)(fiber) || "Unknown";
            (0, check_prop_types_1.default)(childContextTypes, childContext, "child context", name_2);
        }
        return __assign(__assign({}, parentContext), childContext);
    }
}
exports.processChildContext = processChildContext;
function pushContextProvider(workInProgress) {
    if (react_feature_flags_1.disableLegacyContext) {
        return false;
    }
    else {
        var instance = workInProgress.stateNode;
        // We push the context as early as possible to ensure stack integrity.
        // If the instance does not exist yet, we will push null at first,
        // and replace it on the stack later when invalidating the context.
        var memoizedMergedChildContext = instance && instance.__reactInternalMemoizedMergedChildContext || exports.emptyContextObject;
        // Remember the parent context so we can merge with it later.
        // Inherit the parent's did-perform-work value to avoid inadvertently blocking updates.
        previousContext = contextStackCursor.current;
        (0, react_fiber_stack_1.push)(contextStackCursor, memoizedMergedChildContext, workInProgress);
        (0, react_fiber_stack_1.push)(didPerformWorkStackCursor, didPerformWorkStackCursor.current, workInProgress);
        return true;
    }
}
exports.pushContextProvider = pushContextProvider;
function invalidateContextProvider(workInProgress, type, didChange) {
    if (react_feature_flags_1.disableLegacyContext) {
        return;
    }
    else {
        var instance = workInProgress.stateNode;
        if (!instance) {
            throw new Error("Expected to have an instance by this point. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
        if (didChange) {
            // Merge parent and own context.
            // Skip this if we're not updating due to sCU.
            // This avoids unnecessarily recomputing memoized values.
            var mergedContext = processChildContext(workInProgress, type, previousContext);
            instance.__reactInternalMemoizedMergedChildContext = mergedContext;
            // Replace the old (or empty) context with the new one.
            // It is important to unwind the context in the reverse order.
            (0, react_fiber_stack_1.pop)(didPerformWorkStackCursor, workInProgress);
            (0, react_fiber_stack_1.pop)(contextStackCursor, workInProgress);
            // Now push the new context and mark that it has changed.
            (0, react_fiber_stack_1.push)(contextStackCursor, mergedContext, workInProgress);
            (0, react_fiber_stack_1.push)(didPerformWorkStackCursor, didChange, workInProgress);
        }
        else {
            (0, react_fiber_stack_1.pop)(didPerformWorkStackCursor, workInProgress);
            (0, react_fiber_stack_1.push)(didPerformWorkStackCursor, didChange, workInProgress);
        }
    }
}
exports.invalidateContextProvider = invalidateContextProvider;
function findCurrentUnmaskedContext(fiber) {
    if (react_feature_flags_1.disableLegacyContext) {
        return exports.emptyContextObject;
    }
    else {
        // Currently this is only used with renderSubtreeIntoContainer; not sure if it
        // makes sense elsewhere
        if (!(0, react_fiber_tree_reflection_1.isFiberMounted)(fiber) || fiber.tag !== work_tags_1.WorkTag.ClassComponent) {
            throw new Error("Expected subtree parent to be a mounted class component. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
        var node = fiber;
        do {
            switch (node.tag) {
                case work_tags_1.WorkTag.HostRoot:
                    return node.stateNode.context;
                case work_tags_1.WorkTag.ClassComponent: {
                    var Component = node.type;
                    if (isContextProvider(Component)) {
                        return node.stateNode.__reactInternalMemoizedMergedChildContext;
                    }
                    break;
                }
            }
            // $FlowFixMe[incompatible-type] we bail out when we get a null
            node = node.return;
        } while (node !== null);
        throw new Error("Found unexpected detached subtree parent. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
}
exports.findCurrentUnmaskedContext = findCurrentUnmaskedContext;
