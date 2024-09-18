"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ConsolePatchingDev.js
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reenableLogs = exports.disableLogs = void 0;
// Helpers to patch console.logs to avoid logging during side effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.
var disabledDepth = 0;
var prevLog;
var prevInfo;
var prevWarn;
var prevError;
var prevGroup;
var prevGroupCollapsed;
var prevGroupEnd;
function disabledLog() {
}
disabledLog.__reactDisabledLog = true;
function disableLogs() {
    if (__DEV__) {
        if (disabledDepth === 0) {
            prevLog = console.log;
            prevInfo = console.info;
            prevWarn = console.warn;
            prevError = console.error;
            prevGroup = console.group;
            prevGroupCollapsed = console.groupCollapsed;
            prevGroupEnd = console.groupEnd;
            // https://github.com/facebook/react/issues/19099
            var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
            };
            Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
            });
        }
        disabledDepth++;
    }
}
exports.disableLogs = disableLogs;
function reenableLogs() {
    if (__DEV__) {
        disabledDepth--;
        if (disabledDepth === 0) {
            var props = {
                configurable: true,
                enumerable: true,
                writable: true
            };
            Object.defineProperties(console, {
                log: __assign(__assign({}, props), { value: prevLog }),
                info: __assign(__assign({}, props), { value: prevInfo }),
                warn: __assign(__assign({}, props), { value: prevWarn }),
                error: __assign(__assign({}, props), { value: prevError }),
                group: __assign(__assign({}, props), { value: prevGroup }),
                groupCollapsed: __assign(__assign({}, props), { value: prevGroupCollapsed }),
                groupEnd: __assign(__assign({}, props), { value: prevGroupEnd })
            });
        }
        if (disabledDepth < 0) {
            console.error("disabledDepth fell below zero. " + "This is a bug in React. Please file an issue.");
        }
    }
}
exports.reenableLogs = reenableLogs;
