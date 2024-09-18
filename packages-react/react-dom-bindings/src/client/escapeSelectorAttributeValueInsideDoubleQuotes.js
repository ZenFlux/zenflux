"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// When passing user input into querySelector(All) the embedded string must not alter
// the semantics of the query. This escape function is safe to use when we know the
// provided value is going to be wrapped in double quotes as part of an attribute selector
// Do not use it anywhere else
// we escape double quotes and backslashes
var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n\"\\]/g;
function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
    return value.replace(escapeSelectorAttributeValueInsideDoubleQuotesRegex, function (ch) { return "\\" + ch.charCodeAt(0).toString(16) + " "; });
}
exports.default = escapeSelectorAttributeValueInsideDoubleQuotes;
