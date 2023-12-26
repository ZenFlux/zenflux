/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/consoleWithStackDev.js
 */
import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

let suppressWarning = false;

export function setSuppressWarning( newSuppressWarning: boolean ) {
    if ( __DEV__ ) {
        suppressWarning = newSuppressWarning;
    }
}

// In DEV, calls to console.warn and console.error get replaced
// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.
export function warn( format: any, ... args: any[] ) {
    if ( __DEV__ ) {
        if ( ! suppressWarning ) {
            printWarning( "warn", format, args );
        }
    }
}

export function error( format: any, ... args: any[] ) {
    if ( __DEV__ ) {
        if ( ! suppressWarning ) {
            printWarning( "error", format, args );
        }
    }
}

function printWarning( level: string | number, format: any, args: any[] ) {
    // When changing this logic, you might want to also
    // update consoleWithStackDev.www.js as well.
    if ( __DEV__ ) {
        const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
        const stack = ReactDebugCurrentFrame.getStackAddendum();

        if ( stack !== "" ) {
            format += "%s";
            args = args.concat( [ stack ] );
        }

        // not-used: eslint-disable-next-line react-internal/safe-string-coercion
        const argsWithFormat = args.map( item => String( item ) );
        // Careful: RN currently depends on this prefix
        argsWithFormat.unshift( "Warning: " + format );
        // We intentionally don't use spread (or .apply) directly because it
        // breaks IE9: https://github.com/facebook/react/issues/13610
        // not-used: eslint-disable-next-line react-internal/no-production-logging
        // @ts-ignore
        Function.prototype.apply.call( console[ level ], console, argsWithFormat );
    }
}
