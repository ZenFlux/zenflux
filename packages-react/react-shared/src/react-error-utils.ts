/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactErrorUtils.js
 */

import invokeGuardedCallbackImpl from "@zenflux/react-shared/src/invoke-guarded-callback-impl";

// Used by Fiber to simulate a try-catch.
let hasError: boolean = false;
let caughtError: unknown = null;

// Used by event system to capture/rethrow the first error.
let hasRethrowError: boolean = false;
let rethrowError: unknown = null;

const reporter = {
    onError( error: unknown ) {
        hasError = true;
        caughtError = error;
    }

};

/**
 * Call a function while guarding against errors that happens within it.
 * Returns an error if it throws, otherwise null.
 *
 * In production, this is implemented using a try-catch. The reason we don't
 * use a try-catch directly is so that we can swap out a different
 * implementation in DEV mode.
 */
export function invokeGuardedCallback<Context>(
    name: string | null,
    func: ( ... args: any[] ) => any,
    context?: Context,
    ... args: any[]
): void {
    hasError = false;
    caughtError = null;
    invokeGuardedCallbackImpl.apply( reporter, arguments as any );
}

/**
 * Same as invokeGuardedCallback, but instead of returning an error, it stores
 * it in a global so it can be rethrown by `rethrowCaughtError` later.
 *
 * TODO: See if caughtError and rethrowError can be unified.
 */
export function invokeGuardedCallbackAndCatchFirstError<Context>( this: unknown, name: string | null, func: ( ... args: any[] ) => any, context: Context, ... args: any[] ): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    invokeGuardedCallback.apply( this, arguments as any );

    if ( hasError ) {
        const error = clearCaughtError();

        if ( ! hasRethrowError ) {
            hasRethrowError = true;
            rethrowError = error;
        }
    }
}

/**
 * During execution of guarded functions we will capture the first error which
 * we will rethrow to be handled by the top level error handler.
 */
export function rethrowCaughtError() {
    if ( hasRethrowError ) {
        const error = rethrowError;
        hasRethrowError = false;
        rethrowError = null;
        throw error;
    }
}

export function hasCaughtError(): boolean {
    return hasError;
}

export function clearCaughtError(): any {
    if ( hasError ) {
        const error = caughtError;
        hasError = false;
        caughtError = null;
        return error;
    } else {
        throw new Error( "clearCaughtError was called but no error was captured. This error " + "is likely caused by a bug in React. Please file an issue." );
    }
}
