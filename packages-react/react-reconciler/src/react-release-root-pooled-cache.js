"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactReleaseRootPooledCache = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
function reactReleaseRootPooledCache(root, remainingLanes) {
    if (react_feature_flags_1.enableCache) {
        var pooledCacheLanes = root.pooledCacheLanes &= remainingLanes;
        if (pooledCacheLanes === fiber_lane_constants_1.NoLanes) {
            // None of the remaining work relies on the cache pool. Clear it so
            // subsequent requests get a new cache
            var pooledCache = root.pooledCache;
            if (pooledCache != null) {
                root.pooledCache = null;
                (0, react_fiber_cache_component_1.releaseCache)(pooledCache);
            }
        }
    }
}
exports.reactReleaseRootPooledCache = reactReleaseRootPooledCache;
