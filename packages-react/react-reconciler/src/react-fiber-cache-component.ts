import { enableCache } from "@zenflux/react-shared/src/react-feature-flags";
import { REACT_CONTEXT_TYPE } from "@zenflux/react-shared/src/react-symbols";

import * as Scheduler from "@zenflux/react-scheduler";

import type { ReactContext } from "@zenflux/react-shared/src/react-types";

import type { Cache } from "@zenflux/react-shared/src/react-internal-types";

// In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.
// @ts-ignore
const AbortControllerLocal:
    typeof AbortController = enableCache ? typeof AbortController !== "undefined" ? AbortController : // $FlowFixMe[missing-this-annot]
        // $FlowFixMe[prop-missing]
        function AbortControllerShim( this: any ) {
            const listeners: any[] = [];
            const signal = this.signal = {
                aborted: false,
                addEventListener: ( type: any, listener: any ) => {
                    listeners.push( listener );
                }
            };

            this.abort = () => {
                signal.aborted = true;
                listeners.forEach( listener => listener() );
            };
        } : // $FlowFixMe[incompatible-type]
        null;

// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
const {
    unstable_scheduleCallback: scheduleCallback,
    unstable_NormalPriority: NormalPriority
} = Scheduler;
export const CacheContext: ReactContext<Cache> = enableCache ? {
    $$typeof: REACT_CONTEXT_TYPE,
    // We don't use Consumer/Provider for Cache components. So we'll cheat.
    Consumer: ( null as any ),
    Provider: ( null as any ),
    // We'll initialize these at the root.
    _currentValue: ( null as any ),
    _currentValue2: ( null as any ),
    _threadCount: 0,
    _defaultValue: ( null as any ),
    _globalName: ( null as any )
} : ( null as any );

if ( __DEV__ && enableCache ) {
    CacheContext._currentRenderer = null;
    CacheContext._currentRenderer2 = null;
}

// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).
export function createCache(): Cache {
    if ( ! enableCache ) {
        return ( null as any );
    }

    return {
        controller: new AbortControllerLocal(),
        data: new Map(),
        refCount: 0
    };
}

export function retainCache( cache: Cache ) {
    if ( ! enableCache ) {
        return;
    }

    if ( __DEV__ ) {
        if ( cache.controller.signal.aborted ) {
            console.warn( "A cache instance was retained after it was already freed. " + "This likely indicates a bug in React." );
        }
    }

    cache.refCount++;
}

// Cleanup a cache instance, potentially freeing it if there are no more references
export function releaseCache( cache: Cache ) {
    if ( ! enableCache ) {
        return;
    }

    cache.refCount--;

    if ( __DEV__ ) {
        if ( cache.refCount < 0 ) {
            console.warn( "A cache instance was released after it was already freed. " + "This likely indicates a bug in React." );
        }
    }

    if ( cache.refCount === 0 ) {
        scheduleCallback( NormalPriority, () => {
            cache.controller.abort();
        } );
    }
}

