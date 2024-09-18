"use strict";
// This flag allows for warning supression when we expect there to be mismatches
// due to earlier mismatches or a suspended fiber.
Object.defineProperty(exports, "__esModule", { value: true });
exports.didSuspendOrErrorWhileHydratingDEVSafe = exports.didSuspendOrErrorWhileHydratingDEV = exports.didntSuspendOrErrorWhileHydratingDEV = exports.clearDidThrowWhileHydratingDEV = exports.markDidThrowWhileHydratingDEV = void 0;
var didSuspendOrErrorDEV = false;
function markDidThrowWhileHydratingDEV() {
    if (__DEV__) {
        didSuspendOrErrorDEV = true;
    }
}
exports.markDidThrowWhileHydratingDEV = markDidThrowWhileHydratingDEV;
function clearDidThrowWhileHydratingDEV() {
    didSuspendOrErrorDEV = false;
}
exports.clearDidThrowWhileHydratingDEV = clearDidThrowWhileHydratingDEV;
function didntSuspendOrErrorWhileHydratingDEV() {
    return !didSuspendOrErrorDEV;
}
exports.didntSuspendOrErrorWhileHydratingDEV = didntSuspendOrErrorWhileHydratingDEV;
function didSuspendOrErrorWhileHydratingDEV() {
    return didSuspendOrErrorDEV;
}
exports.didSuspendOrErrorWhileHydratingDEV = didSuspendOrErrorWhileHydratingDEV;
function didSuspendOrErrorWhileHydratingDEVSafe() {
    if (__DEV__) {
        return didSuspendOrErrorDEV;
    }
    return false;
}
exports.didSuspendOrErrorWhileHydratingDEVSafe = didSuspendOrErrorWhileHydratingDEVSafe;
