"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactErrorUtils.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCaughtError = exports.hasCaughtError = exports.rethrowCaughtError = exports.invokeGuardedCallbackAndCatchFirstError = exports.invokeGuardedCallback = void 0;
var invoke_guarded_callback_impl_1 = require("@zenflux/react-shared/src/invoke-guarded-callback-impl");
// Used by Fiber to simulate a try-catch.
var hasError = false;
var caughtError = null;
// Used by event system to capture/rethrow the first error.
var hasRethrowError = false;
var rethrowError = null;
var reporter = {
    onError: function (error) {
        hasError = true;
        caughtError = error;
    }
};
/**
 * Call a function while guarding against errors that happens within it.
 * Returns an error if it throws, otherwise null.
 *
 * In production, this is implemented using a try-catch. The reason we don't
 * use a try-catch directly is so that we can swap out a different
 * implementation in DEV mode.
 */
function invokeGuardedCallback(name, func, context) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    hasError = false;
    caughtError = null;
    invoke_guarded_callback_impl_1.default.apply(reporter, arguments);
}
exports.invokeGuardedCallback = invokeGuardedCallback;
/**
 * Same as invokeGuardedCallback, but instead of returning an error, it stores
 * it in a global so it can be rethrown by `rethrowCaughtError` later.
 *
 * TODO: See if caughtError and rethrowError can be unified.
 */
function invokeGuardedCallbackAndCatchFirstError(name, func, context) {
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    invokeGuardedCallback.apply(this, arguments);
    if (hasError) {
        var error = clearCaughtError();
        if (!hasRethrowError) {
            hasRethrowError = true;
            rethrowError = error;
        }
    }
}
exports.invokeGuardedCallbackAndCatchFirstError = invokeGuardedCallbackAndCatchFirstError;
/**
 * During execution of guarded functions we will capture the first error which
 * we will rethrow to be handled by the top level error handler.
 */
function rethrowCaughtError() {
    if (hasRethrowError) {
        var error = rethrowError;
        hasRethrowError = false;
        rethrowError = null;
        throw error;
    }
}
exports.rethrowCaughtError = rethrowCaughtError;
function hasCaughtError() {
    return hasError;
}
exports.hasCaughtError = hasCaughtError;
function clearCaughtError() {
    if (hasError) {
        var error = caughtError;
        hasError = false;
        caughtError = null;
        return error;
    }
    else {
        throw new Error("clearCaughtError was called but no error was captured. This error " + "is likely caused by a bug in React. Please file an issue.");
    }
}
exports.clearCaughtError = clearCaughtError;
