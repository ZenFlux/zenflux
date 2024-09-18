"use strict";
// code copied and modified from escape-html
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module variables.
 * @private
 */
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var matchHtmlRegExp = /["'&<>]/;
/**
 * Escapes special characters and HTML entities in a given html string.
 *
 * @param  {string} string HTML string to escape for later insertion
 * @return {string}
 * @public
 */
function escapeHtml(string) {
    if (__DEV__) {
        (0, check_string_coercion_1.checkHtmlStringCoercion)(string);
    }
    var str = "" + string;
    var match = matchHtmlRegExp.exec(str);
    if (!match) {
        return str;
    }
    var escape;
    var html = "";
    var index;
    var lastIndex = 0;
    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
            case 34:
                // "
                escape = "&quot;";
                break;
            case 38:
                // &
                escape = "&amp;";
                break;
            case 39:
                // '
                escape = "&#x27;"; // modified from escape-html; used to be '&#39'
                break;
            case 60:
                // <
                escape = "&lt;";
                break;
            case 62:
                // >
                escape = "&gt;";
                break;
            default:
                continue;
        }
        if (lastIndex !== index) {
            html += str.slice(lastIndex, index);
        }
        lastIndex = index + 1;
        html += escape;
    }
    return lastIndex !== index ? html + str.slice(lastIndex, index) : html;
}
// end code copied and modified from escape-html
/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escapeTextForBrowser(text) {
    if (typeof text === "boolean" || typeof text === "number") {
        // this shortcircuit helps perf for types that we know will never have
        // special characters, especially given that this function is used often
        // for numeric dom ids.
        return "" + text;
    }
    return escapeHtml(text);
}
exports.default = escapeTextForBrowser;
