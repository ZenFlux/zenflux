"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactInstanceMap.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.set = exports.has = exports.get = exports.remove = void 0;
/**
 * `ReactInstanceMap` maintains a mapping from a public facing stateful
 * instance (key) and the internal representation (value). This allows public
 * methods to accept the user facing instance as an argument and map them back
 * to internal methods.
 *
 * Note that this module is currently shared and assumed to be stateless.
 * If this becomes an actual Map, that will break.
 */
/**
 * This API should be called `delete` but we'd have to make sure to always
 * transform these to strings for IE support. When this transform is fully
 * supported we can rename it.
 */
function remove(key) {
    key._reactInternals = undefined;
}
exports.remove = remove;
function get(key) {
    return key._reactInternals;
}
exports.get = get;
function has(key) {
    return key._reactInternals !== undefined;
}
exports.has = has;
function set(key, value) {
    key._reactInternals = value;
}
exports.set = set;
