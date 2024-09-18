"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreControlledSelectState = exports.updateSelect = exports.initSelect = exports.validateSelectProps = void 0;
// TODO: direct imports like some-package/src/* are bad. Fix me.
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var ToStringValue_1 = require("@zenflux/react-dom-bindings/src/client/ToStringValue");
var didWarnValueDefaultValue;
if (__DEV__) {
    didWarnValueDefaultValue = false;
}
function getDeclarationErrorAddendum() {
    var ownerName = (0, react_current_fiber_1.getCurrentFiberOwnerNameInDevOrNull)();
    if (ownerName) {
        return "\n\nCheck the render method of `" + ownerName + "`.";
    }
    return "";
}
var valuePropNames = ["value", "defaultValue"];
/**
 * Validation function for `value` and `defaultValue`.
 */
function checkSelectPropTypes(props) {
    if (__DEV__) {
        for (var i = 0; i < valuePropNames.length; i++) {
            var propName = valuePropNames[i];
            if (props[propName] == null) {
                continue;
            }
            var propNameIsArray = Array.isArray(props[propName]);
            if (props.multiple && !propNameIsArray) {
                console.error("The `%s` prop supplied to <select> must be an array if " + "`multiple` is true.%s", propName, getDeclarationErrorAddendum());
            }
            else if (!props.multiple && propNameIsArray) {
                console.error("The `%s` prop supplied to <select> must be a scalar " + "value if `multiple` is false.%s", propName, getDeclarationErrorAddendum());
            }
        }
    }
}
function updateOptions(node, multiple, propValue, setDefaultSelected) {
    var options = node.options;
    if (multiple) {
        var selectedValues = propValue;
        var selectedValue = {};
        for (var i = 0; i < selectedValues.length; i++) {
            // Prefix to avoid chaos with special keys.
            selectedValue["$" + selectedValues[i]] = true;
        }
        for (var i = 0; i < options.length; i++) {
            var selected = selectedValue.hasOwnProperty("$" + options[i].value);
            if (options[i].selected !== selected) {
                options[i].selected = selected;
            }
            if (selected && setDefaultSelected) {
                options[i].defaultSelected = true;
            }
        }
    }
    else {
        // Do not set `select.value` as exact behavior isn't consistent across all
        // browsers for all cases.
        var selectedValue = (0, ToStringValue_1.toString)((0, ToStringValue_1.getToStringValue)(propValue));
        var defaultSelected = null;
        for (var i = 0; i < options.length; i++) {
            if (options[i].value === selectedValue) {
                options[i].selected = true;
                if (setDefaultSelected) {
                    options[i].defaultSelected = true;
                }
                return;
            }
            if (defaultSelected === null && !options[i].disabled) {
                defaultSelected = options[i];
            }
        }
        if (defaultSelected !== null) {
            defaultSelected.selected = true;
        }
    }
}
/**
 * Implements a <select> host component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * stringable. If `multiple` is true, the prop must be an array of stringables.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
function validateSelectProps(element, props) {
    if (__DEV__) {
        checkSelectPropTypes(props);
        if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValueDefaultValue) {
            console.error("Select elements must be either controlled or uncontrolled " + "(specify either the value prop, or the defaultValue prop, but not " + "both). Decide between using a controlled or uncontrolled select " + "element and remove one of these props. More info: " + "https://reactjs.org/link/controlled-components");
            didWarnValueDefaultValue = true;
        }
    }
}
exports.validateSelectProps = validateSelectProps;
function initSelect(element, value, defaultValue, multiple) {
    var node = element;
    node.multiple = !!multiple;
    if (value != null) {
        updateOptions(node, !!multiple, value, false);
    }
    else if (defaultValue != null) {
        updateOptions(node, !!multiple, defaultValue, true);
    }
}
exports.initSelect = initSelect;
function updateSelect(element, value, defaultValue, multiple, wasMultiple) {
    var node = element;
    if (value != null) {
        updateOptions(node, !!multiple, value, false);
    }
    else if (!!wasMultiple !== !!multiple) {
        // For simplicity, reapply `defaultValue` if `multiple` is toggled.
        if (defaultValue != null) {
            updateOptions(node, !!multiple, defaultValue, true);
        }
        else {
            // Revert the select back to its default unselected state.
            updateOptions(node, !!multiple, multiple ? [] : "", false);
        }
    }
}
exports.updateSelect = updateSelect;
function restoreControlledSelectState(element, props) {
    var node = element;
    var value = props.value;
    if (value != null) {
        updateOptions(node, !!props.multiple, value, false);
    }
}
exports.restoreControlledSelectState = restoreControlledSelectState;
