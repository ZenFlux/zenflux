"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseCache = exports.retainCache = exports.createCache = exports.CacheContext = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var Scheduler = require("@zenflux/react-scheduler");
// In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.
// @ts-ignore
var AbortControllerLocal = react_feature_flags_1.enableCache ? typeof AbortController !== "undefined" ? AbortController : // $FlowFixMe[missing-this-annot]
    // $FlowFixMe[prop-missing]
    function AbortControllerShim() {
        var listeners = [];
        var signal = this.signal = {
            aborted: false,
            addEventListener: function (type, listener) {
                listeners.push(listener);
            }
        };
        this.abort = function () {
            signal.aborted = true;
            listeners.forEach(function (listener) { return listener(); });
        };
    } : // $FlowFixMe[incompatible-type]
    null;
// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
var scheduleCallback = Scheduler.unstable_scheduleCallback, NormalPriority = Scheduler.unstable_NormalPriority;
exports.CacheContext = react_feature_flags_1.enableCache ? {
    $$typeof: react_symbols_1.REACT_CONTEXT_TYPE,
    // We don't use Consumer/Provider for Cache components. So we'll cheat.
    Consumer: null,
    Provider: null,
    // We'll initialize these at the root.
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0,
    _defaultValue: null,
    _globalName: null
} : null;
if (__DEV__ && react_feature_flags_1.enableCache) {
    exports.CacheContext._currentRenderer = null;
    exports.CacheContext._currentRenderer2 = null;
}
// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).
function createCache() {
    if (!react_feature_flags_1.enableCache) {
        return null;
    }
    return {
        controller: new AbortControllerLocal(),
        data: new Map(),
        refCount: 0
    };
}
exports.createCache = createCache;
function retainCache(cache) {
    if (!react_feature_flags_1.enableCache) {
        return;
    }
    if (__DEV__) {
        if (cache.controller.signal.aborted) {
            console.warn("A cache instance was retained after it was already freed. " + "This likely indicates a bug in React.");
        }
    }
    cache.refCount++;
}
exports.retainCache = retainCache;
// Cleanup a cache instance, potentially freeing it if there are no more references
function releaseCache(cache) {
    if (!react_feature_flags_1.enableCache) {
        return;
    }
    cache.refCount--;
    if (__DEV__) {
        if (cache.refCount < 0) {
            console.warn("A cache instance was released after it was already freed. " + "This likely indicates a bug in React.");
        }
    }
    if (cache.refCount === 0) {
        scheduleCallback(NormalPriority, function () {
            cache.controller.abort();
        });
    }
}
exports.releaseCache = releaseCache;
