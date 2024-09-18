"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeUnknownElementTypeFrameInDEV = exports.describeFunctionComponentFrame = exports.describeClassComponentFrame = exports.describeNativeComponentFrame = exports.describeBuiltInComponentFrame = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 *
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactComponentStackFrame.js
 */
var console_patching_dev_1 = require("@zenflux/react-shared/src/console-patching-dev");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var ReactCurrentDispatcher = react_shared_internals_1.default.ReactCurrentDispatcher;
var prefix;
var reentry = false;
var componentFrameCache;
function describeBuiltInComponentFrame(name, source, ownerFn) {
    if (react_feature_flags_1.enableComponentStackLocations) {
        if (prefix === undefined) {
            // Extract the VM specific prefix used by each line.
            try {
                throw Error();
            }
            catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
            }
        }
        // We use the prefix to ensure our stacks line up with native stack frames.
        return "\n" + prefix + name;
    }
    else {
        var ownerName = null;
        if (__DEV__ && ownerFn) {
            // @ts-ignore
            ownerName = ownerFn.displayName || ownerFn.name || null;
        }
        return describeComponentFrame(name, source, ownerName);
    }
}
exports.describeBuiltInComponentFrame = describeBuiltInComponentFrame;
if (__DEV__) {
    var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
    componentFrameCache = new PossiblyWeakMap();
}
function describeNativeComponentFrame(fn, construct) {
    // If something asked for a stack inside a fake render, it should get ignored.
    if (!fn || reentry) {
        return "";
    }
    if (__DEV__) {
        var frame = componentFrameCache.get(fn);
        if (frame !== undefined) {
            return frame;
        }
    }
    var control;
    reentry = true;
    var previousPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = undefined;
    var previousDispatcher = null;
    if (__DEV__) {
        previousDispatcher = ReactCurrentDispatcher.current;
        // Set the dispatcher in DEV because this might be call in the render function
        // for warnings.
        ReactCurrentDispatcher.current = null;
        (0, console_patching_dev_1.disableLogs)();
    }
    try {
        // This should throw.
        if (construct) {
            // Something should be setting the props in the constructor.
            var Fake = function () {
                throw Error();
            };
            Object.defineProperty(Fake.prototype, "props", {
                set: function () {
                    // We use a throwing setter instead of frozen or non-writable props
                    // because that won't throw in a non-strict mode function.
                    throw Error();
                }
            });
            if (typeof Reflect === "object" && Reflect.construct) {
                // We construct a different control for this case to include any extra
                // frames added by the construct call.
                try {
                    Reflect.construct(Fake, []);
                }
                catch (x) {
                    control = x;
                }
                Reflect.construct(fn, [], Fake);
            }
            else {
                try {
                    // @ts-ignore
                    Fake.call();
                }
                catch (x) {
                    control = x;
                }
                fn.call(Fake.prototype);
            }
        }
        else {
            try {
                // noinspection ExceptionCaughtLocallyJS
                throw Error();
            }
            catch (x) {
                control = x;
            }
            // TODO(luna): This will currently only throw if the function component
            // tries to access React/ReactDOM/props. We should probably make this throw
            // in simple components too
            var maybePromise = fn();
            // If the function component returns a promise, it's likely an async
            // component, which we don't yet support. Attach a noop catch handler to
            // silence the error.
            // TODO: Implement component stacks for async client components?
            if (maybePromise && typeof maybePromise.catch === "function") {
                maybePromise.catch(function () {
                });
            }
        }
    }
    catch (sample) {
        // This is inlined manually because closure doesn't do it for us.
        if (sample && control && typeof sample.stack === "string") {
            // This extracts the first frame from the sample that isn't also in the control.
            // Skipping one frame that we assume is the frame that calls the two.
            var sampleLines = sample.stack.split("\n");
            var controlLines = control.stack.split("\n");
            var s = sampleLines.length - 1;
            var c = controlLines.length - 1;
            while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                // We expect at least one stack frame to be shared.
                // Typically, this will be the root most one. However, stack frames may be
                // cut off due to maximum stack limits. In this case, one maybe cut off
                // earlier than the other. We assume that the sample is longer or the same
                // and therefore cut off earlier. So we should find the root most frame in
                // the sample somewhere in the control.
                c--;
            }
            for (; s >= 1 && c >= 0; s--, c--) {
                // Next we find the first one that isn't the same which should be the
                // frame that called our sample function and the control.
                if (sampleLines[s] !== controlLines[c]) {
                    // In V8, the first line is describing the message but other VMs don't.
                    // If we're about to return the first line, and the control is also on the same
                    // line, that's a pretty good indicator that our sample threw at same line as
                    // the control. I.e. before we entered the sample frame. So we ignore this result.
                    // This can happen if you passed a class to function component, or non-function.
                    if (s !== 1 || c !== 1) {
                        do {
                            s--;
                            c--;
                            // We may still have similar intermediate frames from the construct call.
                            // The next one that isn't the same should be our match though.
                            if (c < 0 || sampleLines[s] !== controlLines[c]) {
                                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                                var frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                                // If our component frame is labeled "<anonymous>"
                                // but we have a user-provided "displayName"
                                // splice it in to make the stack more readable.
                                // @ts-ignore
                                if (fn.displayName && frame.includes("<anonymous>")) {
                                    // @ts-ignore
                                    frame = frame.replace("<anonymous>", fn.displayName);
                                }
                                if (__DEV__) {
                                    if (typeof fn === "function") {
                                        componentFrameCache.set(fn, frame);
                                    }
                                }
                                // Return the line we found.
                                return frame;
                            }
                        } while (s >= 1 && c >= 0);
                    }
                    break;
                }
            }
        }
    }
    finally {
        reentry = false;
        if (__DEV__) {
            ReactCurrentDispatcher.current = previousDispatcher;
            (0, console_patching_dev_1.reenableLogs)();
        }
        Error.prepareStackTrace = previousPrepareStackTrace;
    }
    // Fallback to just using the name if we couldn't make it throw.
    // @ts-ignore
    var name = fn ? fn.displayName || fn.name : "";
    var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
    if (__DEV__) {
        if (typeof fn === "function") {
            componentFrameCache.set(fn, syntheticFrame);
        }
    }
    return syntheticFrame;
}
exports.describeNativeComponentFrame = describeNativeComponentFrame;
var BEFORE_SLASH_RE = /^(.*)[\\\/]/;
function describeComponentFrame(name, source, ownerName) {
    var sourceInfo = "";
    if (__DEV__ && source) {
        var path = source.fileName;
        var fileName = path.replace(BEFORE_SLASH_RE, "");
        // In DEV, include code for a common special case:
        // prefer "folder/index.js" instead of just "index.js".
        if (/^index\./.test(fileName)) {
            var match = path.match(BEFORE_SLASH_RE);
            if (match) {
                var pathBeforeSlash = match[1];
                if (pathBeforeSlash) {
                    var folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, "");
                    fileName = folderName + "/" + fileName;
                }
            }
        }
        sourceInfo = " (at " + fileName + ":" + source.lineNumber + ")";
    }
    else if (ownerName) {
        sourceInfo = " (created by " + ownerName + ")";
    }
    return "\n    in " + (name || "Unknown") + sourceInfo;
}
function describeClassComponentFrame(ctor, source, ownerFn) {
    if (react_feature_flags_1.enableComponentStackLocations) {
        return describeNativeComponentFrame(ctor, true);
    }
    else {
        return describeFunctionComponentFrame(ctor, source, ownerFn);
    }
}
exports.describeClassComponentFrame = describeClassComponentFrame;
function describeFunctionComponentFrame(fn, source, ownerFn) {
    if (react_feature_flags_1.enableComponentStackLocations) {
        return describeNativeComponentFrame(fn, false);
    }
    else {
        if (!fn) {
            return "";
        }
        // @ts-ignore
        var name_1 = fn.displayName || fn.name || null;
        var ownerName = null;
        if (__DEV__ && ownerFn) {
            // @ts-ignore
            ownerName = ownerFn.displayName || ownerFn.name || null;
        }
        return describeComponentFrame(name_1, source, ownerName);
    }
}
exports.describeFunctionComponentFrame = describeFunctionComponentFrame;
function shouldConstruct(Component) {
    var prototype = Component.prototype;
    return !!(prototype && prototype.isReactComponent);
}
function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
    if (!__DEV__) {
        return "";
    }
    if (type == null) {
        return "";
    }
    if (typeof type === "function") {
        if (react_feature_flags_1.enableComponentStackLocations) {
            return describeNativeComponentFrame(type, shouldConstruct(type));
        }
        else {
            return describeFunctionComponentFrame(type, source, ownerFn);
        }
    }
    if (typeof type === "string") {
        return describeBuiltInComponentFrame(type, source, ownerFn);
    }
    switch (type) {
        case react_symbols_1.REACT_SUSPENSE_TYPE:
            return describeBuiltInComponentFrame("Suspense", source, ownerFn);
        case react_symbols_1.REACT_SUSPENSE_LIST_TYPE:
            return describeBuiltInComponentFrame("SuspenseList", source, ownerFn);
    }
    if (typeof type === "object") {
        switch (type.$$typeof) {
            case react_symbols_1.REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render, source, ownerFn);
            case react_symbols_1.REACT_MEMO_TYPE:
                // Memo may contain any component type so we recursively resolve it.
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
            case react_symbols_1.REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                    // Lazy may contain any component type so we recursively resolve it.
                    return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                }
                catch (x) {
                }
            }
        }
    }
    return "";
}
exports.describeUnknownElementTypeFrameInDEV = describeUnknownElementTypeFrameInDEV;
