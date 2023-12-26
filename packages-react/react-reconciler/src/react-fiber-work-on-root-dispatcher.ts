import { enableCache } from "@zenflux/react-shared/src/react-feature-flags";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { DefaultCacheDispatcher } from "@zenflux/react-reconciler/src/react-fiber-cache";

import { ReactFiberHooksDispatcher } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

const {
    ReactCurrentDispatcher,
    ReactCurrentCache,
} = ReactSharedInternals;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function pushDispatcher( container: any ) {
    const prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = ReactFiberHooksDispatcher.contextOnly;

    if ( prevDispatcher === null ) {
        // The React isomorphic package does not include a default dispatcher.
        // Instead the first renderer will lazily attach one, in order to give
        // nicer error messages.
        return ReactFiberHooksDispatcher.contextOnly;
    } else {
        return prevDispatcher;
    }
}

export function popDispatcher( prevDispatcher: any ) {
    ReactCurrentDispatcher.current = prevDispatcher;
}

export function pushCacheDispatcher() {
    if ( enableCache ) {
        const prevCacheDispatcher = ReactCurrentCache.current;
        ReactCurrentCache.current = DefaultCacheDispatcher;
        return prevCacheDispatcher;
    } else {
        return null;
    }
}

export function popCacheDispatcher( prevCacheDispatcher: any ) {
    if ( enableCache ) {
        ReactCurrentCache.current = prevCacheDispatcher;
    }
}

