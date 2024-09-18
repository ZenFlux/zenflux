"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
// Keep in sync with react-reconciler/getComponentNameFromFiber
function getWrappedName(outerType, innerType, wrapperName) {
    var displayName = outerType.displayName;
    if (displayName) {
        return displayName;
    }
    var functionName = innerType.displayName || innerType.name || "";
    return functionName !== "" ? "".concat(wrapperName, "(").concat(functionName, ")") : wrapperName;
}
// Keep in sync with react-reconciler/getComponentNameFromFiber
function getContextName(type) {
    return type.displayName || "Context";
} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.
function getComponentNameFromType(type) {
    if (type == null) {
        // Host root, text node or just invalid type.
        return null;
    }
    if (__DEV__) {
        if (typeof type.tag === "number") {
            console.error("Received an unexpected object in getComponentNameFromType(). " + "This is likely a bug in React. Please file an issue.");
        }
    }
    if (typeof type === "function") {
        return type.displayName || type.name || null;
    }
    if (typeof type === "string") {
        return type;
    }
    switch (type) {
        case react_symbols_1.REACT_FRAGMENT_TYPE:
            return "Fragment";
        case react_symbols_1.REACT_PORTAL_TYPE:
            return "Portal";
        case react_symbols_1.REACT_PROFILER_TYPE:
            return "Profiler";
        case react_symbols_1.REACT_STRICT_MODE_TYPE:
            return "StrictMode";
        case react_symbols_1.REACT_SUSPENSE_TYPE:
            return "Suspense";
        case react_symbols_1.REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
        case react_symbols_1.REACT_CACHE_TYPE:
            if (react_feature_flags_1.enableCache) {
                return "Cache";
            }
        // Fall through
        case react_symbols_1.REACT_TRACING_MARKER_TYPE:
            if (react_feature_flags_1.enableTransitionTracing) {
                return "TracingMarker";
            }
    }
    if (typeof type === "object") {
        switch (type.$$typeof) {
            case react_symbols_1.REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
            case react_symbols_1.REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
            case react_symbols_1.REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
            case react_symbols_1.REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                    return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
            case react_symbols_1.REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                    return getComponentNameFromType(init(payload));
                }
                catch (x) {
                    return null;
                }
            }
            case react_symbols_1.REACT_SERVER_CONTEXT_TYPE:
                if (react_feature_flags_1.enableServerContext) {
                    var context2 = type;
                    return (context2.displayName || context2._globalName) + ".Provider";
                }
        }
    }
    return null;
}
exports.default = getComponentNameFromType;
