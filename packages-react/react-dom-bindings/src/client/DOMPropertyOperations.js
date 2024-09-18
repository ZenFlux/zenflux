"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setValueForPropertyOnCustomComponent = exports.setValueForNamespacedAttribute = exports.setValueForKnownAttribute = exports.setValueForAttribute = exports.getValueForAttributeOnCustomComponent = exports.getValueForAttribute = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var isAttributeNameSafe_1 = require("@zenflux/react-dom-bindings/src/shared/isAttributeNameSafe");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
/**
 * Get the value for a attribute on a node. Only used in DEV for SSR validation.
 * The third argument is used as a hint of what the expected value is. Some
 * attributes have multiple equivalent values.
 */
function getValueForAttribute(node, name, expected) {
    if (__DEV__) {
        if (!(0, isAttributeNameSafe_1.default)(name)) {
            return;
        }
        if (!node.hasAttribute(name)) {
            // shouldRemoveAttribute
            switch (typeof expected) {
                case "function":
                case "symbol":
                    // eslint-disable-line
                    return expected;
                case "boolean": {
                    var prefix = name.toLowerCase().slice(0, 5);
                    if (prefix !== "data-" && prefix !== "aria-") {
                        return expected;
                    }
                }
            }
            return expected === undefined ? undefined : null;
        }
        var value = node.getAttribute(name);
        if (__DEV__) {
            (0, check_string_coercion_1.checkAttributeStringCoercion)(expected, name);
        }
        if (value === "" + expected) {
            return expected;
        }
        return value;
    }
}
exports.getValueForAttribute = getValueForAttribute;
function getValueForAttributeOnCustomComponent(node, name, expected) {
    if (__DEV__) {
        if (!(0, isAttributeNameSafe_1.default)(name)) {
            return;
        }
        if (!node.hasAttribute(name)) {
            // shouldRemoveAttribute
            switch (typeof expected) {
                case "symbol":
                case "object":
                    // Symbols and objects are ignored when they're emitted so
                    // it would be expected that they end up not having an attribute.
                    return expected;
                case "function":
                    if (react_feature_flags_1.enableCustomElementPropertySupport) {
                        return expected;
                    }
                    break;
                case "boolean":
                    if (react_feature_flags_1.enableCustomElementPropertySupport) {
                        if (expected === false) {
                            return expected;
                        }
                    }
            }
            return expected === undefined ? undefined : null;
        }
        var value = node.getAttribute(name);
        if (react_feature_flags_1.enableCustomElementPropertySupport) {
            if (value === "" && expected === true) {
                return true;
            }
        }
        if (__DEV__) {
            (0, check_string_coercion_1.checkAttributeStringCoercion)(expected, name);
        }
        if (value === "" + expected) {
            return expected;
        }
        return value;
    }
}
exports.getValueForAttributeOnCustomComponent = getValueForAttributeOnCustomComponent;
function setValueForAttribute(node, name, value) {
    if ((0, isAttributeNameSafe_1.default)(name)) {
        // If the prop isn't in the special list, treat it as a simple attribute.
        // shouldRemoveAttribute
        if (value === null) {
            node.removeAttribute(name);
            return;
        }
        switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
                // eslint-disable-line
                node.removeAttribute(name);
                return;
            case "boolean": {
                var prefix = name.toLowerCase().slice(0, 5);
                if (prefix !== "data-" && prefix !== "aria-") {
                    node.removeAttribute(name);
                    return;
                }
            }
        }
        if (__DEV__) {
            (0, check_string_coercion_1.checkAttributeStringCoercion)(value, name);
        }
        node.setAttribute(name, react_feature_flags_1.enableTrustedTypesIntegration ? value : "" + value);
    }
}
exports.setValueForAttribute = setValueForAttribute;
function setValueForKnownAttribute(node, name, value) {
    if (value === null) {
        node.removeAttribute(name);
        return;
    }
    switch (typeof value) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean": {
            node.removeAttribute(name);
            return;
        }
    }
    if (__DEV__) {
        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, name);
    }
    node.setAttribute(name, react_feature_flags_1.enableTrustedTypesIntegration ? value : "" + value);
}
exports.setValueForKnownAttribute = setValueForKnownAttribute;
function setValueForNamespacedAttribute(node, namespace, name, value) {
    if (value === null) {
        node.removeAttribute(name);
        return;
    }
    switch (typeof value) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean": {
            node.removeAttribute(name);
            return;
        }
    }
    if (__DEV__) {
        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, name);
    }
    node.setAttributeNS(namespace, name, react_feature_flags_1.enableTrustedTypesIntegration ? value : "" + value);
}
exports.setValueForNamespacedAttribute = setValueForNamespacedAttribute;
function setValueForPropertyOnCustomComponent(node, name, value) {
    if (name[0] === "o" && name[1] === "n") {
        var useCapture = name.endsWith("Capture");
        var eventName = name.slice(2, useCapture ? name.length - 7 : undefined);
        var prevProps = (0, ReactDOMComponentTree_1.getFiberCurrentPropsFromNode)(node);
        var prevValue = prevProps != null ? prevProps[name] : null;
        if (typeof prevValue === "function") {
            node.removeEventListener(eventName, prevValue, useCapture);
        }
        if (typeof value === "function") {
            if (typeof prevValue !== "function" && prevValue !== null) {
                // If we previously assigned a non-function type into this node, then
                // remove it when switching to event listener mode.
                if (name in node) {
                    node[name] = null;
                }
                else if (node.hasAttribute(name)) {
                    node.removeAttribute(name);
                }
            }
            // $FlowFixMe[incompatible-cast] value can't be casted to EventListener.
            node.addEventListener(eventName, value, useCapture);
            return;
        }
    }
    if (name in node) {
        node[name] = value;
        return;
    }
    if (value === true) {
        node.setAttribute(name, "");
        return;
    }
    // From here, it's the same as any attribute
    setValueForAttribute(node, name, value);
}
exports.setValueForPropertyOnCustomComponent = setValueForPropertyOnCustomComponent;
