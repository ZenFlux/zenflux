/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ConsolePatchingDev.js
 */

// Helpers to patch console.logs to avoid logging during side effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.
let disabledDepth = 0;

let prevLog: { ( ... data: any[] ): void; ( message?: any, ... optionalParams: any[] ): void; };
let prevInfo: { ( ... data: any[] ): void; ( message?: any, ... optionalParams: any[] ): void; };
let prevWarn: { ( ... data: any[] ): void; ( message?: any, ... optionalParams: any[] ): void; };
let prevError: { ( ... data: any[] ): void; ( message?: any, ... optionalParams: any[] ): void; };

let prevGroup: { ( ... data: any[] ): void; ( ... label: any[] ): void; };
let prevGroupCollapsed: { ( ... data: any[] ): void; ( ... label: any[] ): void; };
let prevGroupEnd: { (): void; (): void; };

function disabledLog() {
}

disabledLog.__reactDisabledLog = true;

export function disableLogs(): void {
    if ( __DEV__ ) {
        if ( disabledDepth === 0 ) {

            prevLog = console.log;
            prevInfo = console.info;
            prevWarn = console.warn;
            prevError = console.error;
            prevGroup = console.group;
            prevGroupCollapsed = console.groupCollapsed;
            prevGroupEnd = console.groupEnd;

            // https://github.com/facebook/react/issues/19099
            const props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
            };

            Object.defineProperties( console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
            } );
        }

        disabledDepth++;
    }
}

export function reenableLogs(): void {
    if ( __DEV__ ) {
        disabledDepth--;

        if ( disabledDepth === 0 ) {

            const props = {
                configurable: true,
                enumerable: true,
                writable: true
            };

            Object.defineProperties( console, {
                log: {
                    ... props,
                    value: prevLog
                },
                info: {
                    ... props,
                    value: prevInfo
                },
                warn: {
                    ... props,
                    value: prevWarn
                },
                error: {
                    ... props,
                    value: prevError
                },
                group: {
                    ... props,
                    value: prevGroup
                },
                groupCollapsed: {
                    ... props,
                    value: prevGroupCollapsed
                },
                groupEnd: {
                    ... props,
                    value: prevGroupEnd
                }
            } );
        }

        if ( disabledDepth < 0 ) {
            console.error( "disabledDepth fell below zero. " + "This is a bug in React. Please file an issue." );
        }
    }
}
