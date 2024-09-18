"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.warn = exports.setSuppressWarning = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/consoleWithStackDev.js
 */
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var suppressWarning = false;
function setSuppressWarning(newSuppressWarning) {
    if (__DEV__) {
        suppressWarning = newSuppressWarning;
    }
}
exports.setSuppressWarning = setSuppressWarning;
// In DEV, calls to console.warn and console.error get replaced
// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.
function warn(format) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (__DEV__) {
        if (!suppressWarning) {
            printWarning("warn", format, args);
        }
    }
}
exports.warn = warn;
function error(format) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (__DEV__) {
        if (!suppressWarning) {
            printWarning("error", format, args);
        }
    }
}
exports.error = error;
function printWarning(level, format, args) {
    // When changing this logic, you might want to also
    // update consoleWithStackDev.www.js as well.
    if (__DEV__) {
        var ReactDebugCurrentFrame = react_shared_internals_1.default.ReactDebugCurrentFrame;
        var stack = ReactDebugCurrentFrame.getStackAddendum();
        if (stack !== "") {
            format += "%s";
            args = args.concat([stack]);
        }
        // not-used: eslint-disable-next-line react-internal/safe-string-coercion
        var argsWithFormat = args.map(function (item) { return String(item); });
        // Careful: RN currently depends on this prefix
        argsWithFormat.unshift("Warning: " + format);
        // We intentionally don't use spread (or .apply) directly because it
        // breaks IE9: https://github.com/facebook/react/issues/13610
        // not-used: eslint-disable-next-line react-internal/no-production-logging
        // @ts-ignore
        Function.prototype.apply.call(console[level], console, argsWithFormat);
    }
}
