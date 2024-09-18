"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldError = exports.setShouldError = void 0;
var shouldErrorImpl = function () { return undefined; };
function setShouldError(impl) {
    shouldErrorImpl = impl;
}
exports.setShouldError = setShouldError;
;
function shouldError(fiber) {
    return shouldErrorImpl(fiber);
}
exports.shouldError = shouldError;
