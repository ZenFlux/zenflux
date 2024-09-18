"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeObjectForErrorMessage = exports.describeValueForErrorMessage = exports.objectName = exports.isSimpleObject = exports.jsxChildrenParents = exports.jsxPropsParents = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactSerializationErrors.js
 */
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
// Used for DEV messages to keep track of which parent rendered some props,
// in case they error.
exports.jsxPropsParents = new WeakMap();
exports.jsxChildrenParents = new WeakMap();
function isObjectPrototype(object) {
    if (!object) {
        return false;
    }
    var ObjectPrototype = Object.prototype;
    if (object === ObjectPrototype) {
        return true;
    }
    // It might be an object from a different Realm which is
    // still just a plain simple object.
    if (Object.getPrototypeOf(object)) {
        return false;
    }
    var names = Object.getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
        if (!(names[i] in ObjectPrototype)) {
            return false;
        }
    }
    return true;
}
function isSimpleObject(object) {
    if (!isObjectPrototype(Object.getPrototypeOf(object))) {
        return false;
    }
    var names = Object.getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
        var descriptor = Object.getOwnPropertyDescriptor(object, names[i]);
        if (!descriptor) {
            return false;
        }
        if (!descriptor.enumerable) {
            if ((names[i] === "key" || names[i] === "ref") && typeof descriptor.get === "function") {
                // React adds key and ref getters to props objects to issue warnings.
                // Those getters will not be transferred to the client, but that's ok,
                // so we'll special case them.
                continue;
            }
            return false;
        }
    }
    return true;
}
exports.isSimpleObject = isSimpleObject;
function objectName(object) {
    var name = Object.prototype.toString.call(object);
    return name.replace(/^\[object (.*)\]$/, function (m, p0) {
        return p0;
    });
}
exports.objectName = objectName;
function describeKeyForErrorMessage(key) {
    var encodedKey = JSON.stringify(key);
    return "\"" + key + "\"" === encodedKey ? key : encodedKey;
}
function describeValueForErrorMessage(value) {
    switch (typeof value) {
        case "string": {
            return JSON.stringify(value.length <= 10 ? value : value.slice(0, 10) + "...");
        }
        case "object": {
            if (Array.isArray(value)) {
                return "[...]";
            }
            var name_1 = objectName(value);
            if (name_1 === "Object") {
                return "{...}";
            }
            return name_1;
        }
        case "function":
            return "function";
        default:
            return String(value);
    }
}
exports.describeValueForErrorMessage = describeValueForErrorMessage;
function describeElementType(type) {
    if (typeof type === "string") {
        return type;
    }
    switch (type) {
        case react_symbols_1.REACT_SUSPENSE_TYPE:
            return "Suspense";
        case react_symbols_1.REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
    }
    if (typeof type === "object") {
        switch (type.$$typeof) {
            case react_symbols_1.REACT_FORWARD_REF_TYPE:
                return describeElementType(type.render);
            case react_symbols_1.REACT_MEMO_TYPE:
                return describeElementType(type.type);
            case react_symbols_1.REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                    // Lazy may contain any component type so we recursively resolve it.
                    return describeElementType(init(payload));
                }
                catch (x) {
                }
            }
        }
    }
    return "";
}
function describeObjectForErrorMessage(objectOrArray, expandedName) {
    var objKind = objectName(objectOrArray);
    if (objKind !== "Object" && objKind !== "Array") {
        return objKind;
    }
    var str = "";
    var start = -1;
    var length = 0;
    if (Array.isArray(objectOrArray)) {
        if (__DEV__ && exports.jsxChildrenParents.has(objectOrArray)) {
            // Print JSX Children
            var type = exports.jsxChildrenParents.get(objectOrArray);
            str = "<" + describeElementType(type) + ">";
            var array = objectOrArray;
            for (var i = 0; i < array.length; i++) {
                var value = array[i];
                var substr = void 0;
                if (typeof value === "string") {
                    substr = value;
                }
                else if (typeof value === "object" && value !== null) {
                    substr = "{" + describeObjectForErrorMessage(value) + "}";
                }
                else {
                    substr = "{" + describeValueForErrorMessage(value) + "}";
                }
                if ("" + i === expandedName) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                }
                else if (substr.length < 15 && str.length + substr.length < 40) {
                    str += substr;
                }
                else {
                    str += "{...}";
                }
            }
            str += "</" + describeElementType(type) + ">";
        }
        else {
            // Print Array
            str = "[";
            var array = objectOrArray;
            for (var i = 0; i < array.length; i++) {
                if (i > 0) {
                    str += ", ";
                }
                var value = array[i];
                var substr = void 0;
                if (typeof value === "object" && value !== null) {
                    substr = describeObjectForErrorMessage(value);
                }
                else {
                    substr = describeValueForErrorMessage(value);
                }
                if ("" + i === expandedName) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                }
                else if (substr.length < 10 && str.length + substr.length < 40) {
                    str += substr;
                }
                else {
                    str += "...";
                }
            }
            str += "]";
        }
    }
    else {
        if (objectOrArray.$$typeof === react_symbols_1.REACT_ELEMENT_TYPE) {
            str = "<" + describeElementType(objectOrArray.type) + "/>";
        }
        else if (__DEV__ && exports.jsxPropsParents.has(objectOrArray)) {
            // Print JSX
            var type = exports.jsxPropsParents.get(objectOrArray);
            str = "<" + (describeElementType(type) || "...");
            var object = objectOrArray;
            var names = Object.keys(object);
            for (var i = 0; i < names.length; i++) {
                str += " ";
                var name_2 = names[i];
                str += describeKeyForErrorMessage(name_2) + "=";
                var value = object[name_2];
                var substr = void 0;
                if (name_2 === expandedName && typeof value === "object" && value !== null) {
                    substr = describeObjectForErrorMessage(value);
                }
                else {
                    substr = describeValueForErrorMessage(value);
                }
                if (typeof value !== "string") {
                    substr = "{" + substr + "}";
                }
                if (name_2 === expandedName) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                }
                else if (substr.length < 10 && str.length + substr.length < 40) {
                    str += substr;
                }
                else {
                    str += "...";
                }
            }
            str += ">";
        }
        else {
            // Print Object
            str = "{";
            var object = objectOrArray;
            var names = Object.keys(object);
            for (var i = 0; i < names.length; i++) {
                if (i > 0) {
                    str += ", ";
                }
                var name_3 = names[i];
                str += describeKeyForErrorMessage(name_3) + ": ";
                var value = object[name_3];
                var substr = void 0;
                if (typeof value === "object" && value !== null) {
                    substr = describeObjectForErrorMessage(value);
                }
                else {
                    substr = describeValueForErrorMessage(value);
                }
                if (name_3 === expandedName) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                }
                else if (substr.length < 10 && str.length + substr.length < 40) {
                    str += substr;
                }
                else {
                    str += "...";
                }
            }
            str += "}";
        }
    }
    if (expandedName === undefined) {
        return str;
    }
    if (start > -1 && length > 0) {
        var highlight = " ".repeat(start) + "^".repeat(length);
        return "\n  " + str + "\n  " + highlight;
    }
    return "\n  " + str;
}
exports.describeObjectForErrorMessage = describeObjectForErrorMessage;
