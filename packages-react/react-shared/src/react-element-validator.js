"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneElementWithValidation = exports.createFactoryWithValidation = exports.createElementWithValidation = exports.jsxWithValidation = void 0;
/* At runtime, React uses these symbols to attach some information to objects.
 * We use them at compile time too, to help you catch errors. */
/* Taken from packages/react */
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_is_valid_element_type_1 = require("@zenflux/react-shared/src/react-is-valid-element-type");
var get_component_name_from_type_1 = require("@zenflux/react-shared/src/get-component-name-from-type");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var check_prop_types_1 = require("@zenflux/react-shared/src/check-prop-types");
var react_element_1 = require("@zenflux/react-shared/src/react-element");
var react_component_stack_frame_1 = require("@zenflux/react-shared/src/react-component-stack-frame");
var REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
var ReactCurrentOwner = react_shared_internals_1.default.ReactCurrentOwner, ReactDebugCurrentFrame = react_shared_internals_1.default.ReactDebugCurrentFrame;
function setCurrentlyValidatingElement(element) {
    if (process.env.NODE_ENV !== "production") {
        if (element) {
            var owner = element._owner;
            var stack = (0, react_component_stack_frame_1.describeUnknownElementTypeFrameInDEV)(element.type, element._source, owner ? owner.type : null);
            ReactDebugCurrentFrame.setExtraStackFrame(stack);
        }
        else {
            ReactDebugCurrentFrame.setExtraStackFrame(null);
        }
    }
}
var propTypesMisspellWarningShown;
if (process.env.NODE_ENV !== "production") {
    propTypesMisspellWarningShown = false;
}
function getDeclarationErrorAddendum() {
    if (ReactCurrentOwner.current) {
        var name_1 = (0, get_component_name_from_type_1.default)(ReactCurrentOwner.current.type);
        if (name_1) {
            return "\n\nCheck the render method of `" + name_1 + "`.";
        }
    }
    return "";
}
function getSourceInfoErrorAddendum(source) {
    if (source !== undefined) {
        var fileName = source.fileName.replace(/^.*[\\\/]/, "");
        var lineNumber = source.lineNumber;
        return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
    }
    return "";
}
function getSourceInfoErrorAddendumForProps(elementProps) {
    if (elementProps !== null && elementProps !== undefined) {
        return getSourceInfoErrorAddendum(elementProps.__source);
    }
    return "";
}
/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {};
function getCurrentComponentErrorInfo(parentType) {
    var info = getDeclarationErrorAddendum();
    if (!info) {
        var parentName = typeof parentType === "string"
            ? parentType
            : parentType.displayName || parentType.name;
        if (parentName) {
            info = "\n\nCheck the top-level render call using <".concat(parentName, ">.");
        }
    }
    return info;
}
/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validateExplicitKey(element, parentType) {
    if (!element._store || element._store.validated || element.key != null) {
        return;
    }
    element._store.validated = true;
    var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
        return;
    }
    ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
    // Usually the current owner is the offender, but if it accepts children as a
    // property, it may be the creator of the child that's responsible for
    // assigning it a key.
    var childOwner = "";
    if (element &&
        element._owner &&
        element._owner !== ReactCurrentOwner.current) {
        // Give the component that originally created this child.
        childOwner = " It was passed a child from ".concat((0, get_component_name_from_type_1.default)(element._owner.type), ".");
    }
    if (process.env.NODE_ENV !== "production") {
        setCurrentlyValidatingElement(element);
        console.error("Each child in a list should have a unique \"key\" prop." +
            "%s%s See https://reactjs.org/link/warning-keys for more information.", currentComponentErrorInfo, childOwner);
        setCurrentlyValidatingElement(null);
    }
}
/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
function validateChildKeys(node, parentType) {
    if (typeof node !== "object" || !node) {
        return;
    }
    if (node.$$typeof === REACT_CLIENT_REFERENCE) {
        // This is a reference to a client component so it's unknown.
    }
    else if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) {
            var child = node[i];
            if ((0, react_element_1.isValidElement)(child)) {
                validateExplicitKey(child, parentType);
            }
        }
    }
    else if ((0, react_element_1.isValidElement)(node)) {
        // This element was passed in a valid location.
        if (node._store) {
            node._store.validated = true;
        }
    }
    else {
        var iteratorFn = (0, react_symbols_1.getIteratorFn)(node);
        if (typeof iteratorFn === "function") {
            // Entry iterators used to provide implicit keys,
            // but now we print a separate warning for them later.
            if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step = void 0;
                while (!(step = iterator.next()).done) {
                    if ((0, react_element_1.isValidElement)(step.value)) {
                        validateExplicitKey(step.value, parentType);
                    }
                }
            }
        }
    }
}
/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */
function validatePropTypes(element) {
    if (process.env.NODE_ENV !== "production") {
        var type = element.type;
        if (type === null || type === undefined || typeof type === "string") {
            return;
        }
        if (type.$$typeof === REACT_CLIENT_REFERENCE) {
            return;
        }
        var propTypes = void 0;
        if (typeof type === "function") {
            propTypes = type.propTypes;
        }
        else if (typeof type === "object" &&
            (type.$$typeof === react_symbols_1.REACT_FORWARD_REF_TYPE ||
                // Note: Memo only checks outer props here.
                // Inner props are checked in the reconciler.
                type.$$typeof === react_symbols_1.REACT_MEMO_TYPE)) {
            propTypes = type.propTypes;
        }
        else {
            return;
        }
        if (propTypes) {
            // Intentionally inside to avoid triggering lazy initializers:
            var name_2 = (0, get_component_name_from_type_1.default)(type);
            (0, check_prop_types_1.default)(propTypes, element.props, "prop", name_2, element);
        }
        else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
            propTypesMisspellWarningShown = true;
            // Intentionally inside to avoid triggering lazy initializers:
            var name_3 = (0, get_component_name_from_type_1.default)(type);
            console.error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", name_3 || "Unknown");
        }
        if (typeof type.getDefaultProps === "function" &&
            !type.getDefaultProps.isReactClassApproved) {
            console.error("getDefaultProps is only used on classic React.createClass " +
                "definitions. Use a static property named `defaultProps` instead.");
        }
    }
}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */
function validateFragmentProps(fragment) {
    if (process.env.NODE_ENV !== "production") {
        var keys = Object.keys(fragment.props);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement(fragment);
                console.error("Invalid prop `%s` supplied to `React.Fragment`. " +
                    "React.Fragment can only have `key` and `children` props.", key);
                setCurrentlyValidatingElement(null);
                break;
            }
        }
        if (fragment.ref !== null) {
            setCurrentlyValidatingElement(fragment);
            console.error("Invalid attribute `ref` supplied to `React.Fragment`.");
            setCurrentlyValidatingElement(null);
        }
    }
}
var didWarnAboutKeySpread = {};
function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
    if (process.env.NODE_ENV !== "production") {
        var validType = (0, react_is_valid_element_type_1.default)(type);
        // We warn in this case but don't throw. We expect the element creation to
        // succeed and there will likely be errors in render.
        if (!validType) {
            var info = "";
            if (type === undefined ||
                (typeof type === "object" &&
                    type !== null &&
                    Object.keys(type).length === 0)) {
                info +=
                    " You likely forgot to export your component from the file " +
                        "it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendum(source);
            if (sourceInfo) {
                info += sourceInfo;
            }
            else {
                info += getDeclarationErrorAddendum();
            }
            var typeString = void 0;
            if (type === null) {
                typeString = "null";
            }
            else if (Array.isArray(type)) {
                typeString = "array";
            }
            else if (type !== undefined && type.$$typeof === react_symbols_1.REACT_ELEMENT_TYPE) {
                typeString = "<".concat((0, get_component_name_from_type_1.default)(type.type) || "Unknown", " />");
                info =
                    " Did you accidentally export a JSX literal instead of a component?";
            }
            else {
                typeString = typeof type;
            }
            if (process.env.NODE_ENV !== "production") {
                console.error("React.jsx: type is invalid -- expected a string (for " +
                    "built-in components) or a class/function (for composite " +
                    "components) but got: %s.%s", typeString, info);
            }
        }
        var element = (0, react_element_1.jsxDEV)(type, props, key, source, self);
        // The result can be nullish if a mock or a custom function is used.
        // TODO: Drop this when these are no longer allowed as the type argument.
        if (element == null) {
            return element;
        }
        // Skip key warning if the type isn't valid since our key validation logic
        // doesn't expect a non-string/function type and can throw confusing errors.
        // We don't want exception behavior to differ between dev and prod.
        // (Rendering will throw with a helpful message and as soon as the type is
        // fixed, the key warnings will appear.)
        if (validType) {
            var children = props.children;
            if (children !== undefined) {
                if (isStaticChildren) {
                    if (Array.isArray(children)) {
                        for (var i = 0; i < children.length; i++) {
                            validateChildKeys(children[i], type);
                        }
                        if (Object.freeze) {
                            Object.freeze(children);
                        }
                    }
                    else {
                        console.error("React.jsx: Static children should always be an array. " +
                            "You are likely explicitly calling React.jsxs or React.jsxDEV. " +
                            "Use the Babel transform instead.");
                    }
                }
                else {
                    validateChildKeys(children, type);
                }
            }
        }
        if (Object.prototype.hasOwnProperty.call(props, "key")) {
            var componentName = (0, get_component_name_from_type_1.default)(type);
            var keys = Object.keys(props).filter(function (k) { return k !== "key"; });
            var beforeExample = keys.length > 0
                ? "{key: someKey, " + keys.join(": ..., ") + ": ...}"
                : "{key: someKey}";
            if (!didWarnAboutKeySpread[componentName + beforeExample]) {
                var afterExample = keys.length > 0 ? "{" + keys.join(": ..., ") + ": ...}" : "{}";
                console.error("A props object containing a \"key\" prop is being spread into JSX:\n" +
                    "  let props = %s;\n" +
                    "  <%s {...props} />\n" +
                    "React keys must be passed directly to JSX without using spread:\n" +
                    "  let props = %s;\n" +
                    "  <%s key={someKey} {...props} />", beforeExample, componentName, afterExample, componentName);
                didWarnAboutKeySpread[componentName + beforeExample] = true;
            }
        }
        if (type === react_symbols_1.REACT_FRAGMENT_TYPE) {
            validateFragmentProps(element);
        }
        else {
            validatePropTypes(element);
        }
        return element;
    }
}
exports.jsxWithValidation = jsxWithValidation;
// These two functions exist to still get child warnings in dev
// even with the prod transform. This means that jsxDEV is purely
// opt-in behavior for better messages but that we won't stop
// giving you warnings if you use production apis.
// export function jsxWithValidationStatic( type: any, props: any, key: any ) {
//     return jsxWithValidation( type, props, key, true );
// }
//
// export function jsxWithValidationDynamic( type: any, props: any, key: any ) {
//     return jsxWithValidation( type, props, key, false );
// }
function createElementWithValidation(type, props, children) {
    var validType = (0, react_is_valid_element_type_1.default)(type);
    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    if (!validType) {
        var info = "";
        if (type === undefined ||
            (typeof type === "object" &&
                type !== null &&
                Object.keys(type).length === 0)) {
            info +=
                " You likely forgot to export your component from the file " +
                    "it's defined in, or you might have mixed up default and named imports.";
        }
        var sourceInfo = getSourceInfoErrorAddendumForProps(props);
        if (sourceInfo) {
            info += sourceInfo;
        }
        else {
            info += getDeclarationErrorAddendum();
        }
        var typeString = void 0;
        if (type === null) {
            typeString = "null";
        }
        else if (Array.isArray(type)) {
            typeString = "array";
        }
        else if (type !== undefined && type.$$typeof === react_symbols_1.REACT_ELEMENT_TYPE) {
            typeString = "<".concat((0, get_component_name_from_type_1.default)(type.type) || "Unknown", " />");
            info =
                " Did you accidentally export a JSX literal instead of a component?";
        }
        else {
            typeString = typeof type;
        }
        if (process.env.NODE_ENV !== "production") {
            console.error("React.createElement: type is invalid -- expected a string (for " +
                "built-in components) or a class/function (for composite " +
                "components) but got: %s.%s", typeString, info);
        }
    }
    var element = react_element_1.createElement.apply(this, arguments);
    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
        return element;
    }
    // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)
    if (validType) {
        for (var i = 2; i < arguments.length; i++) {
            validateChildKeys(arguments[i], type);
        }
    }
    if (type === react_symbols_1.REACT_FRAGMENT_TYPE) {
        validateFragmentProps(element);
    }
    else {
        validatePropTypes(element);
    }
    return element;
}
exports.createElementWithValidation = createElementWithValidation;
var didWarnAboutDeprecatedCreateFactory = false;
function createFactoryWithValidation(type) {
    var validatedFactory = createElementWithValidation(type);
    validatedFactory.type = type;
    if (process.env.NODE_ENV !== "production") {
        if (!didWarnAboutDeprecatedCreateFactory) {
            didWarnAboutDeprecatedCreateFactory = true;
            console.warn("React.createFactory() is deprecated and will be removed in " +
                "a future major release. Consider using JSX " +
                "or use React.createElement() directly instead.");
        }
        // Legacy hook: remove it
        Object.defineProperty(validatedFactory, "type", {
            enumerable: false,
            get: function () {
                console.warn("Factory.type is deprecated. Access the class directly " +
                    "before passing it to createFactory.");
                Object.defineProperty(this, "type", {
                    value: type,
                });
                return type;
            },
        });
    }
    return validatedFactory;
}
exports.createFactoryWithValidation = createFactoryWithValidation;
function cloneElementWithValidation(element, props, children) {
    var newElement = react_element_1.cloneElement.apply(this, arguments);
    for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], newElement.type);
    }
    validatePropTypes(newElement);
    return newElement;
}
exports.cloneElementWithValidation = cloneElementWithValidation;
