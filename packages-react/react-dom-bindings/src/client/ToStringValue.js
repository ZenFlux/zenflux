"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToStringValue = exports.toString = void 0;
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
// Flow does not allow string concatenation of most non-string types. To work
// around this limitation, we use an opaque type that can only be obtained by
// passing the value through getToStringValue first.
function toString(value) {
    // The coercion safety check is performed in getToStringValue().
    // not-used: eslint-disable-next-line react-internal/safe-string-coercion
    return "" + value;
}
exports.toString = toString;
function getToStringValue(value) {
    switch (typeof value) {
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return value;
        case "object":
            if (__DEV__) {
                (0, check_string_coercion_1.checkFormFieldValueStringCoercion)(value);
            }
            return value;
        default:
            // function, symbol are assigned as empty strings
            return "";
    }
}
exports.getToStringValue = getToStringValue;
