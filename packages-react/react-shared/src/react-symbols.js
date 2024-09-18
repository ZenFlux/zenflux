"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactSymbols.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIteratorFn = exports.REACT_POSTPONE_TYPE = exports.REACT_MEMO_CACHE_SENTINEL = exports.REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = exports.REACT_TRACING_MARKER_TYPE = exports.REACT_CACHE_TYPE = exports.REACT_LEGACY_HIDDEN_TYPE = exports.REACT_OFFSCREEN_TYPE = exports.REACT_DEBUG_TRACING_MODE_TYPE = exports.REACT_SCOPE_TYPE = exports.REACT_LAZY_TYPE = exports.REACT_MEMO_TYPE = exports.REACT_SUSPENSE_LIST_TYPE = exports.REACT_SUSPENSE_TYPE = exports.REACT_FORWARD_REF_TYPE = exports.REACT_SERVER_CONTEXT_TYPE = exports.REACT_CONTEXT_TYPE = exports.REACT_PROVIDER_TYPE = exports.REACT_PROFILER_TYPE = exports.REACT_STRICT_MODE_TYPE = exports.REACT_FRAGMENT_TYPE = exports.REACT_PORTAL_TYPE = exports.REACT_ELEMENT_TYPE = void 0;
// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
exports.REACT_ELEMENT_TYPE = Symbol.for("react.element");
exports.REACT_PORTAL_TYPE = Symbol.for("react.portal");
exports.REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
exports.REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
exports.REACT_PROFILER_TYPE = Symbol.for("react.profiler");
exports.REACT_PROVIDER_TYPE = Symbol.for("react.provider");
exports.REACT_CONTEXT_TYPE = Symbol.for("react.context");
exports.REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context");
exports.REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
exports.REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
exports.REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
exports.REACT_MEMO_TYPE = Symbol.for("react.memo");
exports.REACT_LAZY_TYPE = Symbol.for("react.lazy");
exports.REACT_SCOPE_TYPE = Symbol.for("react.scope");
exports.REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
exports.REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
exports.REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
exports.REACT_CACHE_TYPE = Symbol.for("react.cache");
exports.REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker");
exports.REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for("react.default_value");
exports.REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
exports.REACT_POSTPONE_TYPE = Symbol.for("react.postpone");
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = "@@iterator";
function getIteratorFn(maybeIterable) {
    if (maybeIterable === null || typeof maybeIterable !== "object") {
        return null;
    }
    var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
    if (typeof maybeIterator === "function") {
        return maybeIterator;
    }
    return null;
}
exports.getIteratorFn = getIteratorFn;
