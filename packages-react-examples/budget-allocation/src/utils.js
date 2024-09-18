"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNumericStringWithCommas = exports.formatNumericStringToFraction = exports.pickEnforcedKeys = void 0;
function pickEnforcedKeys(source, keys) {
    var target = {};
    if (!source) {
        throw new Error("Source is empty");
    }
    Object.keys(keys).forEach(function (key) {
        if (false === keys[key]) {
            return;
        }
        if ("undefined" === typeof source[key]) {
            throw new Error("Missing key: ".concat(key));
        }
        target[key] = source[key];
    });
    return target;
}
exports.pickEnforcedKeys = pickEnforcedKeys;
function formatNumericStringToFraction(value) {
    var parsed = parseFloat(value.replace(/,/g, ""));
    return (Number.isNaN(parsed) ? 0 : parsed).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}
exports.formatNumericStringToFraction = formatNumericStringToFraction;
function formatNumericStringWithCommas(value) {
    if (!(value === null || value === void 0 ? void 0 : value.length)) {
        return "0";
    }
    // If include alphabet, then halt
    if (/[a-zA-Z]/.test(value)) {
        return null;
    }
    // Remove leading zeros.
    value = value.replace(/^0+/, "");
    // Decimal separator (eg 100 /  1,000 / 10,000).
    var valueWithoutSeparators = value.replace(/,/g, "");
    var number = parseFloat(valueWithoutSeparators);
    if (Number.isNaN(number)) {
        return "0";
    }
    return number.toLocaleString();
}
exports.formatNumericStringWithCommas = formatNumericStringWithCommas;
