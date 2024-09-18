"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/invokeGuardedCallbackImpl.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
var fakeNode = null;
if (__DEV__) {
    if (typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function" &&
        typeof document !== "undefined" &&
        typeof document.createEvent === "function") {
        fakeNode = document.createElement("react");
    }
}
function invokeGuardedCallbackImpl(name, func, context) {
    if (__DEV__) {
        if (fakeNode) {
            var evt = document.createEvent("Event");
            var didCall_1 = false;
            var didError_1 = true;
            var windowEvent_1 = window.event;
            var windowEventDescriptor = Object.getOwnPropertyDescriptor(window, "event");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            var restoreAfterDispatch_1 = function () {
                fakeNode.removeEventListener(evtType_1, callCallback_1, false);
                if (typeof window.event !== "undefined" &&
                    window.hasOwnProperty("event")) {
                    // @ts-ignore - Cannot assign to read only property 'event' of object '#<Window>', also its deprecated
                    window["event"] = windowEvent_1;
                }
            };
            var funcArgs_1 = Array.prototype.slice.call(arguments, 3);
            var callCallback_1 = function () {
                didCall_1 = true;
                restoreAfterDispatch_1();
                func.apply(context, funcArgs_1);
                didError_1 = false;
            };
            var error_1;
            var didSetError_1 = false;
            var isCrossOriginError_1 = false;
            var handleWindowError = function (event) {
                error_1 = event.error;
                didSetError_1 = true;
                if (error_1 === null && event.colno === 0 && event.lineno === 0) {
                    isCrossOriginError_1 = true;
                }
                if (event.defaultPrevented) {
                    if (error_1 != null && typeof error_1 === "object") {
                        try {
                            error_1._suppressLogging = true;
                        }
                        catch (inner) {
                            // Ignore.
                        }
                    }
                }
            };
            // Create a fake event type.
            var evtType_1 = "react-".concat(name ? name : "invokeguardedcallback");
            window.addEventListener("error", handleWindowError);
            fakeNode.addEventListener(evtType_1, callCallback_1, false);
            evt.initEvent(evtType_1, false, false);
            fakeNode.dispatchEvent(evt);
            if (windowEventDescriptor) {
                Object.defineProperty(window, "event", windowEventDescriptor);
            }
            if (didCall_1 && didError_1) {
                if (!didSetError_1) {
                    error_1 = new Error("An error was thrown inside one of your components, but React " +
                        "doesn't know what it was. This is likely due to browser " +
                        "flakiness. React does its best to preserve the \"Pause on " +
                        "exceptions\" behavior of the DevTools, which requires some " +
                        "DEV-mode only tricks. It's possible that these don't work in " +
                        "your browser. Try triggering the error in production mode, " +
                        "or switching to a modern browser. If you suspect that this is " +
                        "actually an issue with React, please file an issue.");
                }
                else if (isCrossOriginError_1) {
                    error_1 = new Error("A cross-origin error was thrown. React doesn't have access to " +
                        "the actual error object in development. " +
                        "See https://reactjs.org/link/crossorigin-error for more information.");
                }
                this.onError(error_1);
            }
            window.removeEventListener("error", handleWindowError);
            if (didCall_1) {
                return;
            }
            else {
                restoreAfterDispatch_1();
            }
        }
        var funcArgs = Array.prototype.slice.call(arguments, 3);
        try {
            func.apply(context, funcArgs);
        }
        catch (error) {
            this.onError(error);
        }
    }
    else {
        var funcArgs = Array.prototype.slice.call(arguments, 3);
        try {
            func.apply(context, funcArgs);
        }
        catch (error) {
            this.onError(error);
        }
    }
}
exports.default = invokeGuardedCallbackImpl;
