import {
    REACT_CACHE_TYPE,
    REACT_CONTEXT_TYPE,
    REACT_DEBUG_TRACING_MODE_TYPE,
    REACT_FORWARD_REF_TYPE,
    REACT_FRAGMENT_TYPE,
    REACT_LAZY_TYPE,
    REACT_LEGACY_HIDDEN_TYPE,
    REACT_MEMO_TYPE,
    REACT_OFFSCREEN_TYPE,
    REACT_PROFILER_TYPE,
    REACT_PROVIDER_TYPE,
    REACT_SCOPE_TYPE,
    REACT_STRICT_MODE_TYPE,
    REACT_SUSPENSE_LIST_TYPE,
    REACT_SUSPENSE_TYPE,
    REACT_TRACING_MARKER_TYPE,
} from "@zenflux/react-shared/src/react-symbols";

import {
    enableCacheElement,
    enableDebugTracing,
    enableLegacyHidden,
    enableScopeAPI,
    enableTransitionTracing,
} from "@zenflux/react-shared/src/react-feature-flags";

const REACT_CLIENT_REFERENCE: unique symbol = Symbol.for( "react.client.reference" );

export default function reactIsValidElementType( type: any ): boolean {
    if ( typeof type === "string" || typeof type === "function" ) {
        return true;
    }

    if (
        type === REACT_FRAGMENT_TYPE ||
        type === REACT_PROFILER_TYPE ||
        ( enableDebugTracing && type === REACT_DEBUG_TRACING_MODE_TYPE ) ||
        type === REACT_STRICT_MODE_TYPE ||
        type === REACT_SUSPENSE_TYPE ||
        type === REACT_SUSPENSE_LIST_TYPE ||
        ( enableLegacyHidden && type === REACT_LEGACY_HIDDEN_TYPE ) ||
        type === REACT_OFFSCREEN_TYPE ||
        ( enableScopeAPI && type === REACT_SCOPE_TYPE ) ||
        ( enableCacheElement && type === REACT_CACHE_TYPE ) ||
        ( enableTransitionTracing && type === REACT_TRACING_MARKER_TYPE )
    ) {
        return true;
    }

    if ( typeof type === "object" && type !== null ) {
        if (
            type.$$typeof === REACT_LAZY_TYPE ||
            type.$$typeof === REACT_MEMO_TYPE ||
            type.$$typeof === REACT_PROVIDER_TYPE ||
            type.$$typeof === REACT_CONTEXT_TYPE ||
            type.$$typeof === REACT_FORWARD_REF_TYPE ||
            type.$$typeof === REACT_CLIENT_REFERENCE ||
            type.getModuleId !== undefined
        ) {
            return true;
        }
    }

    return false;
}
