/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/shallowEqual.js
 */
import is from "@zenflux/react-shared/src/object-is";

import hasOwnProperty from "@zenflux/react-shared/src/has-own-property";

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual( objA: any, objB: any ): boolean {
    if ( is( objA, objB ) ) {
        return true;
    }

    if ( typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null ) {
        return false;
    }

    const keysA = Object.keys( objA );
    const keysB = Object.keys( objB );

    if ( keysA.length !== keysB.length ) {
        return false;
    }

    // Test for A's keys different from B.
    for ( let i = 0 ; i < keysA.length ; i++ ) {
        const currentKey = keysA[ i ];

        if ( ! hasOwnProperty.call( objB, currentKey ) ||
            ! is( objA[ currentKey ], objB[ currentKey ] ) ) {
            return false;
        }
    }

    return true;
}

export default shallowEqual;
