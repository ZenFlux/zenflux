/* eslint-disable */

// @ts-nocheck

import "./env";

import {
    REACT_CACHE_TYPE,
    REACT_LEGACY_HIDDEN_TYPE,
    REACT_OFFSCREEN_TYPE, REACT_SUSPENSE_LIST_TYPE
} from "@zenflux/react-shared/src/react-symbols";

import type { Dispatcher, CacheDispatcher, Fiber } from "@zenflux/react-shared/src/react-internal-types";

import type { ReactServerContext } from "@zenflux/react-shared/src/react-types";
import type { BatchConfigTransition } from "@zenflux/react-shared/src/react-internal-types/transition";

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

const UNTERMINATED = 0;
const TERMINATED = 1;
const ERRORED = 2;

function createCacheNode<T>(): CacheNode<T> {
    return {
        s: UNTERMINATED, // status, represents whether the cached computation returned a value or threw an error
        v: undefined, // value, either the cached result or an error, depending on s
        o: null, // object cache, a WeakMap where non-primitive arguments are stored
        p: null, // primitive cache, a regular Map where primitive arguments are stored.
    };
}

function createCacheRoot<T>(): WeakMap<Function | Object, CacheNode<T>> {
    return new WeakMap();
}

function initGlobalReact( react ) {
    global.React = react;

    if ( global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ) {
        if ( ! global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache ) {
            React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache = {
                current: null,
            };
        }

        if ( ! global.React.unstable_getCacheForType ) {
            function getCacheForType<T>(resourceType: () => T): T {
                const dispatcher = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache.current;
                if (!dispatcher) {
                    // If there is no dispatcher, then we treat this as not being cached.
                    return resourceType();
                }
                return dispatcher.getCacheForType(resourceType);
            }

            global.React.unstable_getCacheForType = getCacheForType;
        }
    }

    if ( ! global.React.unstable_Activity ) {
        global.React.unstable_Activity = REACT_OFFSCREEN_TYPE;
    }

    if ( ! global.React.unstable_LegacyHidden ) {
        global.React.unstable_LegacyHidden = REACT_LEGACY_HIDDEN_TYPE;
    }

    if ( ! global.React.unstable_Cache ) {
        global.React.unstable_Cache = REACT_CACHE_TYPE;
    }

    if ( ! global.React.unstable_SuspenseList ) {
        global.React.unstable_SuspenseList = REACT_SUSPENSE_LIST_TYPE;
    }

    if ( ! global.React.cache ) {
        global.React.cache = function cache<A extends Array<any>, T>(fn: (...args: A) => T): (...args: A) => T {
            return function (...args: A) {
                const dispatcher = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentCache.current;
                if (!dispatcher) {
                    return fn.apply(null, args);
                }
                const fnMap: WeakMap<any, CacheNode<T>> = dispatcher.getCacheForType(
                    createCacheRoot,
                );
                let fnNode = fnMap.get(fn);
                let cacheNode: CacheNode<T>;
                if (fnNode === undefined) {
                    cacheNode = createCacheNode();
                    fnMap.set(fn, cacheNode);
                } else {
                    cacheNode = fnNode;
                }
                for (let i = 0, l = args.length; i < l; i++) {
                    const arg = args[i];
                    if (
                        typeof arg === 'function' ||
                        (typeof arg === 'object' && arg !== null)
                    ) {
                        let objectCache = cacheNode.o;
                        if (objectCache === null) {
                            cacheNode.o = objectCache = new WeakMap();
                        }
                        const objectNode = objectCache.get(arg);
                        if (objectNode === undefined) {
                            cacheNode = createCacheNode();
                            objectCache.set(arg, cacheNode);
                        } else {
                            cacheNode = objectNode;
                        }
                    } else {
                        let primitiveCache = cacheNode.p;
                        if (primitiveCache === null) {
                            cacheNode.p = primitiveCache = new Map();
                        }
                        const primitiveNode = primitiveCache.get(arg);
                        if (primitiveNode === undefined) {
                            cacheNode = createCacheNode();
                            primitiveCache.set(arg, cacheNode);
                        } else {
                            cacheNode = primitiveNode;
                        }
                    }
                }
                if (cacheNode.s === TERMINATED) {
                    return cacheNode.v;
                }
                if (cacheNode.s === ERRORED) {
                    throw cacheNode.v;
                }
                try {
                    const result = fn.apply(null, args);
                    const terminatedNode: TerminatedCacheNode<T> = cacheNode as any;
                    terminatedNode.s = TERMINATED;
                    terminatedNode.v = result;
                    return result;
                } catch (error) {
                    const erroredNode: ErroredCacheNode<T> = cacheNode as any;
                    erroredNode.s = ERRORED;
                    erroredNode.v = error;
                    throw error;
                }
            };
        }
    }
}

if ( global.React ) {
    initGlobalReact( global.React );
} else {
    const react = require( "react" );

    initGlobalReact( react );
}

const _React = global.React;

export default _React;
