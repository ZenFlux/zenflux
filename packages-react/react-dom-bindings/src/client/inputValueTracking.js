"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopTracking = exports.updateValueIfChanged = exports.track = void 0;
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
function isCheckable(elem) {
    var type = elem.type;
    var nodeName = elem.nodeName;
    return nodeName && nodeName.toLowerCase() === "input" && (type === "checkbox" || type === "radio");
}
function getTracker(node) {
    return node._valueTracker;
}
function detachTracker(node) {
    node._valueTracker = null;
}
function getValueFromNode(node) {
    var value = "";
    if (!node) {
        return value;
    }
    if (isCheckable(node)) {
        value = node.checked ? "true" : "false";
    }
    else {
        value = node.value;
    }
    return value;
}
function trackValueOnNode(node) {
    var valueField = isCheckable(node) ? "checked" : "value";
    var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);
    if (__DEV__) {
        (0, check_string_coercion_1.checkFormFieldValueStringCoercion)(node[valueField]);
    }
    var currentValue = "" + node[valueField];
    // if someone has already defined a value or Safari, then bail
    // and don't track value will cause over reporting of changes,
    // but it's better then a hard failure
    // (needed for certain tests that spyOn input values and Safari)
    if (node.hasOwnProperty(valueField) || typeof descriptor === "undefined" || typeof descriptor.get !== "function" || typeof descriptor.set !== "function") {
        return;
    }
    var get = descriptor.get, set = descriptor.set;
    Object.defineProperty(node, valueField, {
        configurable: true,
        // $FlowFixMe[missing-this-annot]
        get: function () {
            return get.call(this);
        },
        // $FlowFixMe[missing-local-annot]
        // $FlowFixMe[missing-this-annot]
        set: function (value) {
            if (__DEV__) {
                (0, check_string_coercion_1.checkFormFieldValueStringCoercion)(value);
            }
            currentValue = "" + value;
            set.call(this, value);
        }
    });
    // We could've passed this the first time
    // but it triggers a bug in IE11 and Edge 14/15.
    // Calling defineProperty() again should be equivalent.
    // https://github.com/facebook/react/issues/11768
    Object.defineProperty(node, valueField, {
        enumerable: descriptor.enumerable
    });
    var tracker = {
        getValue: function () {
            return currentValue;
        },
        setValue: function (value) {
            if (__DEV__) {
                (0, check_string_coercion_1.checkFormFieldValueStringCoercion)(value);
            }
            currentValue = "" + value;
        },
        stopTracking: function () {
            detachTracker(node);
            delete node[valueField];
        }
    };
    return tracker;
}
function track(node) {
    if (getTracker(node)) {
        return;
    }
    node._valueTracker = trackValueOnNode(node);
}
exports.track = track;
function updateValueIfChanged(node) {
    if (!node) {
        return false;
    }
    var tracker = getTracker(node);
    // if there is no tracker at this point it's unlikely
    // that trying again will succeed
    if (!tracker) {
        return true;
    }
    var lastValue = tracker.getValue();
    var nextValue = getValueFromNode(node);
    if (nextValue !== lastValue) {
        tracker.setValue(nextValue);
        return true;
    }
    return false;
}
exports.updateValueIfChanged = updateValueIfChanged;
function stopTracking(node) {
    var tracker = getTracker(node);
    if (tracker) {
        tracker.stopTracking();
    }
}
exports.stopTracking = stopTracking;
