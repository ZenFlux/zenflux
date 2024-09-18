"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_setGlobalCacheLimit = exports.unstable_createResource = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
var React = require("react");
var LRU_1 = require("@zenflux/react-cache/src/LRU");
var Pending = 0;
var Resolved = 1;
var Rejected = 2;
var ReactCurrentDispatcher = 
// eslint-disable-next-line import/namespace
React["__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED"]
    .ReactCurrentDispatcher;
function readContext(Context) {
    var dispatcher = ReactCurrentDispatcher.current;
    if (dispatcher === null) {
        throw new Error("react-cache: read and preload may only be called from within a " +
            "component's render. They are not supported in event handlers or " +
            "lifecycle methods.");
    }
    return dispatcher.readContext(Context);
}
function identityHashFn(input) {
    if (typeof input !== "string" &&
        typeof input !== "number" &&
        typeof input !== "boolean" &&
        input !== undefined &&
        input !== null) {
        console.error("Invalid key type. Expected a string, number, symbol, or boolean, " +
            "but instead received: %s" +
            "\n\nTo use non-primitive values as keys, you must pass a hash " +
            "function as the second argument to createResource().", input);
    }
    return input;
}
var CACHE_LIMIT = 500;
var lru = (0, LRU_1.createLRU)(CACHE_LIMIT);
var entries = new Map();
var CacheContext = React.createContext(null);
function accessResult(resource, fetch, input, key) {
    var entriesForResource = entries.get(resource);
    if (entriesForResource === undefined) {
        entriesForResource = new Map();
        entries.set(resource, entriesForResource);
    }
    var entry = entriesForResource.get(key);
    if (entry === undefined) {
        var thenable = fetch(input);
        thenable.then(function (value) {
            if (newResult_1.status === Pending) {
                var resolvedResult = newResult_1;
                resolvedResult.status = Resolved;
                resolvedResult.value = value;
            }
        }, function (error) {
            if (newResult_1.status === Pending) {
                var rejectedResult = newResult_1;
                rejectedResult.status = Rejected;
                rejectedResult.value = error;
            }
        });
        var newResult_1 = {
            status: Pending,
            value: thenable,
        };
        var newEntry = lru.add(newResult_1, deleteEntry.bind(null, resource, key));
        entriesForResource.set(key, newEntry);
        return newResult_1;
    }
    else {
        return lru.access(entry);
    }
}
function deleteEntry(resource, key) {
    var entriesForResource = entries.get(resource);
    if (entriesForResource !== undefined) {
        entriesForResource.delete(key);
        if (entriesForResource.size === 0) {
            entries.delete(resource);
        }
    }
}
function unstable_createResource(fetch, maybeHashInput) {
    var hashInput = maybeHashInput !== undefined ? maybeHashInput : identityHashFn;
    var resource = {
        read: function (input) {
            readContext(CacheContext);
            var key = hashInput(input);
            var result = accessResult(resource, fetch, input, key);
            switch (result.status) {
                case Pending: {
                    var suspender = result.value;
                    throw suspender;
                }
                case Resolved: {
                    var value = result.value;
                    return value;
                }
                case Rejected: {
                    var error = result.value;
                    throw error;
                }
                default:
                    return undefined;
            }
        },
        preload: function (input) {
            readContext(CacheContext);
            var key = hashInput(input);
            accessResult(resource, fetch, input, key);
        },
    };
    return resource;
}
exports.unstable_createResource = unstable_createResource;
function unstable_setGlobalCacheLimit(limit) {
    lru.setLimit(limit);
}
exports.unstable_setGlobalCacheLimit = unstable_setGlobalCacheLimit;
