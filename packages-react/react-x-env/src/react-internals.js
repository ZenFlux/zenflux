"use strict";
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
require("./env");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var UNTERMINATED = 0;
var TERMINATED = 1;
var ERRORED = 2;
function createCacheNode() {
    return {
        s: UNTERMINATED,
        v: undefined,
        o: null,
        p: null, // primitive cache, a regular Map where primitive arguments are stored.
    };
}
function createCacheRoot() {
    return new WeakMap();
}
function initGlobalReact(react) {
    global.React = react;
    if (global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        if (!global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache) {
            React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache = {
                current: null,
            };
        }
        if (!global.React.unstable_getCacheForType) {
            function getCacheForType(resourceType) {
                var dispatcher = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache.current;
                if (!dispatcher) {
                    // If there is no dispatcher, then we treat this as not being cached.
                    return resourceType();
                }
                return dispatcher.getCacheForType(resourceType);
            }
            global.React.unstable_getCacheForType = getCacheForType;
        }
    }
    if (!global.React.unstable_Activity) {
        global.React.unstable_Activity = react_symbols_1.REACT_OFFSCREEN_TYPE;
    }
    if (!global.React.unstable_LegacyHidden) {
        global.React.unstable_LegacyHidden = react_symbols_1.REACT_LEGACY_HIDDEN_TYPE;
    }
    if (!global.React.unstable_Cache) {
        global.React.unstable_Cache = react_symbols_1.REACT_CACHE_TYPE;
    }
    if (!global.React.unstable_SuspenseList) {
        global.React.unstable_SuspenseList = react_symbols_1.REACT_SUSPENSE_LIST_TYPE;
    }
    if (!global.React.cache) {
        global.React.cache = function cache(fn) {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var dispatcher = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache.current;
                if (!dispatcher) {
                    return fn.apply(null, args);
                }
                var fnMap = dispatcher.getCacheForType(createCacheRoot);
                var fnNode = fnMap.get(fn);
                var cacheNode;
                if (fnNode === undefined) {
                    cacheNode = createCacheNode();
                    fnMap.set(fn, cacheNode);
                }
                else {
                    cacheNode = fnNode;
                }
                for (var i = 0, l = args.length; i < l; i++) {
                    var arg = args[i];
                    if (typeof arg === 'function' ||
                        (typeof arg === 'object' && arg !== null)) {
                        var objectCache = cacheNode.o;
                        if (objectCache === null) {
                            cacheNode.o = objectCache = new WeakMap();
                        }
                        var objectNode = objectCache.get(arg);
                        if (objectNode === undefined) {
                            cacheNode = createCacheNode();
                            objectCache.set(arg, cacheNode);
                        }
                        else {
                            cacheNode = objectNode;
                        }
                    }
                    else {
                        var primitiveCache = cacheNode.p;
                        if (primitiveCache === null) {
                            cacheNode.p = primitiveCache = new Map();
                        }
                        var primitiveNode = primitiveCache.get(arg);
                        if (primitiveNode === undefined) {
                            cacheNode = createCacheNode();
                            primitiveCache.set(arg, cacheNode);
                        }
                        else {
                            cacheNode = primitiveNode;
                        }
                    }
                }
                if (cacheNode.s === TERMINATED) {
                    return cacheNode.v;
                }
                if (cacheNode.s === ERRORED) {
                    throw cacheNode.v;
                }
                try {
                    var result = fn.apply(null, args);
                    var terminatedNode = cacheNode;
                    terminatedNode.s = TERMINATED;
                    terminatedNode.v = result;
                    return result;
                }
                catch (error) {
                    var erroredNode = cacheNode;
                    erroredNode.s = ERRORED;
                    erroredNode.v = error;
                    throw error;
                }
            };
        };
    }
}
if (global.React) {
    initGlobalReact(global.React);
}
else {
    var react = require("react");
    initGlobalReact(react);
}
var _React = global.React;
exports.default = _React;
