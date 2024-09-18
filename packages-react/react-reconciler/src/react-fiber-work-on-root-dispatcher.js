"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popCacheDispatcher = exports.pushCacheDispatcher = exports.popDispatcher = exports.pushDispatcher = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_fiber_cache_1 = require("@zenflux/react-reconciler/src/react-fiber-cache");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var ReactCurrentDispatcher = react_shared_internals_1.default.ReactCurrentDispatcher, ReactCurrentCache = react_shared_internals_1.default.ReactCurrentCache;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function pushDispatcher(container) {
    var prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly;
    if (prevDispatcher === null) {
        // The React isomorphic package does not include a default dispatcher.
        // Instead the first renderer will lazily attach one, in order to give
        // nicer error messages.
        return react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly;
    }
    else {
        return prevDispatcher;
    }
}
exports.pushDispatcher = pushDispatcher;
function popDispatcher(prevDispatcher) {
    ReactCurrentDispatcher.current = prevDispatcher;
}
exports.popDispatcher = popDispatcher;
function pushCacheDispatcher() {
    if (react_feature_flags_1.enableCache) {
        var prevCacheDispatcher = ReactCurrentCache.current;
        ReactCurrentCache.current = react_fiber_cache_1.DefaultCacheDispatcher;
        return prevCacheDispatcher;
    }
    else {
        return null;
    }
}
exports.pushCacheDispatcher = pushCacheDispatcher;
function popCacheDispatcher(prevCacheDispatcher) {
    if (react_feature_flags_1.enableCache) {
        ReactCurrentCache.current = prevCacheDispatcher;
    }
}
exports.popCacheDispatcher = popCacheDispatcher;
