"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCrossOriginStringAs = exports.getCrossOriginString = void 0;
function getCrossOriginString(input) {
    if (typeof input === "string") {
        return input === "use-credentials" ? input : "";
    }
    return undefined;
}
exports.getCrossOriginString = getCrossOriginString;
function getCrossOriginStringAs(as, input) {
    if (as === "font") {
        return "";
    }
    if (typeof input === "string") {
        return input === "use-credentials" ? input : "";
    }
    return undefined;
}
exports.getCrossOriginStringAs = getCrossOriginStringAs;
