"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOffscreenDeferredCache = exports.getSuspendedCache = exports.getPendingTransitions = exports.popTransition = exports.pushTransition = exports.popRootTransition = exports.pushRootTransition = exports.requestCacheFromPool = exports.requestCurrentTransition = exports.NoTransition = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_fiber_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-stack");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var isPrimaryRenderer = globalThis.__RECONCILER__CONFIG__.isPrimaryRenderer;
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
exports.NoTransition = null;
function requestCurrentTransition() {
    return ReactCurrentBatchConfig.transition;
}
exports.requestCurrentTransition = requestCurrentTransition;
// When retrying a Suspense/Offscreen boundary, we restore the cache that was
// used during the previous render by placing it here, on the stack.
var resumedCache = (0, react_fiber_stack_1.createCursor)(null);
// During the render/synchronous commit phase, we don't actually process the
// transitions. Therefore, we want to lazily combine transitions. Instead of
// comparing the arrays of transitions when we combine them and storing them
// and filtering out the duplicates, we will instead store the unprocessed transitions
// in an array and actually filter them in the passive phase.
var transitionStack = (0, react_fiber_stack_1.createCursor)(null);
function peekCacheFromPool() {
    if (!react_feature_flags_1.enableCache) {
        return null;
    }
    // Check if the cache pool already has a cache we can use.
    // If we're rendering inside a Suspense boundary that is currently hidden,
    // we should use the same cache that we used during the previous render, if
    // one exists.
    var cacheResumedFromPreviousRender = resumedCache.current;
    if (cacheResumedFromPreviousRender !== null) {
        return cacheResumedFromPreviousRender;
    }
    // Otherwise, check the root's cache pool.
    var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
    return root.pooledCache;
}
function requestCacheFromPool(renderLanes) {
    // Similar to previous function, except if there's not already a cache in the
    // pool, we allocate a new one.
    var cacheFromPool = peekCacheFromPool();
    if (cacheFromPool !== null) {
        return cacheFromPool;
    }
    // Create a fresh cache and add it to the root cache pool. A cache can have
    // multiple owners:
    // - A cache pool that lives on the FiberRoot. This is where all fresh caches
    //   are originally created (TODO: except during refreshes, until we implement
    //   this correctly). The root takes ownership immediately when the cache is
    //   created. Conceptually, root.pooledCache is an Option<Arc<Cache>> (owned),
    //   and the return value of this function is a &Arc<Cache> (borrowed).
    // - One of several fiber types: host root, cache boundary, suspense
    //   component. These retain and release in the commit phase.
    var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
    var freshCache = (0, react_fiber_cache_component_1.createCache)();
    root.pooledCache = freshCache;
    (0, react_fiber_cache_component_1.retainCache)(freshCache);
    if (freshCache !== null) {
        root.pooledCacheLanes |= renderLanes;
    }
    return freshCache;
}
exports.requestCacheFromPool = requestCacheFromPool;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function pushRootTransition(workInProgress, root, renderLanes) {
    if (react_feature_flags_1.enableTransitionTracing) {
        var rootTransitions = (0, react_fiber_work_in_progress_1.getWorkInProgressTransitions)();
        (0, react_fiber_stack_1.push)(transitionStack, rootTransitions, workInProgress);
    }
}
exports.pushRootTransition = pushRootTransition;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function popRootTransition(workInProgress, root, renderLanes) {
    if (react_feature_flags_1.enableTransitionTracing) {
        (0, react_fiber_stack_1.pop)(transitionStack, workInProgress);
    }
}
exports.popRootTransition = popRootTransition;
function pushTransition(offscreenWorkInProgress, prevCachePool, newTransitions) {
    if (react_feature_flags_1.enableCache) {
        if (prevCachePool === null) {
            (0, react_fiber_stack_1.push)(resumedCache, resumedCache.current, offscreenWorkInProgress);
        }
        else {
            (0, react_fiber_stack_1.push)(resumedCache, prevCachePool.pool, offscreenWorkInProgress);
        }
    }
    if (react_feature_flags_1.enableTransitionTracing) {
        if (transitionStack.current === null) {
            (0, react_fiber_stack_1.push)(transitionStack, newTransitions, offscreenWorkInProgress);
        }
        else if (newTransitions === null) {
            (0, react_fiber_stack_1.push)(transitionStack, transitionStack.current, offscreenWorkInProgress);
        }
        else {
            (0, react_fiber_stack_1.push)(transitionStack, transitionStack.current.concat(newTransitions), offscreenWorkInProgress);
        }
    }
}
exports.pushTransition = pushTransition;
function popTransition(workInProgress, current) {
    if (current !== null) {
        if (react_feature_flags_1.enableTransitionTracing) {
            (0, react_fiber_stack_1.pop)(transitionStack, workInProgress);
        }
        if (react_feature_flags_1.enableCache) {
            (0, react_fiber_stack_1.pop)(resumedCache, workInProgress);
        }
    }
}
exports.popTransition = popTransition;
function getPendingTransitions() {
    if (!react_feature_flags_1.enableTransitionTracing) {
        return null;
    }
    return transitionStack.current;
}
exports.getPendingTransitions = getPendingTransitions;
function getSuspendedCache() {
    if (!react_feature_flags_1.enableCache) {
        return null;
    }
    // This function is called when a Suspense boundary suspends. It returns the
    // cache that would have been used to render fresh data during this render,
    // if there was any, so that we can resume rendering with the same cache when
    // we receive more data.
    var cacheFromPool = peekCacheFromPool();
    if (cacheFromPool === null) {
        return null;
    }
    return {
        // We must also save the parent, so that when we resume we can detect
        // a refresh.
        parent: isPrimaryRenderer ? react_fiber_cache_component_1.CacheContext._currentValue : react_fiber_cache_component_1.CacheContext._currentValue2,
        pool: cacheFromPool
    };
}
exports.getSuspendedCache = getSuspendedCache;
function getOffscreenDeferredCache() {
    if (!react_feature_flags_1.enableCache) {
        return null;
    }
    var cacheFromPool = peekCacheFromPool();
    if (cacheFromPool === null) {
        return null;
    }
    return {
        // We must also store the parent, so that when we resume we can detect
        // a refresh.
        parent: isPrimaryRenderer ? react_fiber_cache_component_1.CacheContext._currentValue : react_fiber_cache_component_1.CacheContext._currentValue2,
        pool: cacheFromPool
    };
}
exports.getOffscreenDeferredCache = getOffscreenDeferredCache;
