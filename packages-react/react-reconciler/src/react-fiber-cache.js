"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultCacheDispatcher = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
function getCacheSignal() {
    if (!react_feature_flags_1.enableCache) {
        throw new Error("Not implemented.");
    }
    var cache = (0, react_fiber_new_context_1.readContext)(react_fiber_cache_component_1.CacheContext);
    return cache.controller.signal;
}
function getCacheForType(resourceType) {
    if (!react_feature_flags_1.enableCache) {
        throw new Error("Not implemented.");
    }
    var cache = (0, react_fiber_new_context_1.readContext)(react_fiber_cache_component_1.CacheContext);
    var cacheForType = cache.data.get(resourceType);
    if (cacheForType === undefined) {
        cacheForType = resourceType();
        cache.data.set(resourceType, cacheForType);
    }
    return cacheForType;
}
exports.DefaultCacheDispatcher = {
    getCacheSignal: getCacheSignal,
    getCacheForType: getCacheForType
};
