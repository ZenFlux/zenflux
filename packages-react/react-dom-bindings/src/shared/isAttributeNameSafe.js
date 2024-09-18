"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTRIBUTE_NAME_CHAR = void 0;
var has_own_property_1 = require("@zenflux/react-shared/src/has-own-property");
/* eslint-disable max-len */
var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
/* eslint-enable max-len */
exports.ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var VALID_ATTRIBUTE_NAME_REGEX = new RegExp("^[" + ATTRIBUTE_NAME_START_CHAR + "][" + exports.ATTRIBUTE_NAME_CHAR + "]*$");
var illegalAttributeNameCache = {};
var validatedAttributeNameCache = {};
function isAttributeNameSafe(attributeName) {
    if (has_own_property_1.default.call(validatedAttributeNameCache, attributeName)) {
        return true;
    }
    if (has_own_property_1.default.call(illegalAttributeNameCache, attributeName)) {
        return false;
    }
    if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
        validatedAttributeNameCache[attributeName] = true;
        return true;
    }
    illegalAttributeNameCache[attributeName] = true;
    if (__DEV__) {
        console.error("Invalid attribute name: `%s`", attributeName);
    }
    return false;
}
exports.default = isAttributeNameSafe;
