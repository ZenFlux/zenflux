"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidElement = exports.cloneElement = exports.cloneAndReplaceKey = exports.createFactory = exports.createElement = exports.jsxDEV = exports.jsx = void 0;
/* Taken from packages/react */
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var get_component_name_from_type_1 = require("@zenflux/react-shared/src/get-component-name-from-type");
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var ReactCurrentOwner = react_shared_internals_1.default.ReactCurrentOwner;
var RESERVED_PROPS = {
    key: true,
    ref: true,
    __self: true,
    __source: true,
};
var specialPropKeyWarningShown;
var specialPropRefWarningShown;
var didWarnAboutStringRefs;
if (__DEV__) {
    didWarnAboutStringRefs = {};
}
function hasValidRef(config) {
    var _a;
    if (__DEV__) {
        if (Object.hasOwnProperty.call(config, "ref")) {
            var getter = (_a = Object.getOwnPropertyDescriptor(config, "ref")) === null || _a === void 0 ? void 0 : _a.get;
            if (getter && getter.isReactWarning) {
                return false;
            }
        }
    }
    return config.ref !== undefined;
}
function hasValidKey(config) {
    var _a;
    if (__DEV__) {
        if (Object.hasOwnProperty.call(config, "key")) {
            var getter = (_a = Object.getOwnPropertyDescriptor(config, "key")) === null || _a === void 0 ? void 0 : _a.get;
            if (getter && getter.isReactWarning) {
                return false;
            }
        }
    }
    return config.key !== undefined;
}
function defineKeyPropWarningGetter(props, displayName) {
    var warnAboutAccessingKey = function () {
        if (__DEV__) {
            if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                console.error("%s: `key` is not a prop. Trying to access it will result " +
                    "in `undefined` being returned. If you need to access the same " +
                    "value within the child component, you should pass it as a different " +
                    "prop. (https://reactjs.org/link/special-props)", displayName);
            }
        }
    };
    warnAboutAccessingKey.isReactWarning = true;
    Object.defineProperty(props, "key", {
        get: warnAboutAccessingKey,
        configurable: true,
    });
}
function defineRefPropWarningGetter(props, displayName) {
    var warnAboutAccessingRef = function () {
        if (__DEV__) {
            if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                console.error("%s: `ref` is not a prop. Trying to access it will result " +
                    "in `undefined` being returned. If you need to access the same " +
                    "value within the child component, you should pass it as a different " +
                    "prop. (https://reactjs.org/link/special-props)", displayName);
            }
        }
    };
    warnAboutAccessingRef.isReactWarning = true;
    Object.defineProperty(props, "ref", {
        get: warnAboutAccessingRef,
        configurable: true,
    });
}
function warnIfStringRefCannotBeAutoConverted(config) {
    if (__DEV__) {
        if (typeof config.ref === "string" &&
            ReactCurrentOwner.current &&
            config.__self &&
            ReactCurrentOwner.current.stateNode !== config.__self) {
            var componentName = (0, get_component_name_from_type_1.default)(ReactCurrentOwner.current.type);
            if (null === componentName) {
                throw new Error("getComponentNameFromType can't find a component's name in the current context.");
            }
            if (!didWarnAboutStringRefs[componentName]) {
                console.error("Component \"%s\" contains the string ref \"%s\". " +
                    "Support for string refs will be removed in a future major release. " +
                    "This case cannot be automatically converted to an arrow function. " +
                    "We ask you to manually fix this case by using useRef() or createRef() instead. " +
                    "Learn more about using refs safely here: " +
                    "https://reactjs.org/link/strict-mode-string-ref", componentName, config.ref);
                didWarnAboutStringRefs[componentName] = true;
            }
        }
    }
}
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @internal
 */
