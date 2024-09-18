"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIsRunningInsertionEffect = exports.setIsRunningInsertionEffect = void 0;
var isRunningInsertionEffect = false;
function setIsRunningInsertionEffect(isRunning) {
    if (__DEV__) {
        isRunningInsertionEffect = isRunning;
    }
}
exports.setIsRunningInsertionEffect = setIsRunningInsertionEffect;
function getIsRunningInsertionEffect() {
    return isRunningInsertionEffect;
}
exports.getIsRunningInsertionEffect = getIsRunningInsertionEffect;
