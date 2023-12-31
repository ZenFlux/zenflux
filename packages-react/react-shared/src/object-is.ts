/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/objectIs.js
 */

/**
 * Inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is( x: any, y: any ) {
    return x === y && ( x !== 0 || 1 / x === 1 / y ) || x !== x && y !== y;
}

const objectIs: ( x: any, y: any ) => boolean =
    typeof Object.is === "function" ? Object.is : is;

export default objectIs;