function ReactElement(type, key, ref, self, source, owner, props) {
    var element = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: react_symbols_1.REACT_ELEMENT_TYPE,
        // Built-in properties that belong on the element
        type: type,
        key: key,
        ref: ref,
        props: props,
        // Record the component responsible for creating this element.
        _owner: owner,
    };
    if (__DEV__) {
        // The validation flag is currently mutative. We put it on
        // an external backing store so that we can freeze the whole object.
        // This can be replaced with a WeakMap once they are implemented in
        // commonly used development environments.
        element._store = {};
        // To make comparing ReactElements easier for testing purposes, we make
        // the validation flag non-enumerable (where possible, which should
        // include every environment we run tests in), so the test framework
        // ignores it.
        Object.defineProperty(element._store, "validated", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: false,
        });
        // self and source are DEV only properties.
        Object.defineProperty(element, "_self", {
            configurable: false,
            enumerable: false,
            writable: false,
            value: self,
        });
        // Two elements created in two different places should be considered
        // equal for testing purposes and therefore we hide it from enumeration.
        Object.defineProperty(element, "_source", {
            configurable: false,
            enumerable: false,
            writable: false,
            value: source,
        });
        if (Object.freeze) {
            Object.freeze(element.props);
            Object.freeze(element);
        }
    }
    return element;
}
/**
 * https://github.com/reactjs/rfcs/pull/107
 */
