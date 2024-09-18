"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/shallowEqual.js
 */
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var has_own_property_1 = require("@zenflux/react-shared/src/has-own-property");
/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA, objB) {
    if ((0, object_is_1.default)(objA, objB)) {
        return true;
    }
    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false;
    }
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) {
        return false;
    }
    // Test for A's keys different from B.
    for (var i = 0; i < keysA.length; i++) {
        var currentKey = keysA[i];
        if (!has_own_property_1.default.call(objB, currentKey) ||
            !(0, object_is_1.default)(objA[currentKey], objB[currentKey])) {
            return false;
        }
    }
    return true;
}
exports.default = shallowEqual;
