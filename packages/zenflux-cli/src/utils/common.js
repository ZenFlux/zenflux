"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUppercaseAt = void 0;
function zUppercaseAt(str, at) {
    if (at === void 0) { at = 0; }
    if (!str) {
        debugger;
    }
    return str.charAt(at).toUpperCase() + str.slice(at + 1);
}
exports.zUppercaseAt = zUppercaseAt;
;
