"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popCacheProvider = exports.pushCacheProvider = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
function pushCacheProvider(workInProgress, cache) {
    if (!react_feature_flags_1.enableCache) {
        return;
    }
    (0, react_fiber_new_context_1.pushProvider)(workInProgress, react_fiber_cache_component_1.CacheContext, cache);
}
exports.pushCacheProvider = pushCacheProvider;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function popCacheProvider(workInProgress, cache) {
    if (!react_feature_flags_1.enableCache) {
        return;
    }
    (0, react_fiber_new_context_1.popProvider)(react_fiber_cache_component_1.CacheContext, workInProgress);
}
exports.popCacheProvider = popCacheProvider;
