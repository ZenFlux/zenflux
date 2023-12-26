/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactInstanceMap.js
 */

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
export function remove( key: { _reactInternals: undefined; } ) {
    key._reactInternals = undefined;
}

export function get( key: { _reactInternals: any; } ) {
    return key._reactInternals;
}

export function has( key: { _reactInternals: undefined; } ) {
    return key._reactInternals !== undefined;
}

export function set( key: { _reactInternals: any; }, value: any ) {
    key._reactInternals = value;
}
