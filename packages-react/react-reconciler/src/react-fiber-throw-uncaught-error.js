"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasUncaughtError = exports.getFirstUncaughtError = exports.setFirstUncaughtError = exports.clearFirstUncaughtError = exports.clearUncaughtError = exports.onUncaughtError = void 0;
var _hasUncaughtError = false;
var _firstUncaughtError = null;
var onUncaughtError = function (error) {
    if (!_hasUncaughtError) {
        _hasUncaughtError = true;
        _firstUncaughtError = error;
    }
};
exports.onUncaughtError = onUncaughtError;
function clearUncaughtError() {
    _hasUncaughtError = false;
}
exports.clearUncaughtError = clearUncaughtError;
function clearFirstUncaughtError() {
    _firstUncaughtError = null;
}
exports.clearFirstUncaughtError = clearFirstUncaughtError;
function setFirstUncaughtError(error) {
    _firstUncaughtError = error;
}
exports.setFirstUncaughtError = setFirstUncaughtError;
function getFirstUncaughtError() {
    return _firstUncaughtError;
}
exports.getFirstUncaughtError = getFirstUncaughtError;
function hasUncaughtError() {
    return _hasUncaughtError;
}
exports.hasUncaughtError = hasUncaughtError;