function jsx(type, config, maybeKey) {
    var propName;
    // Reserved names are extracted
    var props = {};
    var key = null;
    var ref = null;
    // Currently, key can be spread in as a prop. This causes a potential
    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
    // but as an intermediary step, we will use jsxDEV for everything except
    // <div {...props} key="Hi" />, because we aren't currently able to tell if
    // key is explicitly declared to be undefined or not.
    if (maybeKey !== undefined) {
        if (__DEV__) {
            (0, check_string_coercion_1.checkKeyStringCoercion)(maybeKey);
        }
        key = "" + maybeKey;
    }
    if (hasValidKey(config)) {
        if (__DEV__) {
            (0, check_string_coercion_1.checkKeyStringCoercion)(config.key);
        }
        key = "" + config.key;
    }
    if (hasValidRef(config)) {
        ref = config.ref;
    }
    // Remaining properties are added to a new props object
    for (propName in config) {
        if (Object.hasOwnProperty.call(config, propName) &&
            !RESERVED_PROPS.hasOwnProperty(propName)) {
            props[propName] = config[propName];
        }
    }
    // Resolve default props
    if (type && type.defaultProps) {
        var defaultProps = type.defaultProps;
        for (propName in defaultProps) {
            if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    return ReactElement(type, key, ref, undefined, undefined, ReactCurrentOwner.current, props);
}
exports.jsx = jsx;
/**
 * https://github.com/reactjs/rfcs/pull/107
 */
function jsxDEV(type, config, maybeKey, source, self) {
    var propName;
    // Reserved names are extracted
    var props = {};
    var key = null;
    var ref = null;
    // Currently, key can be spread in as a prop. This causes a potential
    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
    // but as an intermediary step, we will use jsxDEV for everything except
    // <div {...props} key="Hi" />, because we aren't currently able to tell if
    // key is explicitly declared to be undefined or not.
    if (maybeKey !== undefined) {
        if (__DEV__) {
            (0, check_string_coercion_1.checkKeyStringCoercion)(maybeKey);
        }
        key = "" + maybeKey;
    }
    if (hasValidKey(config)) {
        if (__DEV__) {
            (0, check_string_coercion_1.checkKeyStringCoercion)(config.key);
        }
        key = "" + config.key;
    }
    if (hasValidRef(config)) {
        ref = config.ref;
        warnIfStringRefCannotBeAutoConverted(config);
    }
    // Remaining properties are added to a new props object
    for (propName in config) {
        if (Object.hasOwnProperty.call(config, propName) &&
            !RESERVED_PROPS.hasOwnProperty(propName)) {
            props[propName] = config[propName];
        }
    }
    // Resolve default props
    if (type && type.defaultProps) {
        var defaultProps = type.defaultProps;
        for (propName in defaultProps) {
            if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    if (key || ref) {
        var displayName = typeof type === "function"
            ? type.displayName || type.name || "Unknown"
            : type;
        if (key) {
            defineKeyPropWarningGetter(props, displayName);
        }
        if (ref) {
            defineRefPropWarningGetter(props, displayName);
        }
    }
    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}
exports.jsxDEV = jsxDEV;
/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */
function createElement(type, config, children) {
    var propName;
    // Reserved names are extracted
    var props = {};
    var key = null;
    var ref = null;
    var self = null;
    var source = null;
    if (config != null) {
        if (hasValidRef(config)) {
            ref = config.ref;
            if (__DEV__) {
                warnIfStringRefCannotBeAutoConverted(config);
            }
        }
        if (hasValidKey(config)) {
            if (__DEV__) {
                (0, check_string_coercion_1.checkKeyStringCoercion)(config.key);
            }
            key = "" + config.key;
        }
        self = config.__self === undefined ? null : config.__self;
        source = config.__source === undefined ? null : config.__source;
        // Remaining properties are added to a new props object
        for (propName in config) {
            if (Object.hasOwnProperty.call(config, propName) &&
                !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
            }
        }
    }
    // Children can be more than one argument, and those are transferred onto
    // the newly allocated props object.
    var childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
        props.children = children;
    }
    else if (childrenLength > 1) {
        var childArray = Array(childrenLength);
        for (var i = 0; i < childrenLength; i++) {
            childArray[i] = arguments[i + 2];
        }
        if (__DEV__) {
            if (Object.freeze) {
                Object.freeze(childArray);
            }
        }
        props.children = childArray;
    }
    // Resolve default props
    if (type && type.defaultProps) {
        var defaultProps = type.defaultProps;
        for (propName in defaultProps) {
            if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    if (__DEV__) {
        if (key || ref) {
            var displayName = typeof type === "function"
                ? type.displayName || type.name || "Unknown"
                : type;
            if (key) {
                defineKeyPropWarningGetter(props, displayName);
            }
            if (ref) {
                defineRefPropWarningGetter(props, displayName);
            }
        }
    }
    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}
exports.createElement = createElement;
/**
 * Return a function that produces ReactElements of a given type.
 * See https://reactjs.org/docs/react-api.html#createfactory
 */
function createFactory(type) {
    var factory = createElement.bind(null, type);
    // Expose the type on the factory and the prototype so that it can be
    // easily accessed on elements. E.g. `<Foo />.type === Foo`.
    // This should not be named `constructor` since this may not be the function
    // that created the element, and it may not even be a constructor.
    // Legacy hook: remove it
    factory.type = type;
    return factory;
}
exports.createFactory = createFactory;
function cloneAndReplaceKey(oldElement, newKey) {
    return ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
}
exports.cloneAndReplaceKey = cloneAndReplaceKey;
/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */
function cloneElement(element, config, children) {
    if (element === null || element === undefined) {
        throw new Error("React.cloneElement(...): The argument must be a React element, but you passed ".concat(element, "."));
    }
    var propName;
    // Original props are copied
    var props = Object.assign({}, element.props);
    // Reserved names are extracted
    var key = element.key;
    var ref = element.ref;
    // Self is preserved since the owner is preserved.
    var self = element._self;
    // Source is preserved since cloneElement is unlikely to be targeted by a
    // transpiler, and the original source is probably a better indicator of the
    // true owner.
    var source = element._source;
    // Owner will be preserved, unless ref is overridden
    var owner = element._owner;
    if (config != null) {
        if (hasValidRef(config)) {
            // Silently steal the ref from the parent.
            ref = config.ref;
            owner = ReactCurrentOwner.current;
        }
        if (hasValidKey(config)) {
            if (__DEV__) {
                (0, check_string_coercion_1.checkKeyStringCoercion)(config.key);
            }
            key = "" + config.key;
        }
        // Remaining properties override existing props
        var defaultProps = void 0;
        if (element.type && element.type.defaultProps) {
            defaultProps = element.type.defaultProps;
        }
        for (propName in config) {
            if (Object.hasOwnProperty.call(config, propName) &&
                !RESERVED_PROPS.hasOwnProperty(propName)) {
                if (config[propName] === undefined && defaultProps !== undefined) {
                    // Resolve default props
                    props[propName] = defaultProps[propName];
                }
                else {
                    props[propName] = config[propName];
                }
            }
        }
    }
    // Children can be more than one argument, and those are transferred onto
    // the newly allocated props object.
    var childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
        props.children = children;
    }
    else if (childrenLength > 1) {
        var childArray = Array(childrenLength);
        for (var i = 0; i < childrenLength; i++) {
            childArray[i] = arguments[i + 2];
        }
        props.children = childArray;
    }
    return ReactElement(element.type, key, ref, self, source, owner, props);
}
exports.cloneElement = cloneElement;
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 */
function isValidElement(object) {
    return (typeof object === "object" &&
        object !== null &&
        object.$$typeof === react_symbols_1.REACT_ELEMENT_TYPE);
}
exports.isValidElement = isValidElement;
