"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
function reactIsValidElementType(type) {
    if (typeof type === "string" || typeof type === "function") {
        return true;
    }
    if (type === react_symbols_1.REACT_FRAGMENT_TYPE ||
        type === react_symbols_1.REACT_PROFILER_TYPE ||
        (react_feature_flags_1.enableDebugTracing && type === react_symbols_1.REACT_DEBUG_TRACING_MODE_TYPE) ||
        type === react_symbols_1.REACT_STRICT_MODE_TYPE ||
        type === react_symbols_1.REACT_SUSPENSE_TYPE ||
        type === react_symbols_1.REACT_SUSPENSE_LIST_TYPE ||
        (react_feature_flags_1.enableLegacyHidden && type === react_symbols_1.REACT_LEGACY_HIDDEN_TYPE) ||
        type === react_symbols_1.REACT_OFFSCREEN_TYPE ||
        (react_feature_flags_1.enableScopeAPI && type === react_symbols_1.REACT_SCOPE_TYPE) ||
        (react_feature_flags_1.enableCacheElement && type === react_symbols_1.REACT_CACHE_TYPE) ||
        (react_feature_flags_1.enableTransitionTracing && type === react_symbols_1.REACT_TRACING_MARKER_TYPE)) {
        return true;
    }
    if (typeof type === "object" && type !== null) {
        if (type.$$typeof === react_symbols_1.REACT_LAZY_TYPE ||
            type.$$typeof === react_symbols_1.REACT_MEMO_TYPE ||
            type.$$typeof === react_symbols_1.REACT_PROVIDER_TYPE ||
            type.$$typeof === react_symbols_1.REACT_CONTEXT_TYPE ||
            type.$$typeof === react_symbols_1.REACT_FORWARD_REF_TYPE ||
            type.$$typeof === REACT_CLIENT_REFERENCE ||
            type.getModuleId !== undefined) {
            return true;
        }
    }
    return false;
}
exports.default = reactIsValidElementType;
