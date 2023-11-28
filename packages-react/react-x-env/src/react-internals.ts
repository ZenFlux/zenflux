// eslint-disable-next-line no-restricted-imports
import "./env";

// eslint-disable-next-line import/order
import React from "react";

import type { BatchConfigTransition } from "@zenflux/react-reconciler/src/react-fiber-tracing-marker-component";

import type { CacheDispatcher, Dispatcher, Fiber } from "@zenflux/react-reconciler/src/react-internal-types";

import type { ReactServerContext } from "@zenflux/react-shared/src/react-types";

if ( "undefined" === typeof globalThis.React ) {
    // @ts-ignore
    globalThis.React = React;
}

if ( "undefined" === typeof React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache ) {
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache = {
        current: null,
    };
}

declare global {
    var React: {
        __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
            // Scheduler: typeof Scheduler;

            /**
             * Keeps track of the current Cache dispatcher.
             */
            ReactCurrentCache: {
                current: null | CacheDispatcher,
            },
            ReactCurrentDispatcher: {
                current: null | Dispatcher,
            },
            ReactCurrentActQueue: {
                current: ( null | Array<Function> ),

                // Used to reproduce behavior of `batchedUpdates` in legacy mode.
                isBatchingLegacy: boolean,
                didScheduleLegacyUpdate: boolean,

                // Tracks whether something called `use` during the current batch of work.
                // Determines whether we should yield to microtasks to unwrap already resolved
                // promises without suspending.
                didUsePromise: boolean,
            }

            ReactCurrentBatchConfig: {
                transition: BatchConfigTransition | null,
            },

            ReactCurrentOwner: {
                current: ( null | Fiber ),
            },
            ReactDebugCurrentFrame: {
                setExtraStackFrame: ( stack: null | string ) => void,
                getCurrentStack: null | ( () => string ),
                getStackAddendum: () => string,
            },

            ContextRegistry: {
                [ globalName: string ]: ReactServerContext<any>,
            }
        },
    };

    var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;

    var trustedTypes: {
        isHTML: ( value: any ) => boolean,
        isScript: ( value: any ) => boolean,
        isScriptURL: ( value: any ) => boolean,
        // TrustedURLs are deprecated and will be removed soon: https://github.com/WICG/trusted-types/pull/204
        isURL?: ( value: any ) => boolean,
    };

    var MSApp: {
        execUnsafeLocalFunction: ( fn: Function ) => void,
    };
}
