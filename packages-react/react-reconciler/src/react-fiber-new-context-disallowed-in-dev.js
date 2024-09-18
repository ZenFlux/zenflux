"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDisallowedContextReadInDEV = exports.exitDisallowedContextReadInDEV = exports.enterDisallowedContextReadInDEV = void 0;
var _isDisallowedContextReadInDEV = false;
function enterDisallowedContextReadInDEV() {
    if (__DEV__) {
        _isDisallowedContextReadInDEV = true;
    }
}
exports.enterDisallowedContextReadInDEV = enterDisallowedContextReadInDEV;
function exitDisallowedContextReadInDEV() {
    if (__DEV__) {
        _isDisallowedContextReadInDEV = false;
    }
}
exports.exitDisallowedContextReadInDEV = exitDisallowedContextReadInDEV;
function isDisallowedContextReadInDEV() {
    if (__DEV__) {
        return _isDisallowedContextReadInDEV;
    }
    return false;
}
exports.isDisallowedContextReadInDEV = isDisallowedContextReadInDEV;
