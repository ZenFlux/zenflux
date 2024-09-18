"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProperties = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var has_own_property_1 = require("@zenflux/react-shared/src/has-own-property");
var isAttributeNameSafe_1 = require("@zenflux/react-dom-bindings/src/shared/isAttributeNameSafe");
var validAriaProperties_1 = require("@zenflux/react-dom-bindings/src/shared/validAriaProperties");
var warnedProperties = {};
var rARIA = new RegExp("^(aria)-[" + isAttributeNameSafe_1.ATTRIBUTE_NAME_CHAR + "]*$");
var rARIACamel = new RegExp("^(aria)[A-Z][" + isAttributeNameSafe_1.ATTRIBUTE_NAME_CHAR + "]*$");
function validateProperty(tagName, name) {
    if (__DEV__) {
        if (has_own_property_1.default.call(warnedProperties, name) && warnedProperties[name]) {
            return true;
        }
        if ("string" === typeof name && rARIACamel.test(name)) {
            var ariaName = "aria-" + name.slice(4).toLowerCase();
            var correctName = validAriaProperties_1.default.hasOwnProperty(ariaName) ? ariaName : null;
            // If this is an aria-* attribute, but is not listed in the known DOM
            // DOM properties, then it is an invalid aria-* attribute.
            if (correctName == null) {
                console.error("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", name);
                warnedProperties[name] = true;
                return true;
            }
            // aria-* attributes should be lowercase; suggest the lowercase version.
            if (name !== correctName) {
                console.error("Invalid ARIA attribute `%s`. Did you mean `%s`?", name, correctName);
                warnedProperties[name] = true;
                return true;
            }
        }
        if ("string" === typeof name && rARIA.test(name)) {
            var lowerCasedName = name.toLowerCase();
            var standardName = validAriaProperties_1.default.hasOwnProperty(lowerCasedName) ? lowerCasedName : null;
            // If this is an aria-* attribute, but is not listed in the known DOM
            // DOM properties, then it is an invalid aria-* attribute.
            if (standardName == null) {
                warnedProperties[name] = true;
                return false;
            }
            // aria-* attributes should be lowercase; suggest the lowercase version.
            if (name !== standardName) {
                console.error("Unknown ARIA attribute `%s`. Did you mean `%s`?", name, standardName);
                warnedProperties[name] = true;
                return true;
            }
        }
    }
    return true;
}
function validateProperties(type, props) {
    if (__DEV__) {
        var invalidProps = [];
        for (var key in props) {
            var isValid = validateProperty(type, key);
            if (!isValid) {
                invalidProps.push(key);
            }
        }
        var unknownPropString = invalidProps.map(function (prop) { return "`" + prop + "`"; }).join(", ");
        if (invalidProps.length === 1) {
            console.error("Invalid aria prop %s on <%s> tag. " + "For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
        }
        else if (invalidProps.length > 1) {
            console.error("Invalid aria props %s on <%s> tag. " + "For details, see https://reactjs.org/link/invalid-aria-props", unknownPropString, type);
        }
    }
}
exports.validateProperties = validateProperties;
