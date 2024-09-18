"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMemoCache = void 0;
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
function useMemoCache(size) {
    var memoCache = null;
    // Fast-path, load memo cache from wip fiber if already prepared
    var updateQueue = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue;
    if (updateQueue !== null) {
        memoCache = updateQueue.memoCache;
    }
    // Otherwise clone from the current fiber
    if (memoCache == null) {
        var current = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.alternate;
        if (current !== null) {
            var currentUpdateQueue = current.updateQueue;
            if (currentUpdateQueue !== null) {
                var currentMemoCache = currentUpdateQueue.memoCache;
                if (currentMemoCache != null) {
                    memoCache = {
                        data: currentMemoCache.data.map(function (array) { return array.slice(); }),
                        index: 0
                    };
                }
            }
        }
    }
    // Finally fall back to allocating a fresh instance of the cache
    if (memoCache == null) {
        memoCache = {
            data: [],
            index: 0
        };
    }
    if (updateQueue === null) {
        updateQueue = react_fiber_hooks_shared_1.ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.updateQueue = updateQueue;
    }
    if (null === memoCache) {
        throw new Error("memoCache should be initialized at this point.");
    }
    updateQueue.memoCache = memoCache;
    var data = memoCache.data[memoCache.index];
    if (data === undefined) {
        data = memoCache.data[memoCache.index] = new Array(size);
        for (var i = 0; i < size; i++) {
            data[i] = react_symbols_1.REACT_MEMO_CACHE_SENTINEL;
        }
    }
    else if (data.length !== size) {
        // TODO: consider warning or throwing here
        if (__DEV__) {
            console.error("Expected a constant size argument for each invocation of useMemoCache. " + "The previous cache was allocated with size %s but size %s was requested.", data.length, size);
        }
    }
    memoCache.index++;
    return data;
}
exports.useMemoCache = useMemoCache;
