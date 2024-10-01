/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/invokeGuardedCallbackImpl.js
 */

let fakeNode: Element = null as any;

if ( __DEV__ ) {
    if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function" &&
        typeof document !== "undefined" &&
        typeof document.createEvent === "function"
    ) {
        fakeNode = document.createElement( "react" );
    }
}

export default function invokeGuardedCallbackImpl<Args extends any[], Context>(
    this: { onError: ( error: any ) => void },
    name: string | null,
    func: ( ... Args: Args ) => any,
    context?: Context,
): void {
    if ( __DEV__ ) {
        if ( fakeNode ) {
            const evt = document.createEvent( "Event" );

            let didCall = false;
            let didError = true;

            const windowEvent = window.event;
            const windowEventDescriptor = Object.getOwnPropertyDescriptor(
                window,
                "event"
            );

            const restoreAfterDispatch = () => {
                fakeNode.removeEventListener( evtType, callCallback, false );

                if (
                    typeof window.event !== "undefined" &&
                    window.hasOwnProperty( "event" )
                ) {
                    // @ts-ignore - Cannot assign to read only property 'event' of object '#<Window>', also its deprecated
                    window[ "event" ] = windowEvent;
                }
            };

            const funcArgs = Array.prototype.slice.call( arguments, 3 ) as Args;
            const callCallback = () => {
                didCall = true;
                restoreAfterDispatch();
                func.apply( context, funcArgs );
                didError = false;
            };

            let error;
            let didSetError = false;
            let isCrossOriginError = false;

            const handleWindowError = ( event: ErrorEvent ) => {
                error = event.error;
                didSetError = true;
                if ( error === null && event.colno === 0 && event.lineno === 0 ) {
                    isCrossOriginError = true;
                }
                if ( event.defaultPrevented ) {
                    if ( error != null && typeof error === "object" ) {
                        try {
                            error._suppressLogging = true;
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch ( inner ) {
                            // Ignore.
                        }
                    }
                }
            };

            // Create a fake event type.
            const evtType = `react-${ name ? name : "invokeguardedcallback" }`;

            window.addEventListener( "error", handleWindowError );
            fakeNode.addEventListener( evtType, callCallback, false );

            evt.initEvent( evtType, false, false );
            fakeNode.dispatchEvent( evt );
            if ( windowEventDescriptor ) {
                Object.defineProperty( window, "event", windowEventDescriptor );
            }

            if ( didCall && didError ) {
                if ( ! didSetError ) {
                    error = new Error(
                        "An error was thrown inside one of your components, but React " +
                        "doesn't know what it was. This is likely due to browser " +
                        "flakiness. React does its best to preserve the \"Pause on " +
                        "exceptions\" behavior of the DevTools, which requires some " +
                        "DEV-mode only tricks. It's possible that these don't work in " +
                        "your browser. Try triggering the error in production mode, " +
                        "or switching to a modern browser. If you suspect that this is " +
                        "actually an issue with React, please file an issue."
                    );
                } else if ( isCrossOriginError ) {
                    error = new Error(
                        "A cross-origin error was thrown. React doesn't have access to " +
                        "the actual error object in development. " +
                        "See https://reactjs.org/link/crossorigin-error for more information."
                    );
                }
                this.onError( error );
            }

            window.removeEventListener( "error", handleWindowError );

            if ( didCall ) {
                return;
            } else {
                restoreAfterDispatch();
            }
        }

        const funcArgs = Array.prototype.slice.call( arguments, 3 );
        try {
            func.apply( context, funcArgs as Args );
        } catch ( error ) {
            this.onError( error );
        }
    } else {
        const funcArgs = Array.prototype.slice.call( arguments, 3 );
        try {
            func.apply( context, funcArgs as Args );
        } catch ( error ) {
            this.onError( error );
        }
    }
}
