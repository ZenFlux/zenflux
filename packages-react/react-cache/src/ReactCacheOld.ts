/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import * as React from "react";

import { createLRU } from "@zenflux/react-cache/src/LRU";

import type { Thenable } from "@zenflux/react-shared/src/react-types";

interface Suspender {
    then( resolve: () => any, reject: () => any ): any;
}

type PendingResult = {
    status: 0,
    value: Suspender,
};

type ResolvedResult<V> = {
    status: 1,
    value: V,
};

type RejectedResult = {
    status: 2,
    value: any,
};

type Result<V> = PendingResult | ResolvedResult<V> | RejectedResult;

interface Resource<I, V> {
    read( input: I ): V,

    preload( input: I ): void,
}

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

const ReactCurrentDispatcher =

    React[ "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED" ]
        .ReactCurrentDispatcher;

function readContext( Context: React.Context<any> ) {
    const dispatcher = ReactCurrentDispatcher.current;
    if ( dispatcher === null ) {
        throw new Error(
            "react-cache: read and preload may only be called from within a " +
            "component's render. They are not supported in event handlers or " +
            "lifecycle methods.",
        );
    }
    return dispatcher.readContext( Context );
}

function identityHashFn( input: any ) {
    if (
        typeof input !== "string" &&
        typeof input !== "number" &&
        typeof input !== "boolean" &&
        input !== undefined &&
        input !== null
    ) {
        console.error(
            "Invalid key type. Expected a string, number, symbol, or boolean, " +
            "but instead received: %s" +
            "\n\nTo use non-primitive values as keys, you must pass a hash " +
            "function as the second argument to createResource().",
            input,
        );
    }
    return input;
}

const CACHE_LIMIT = 500;
const lru = createLRU<any>( CACHE_LIMIT );

const entries: Map<Resource<any, any>, Map<any, any>> = new Map();

const CacheContext = React.createContext<any>( null );

function accessResult<I, K, V>(
    resource: Resource<I, V>,
    fetch: ( input: I ) => Thenable<V>,
    input: I,
    key: K,
): Result<V> {
    let entriesForResource = entries.get( resource );
    if ( entriesForResource === undefined ) {
        entriesForResource = new Map();
        entries.set( resource, entriesForResource );
    }
    const entry = entriesForResource.get( key );
    if ( entry === undefined ) {
        const thenable = fetch( input );
        thenable.then(
            value => {
                if ( newResult.status === Pending ) {
                    const resolvedResult: ResolvedResult<V> = newResult as any;
                    resolvedResult.status = Resolved;
                    resolvedResult.value = value;
                }
            },
            error => {
                if ( newResult.status === Pending ) {
                    const rejectedResult: RejectedResult = newResult as any;
                    rejectedResult.status = Rejected;
                    rejectedResult.value = error;
                }
            },
        );
        const newResult: PendingResult = {
            status: Pending,
            value: thenable,
        };
        const newEntry = lru.add( newResult, deleteEntry.bind( null, resource, key ) );
        entriesForResource.set( key, newEntry );
        return newResult;
    } else {
        return lru.access( entry ) as any;
    }
}

function deleteEntry( resource: Resource<any, any>, key: any ) {
    const entriesForResource = entries.get( resource );
    if ( entriesForResource !== undefined ) {
        entriesForResource.delete( key );
        if ( entriesForResource.size === 0 ) {
            entries.delete( resource );
        }
    }
}

export function unstable_createResource<I, K extends ( string | number ), V>(
    fetch: ( input: I ) => Thenable<V>,
    maybeHashInput?: ( input: I ) => K,
): Resource<I, V> {
    const hashInput: ( input: I ) => K =
        maybeHashInput !== undefined ? maybeHashInput : identityHashFn as any;

    const resource = {
        read( input: I ): V {
            readContext( CacheContext );
            const key = hashInput( input );
            const result: Result<V> = accessResult( resource, fetch, input, key );
            switch ( result.status ) {
                case Pending: {
                    const suspender = result.value;
                    throw suspender;
                }
                case Resolved: {
                    const value = result.value;
                    return value;
                }
                case Rejected: {
                    const error = result.value;
                    throw error;
                }
                default:
                    return undefined as any;
            }
        },

        preload( input: I ): void {
            readContext( CacheContext );
            const key = hashInput( input );
            accessResult( resource, fetch, input, key );
        },
    };
    return resource;
}

export function unstable_setGlobalCacheLimit( limit: number ) {
    lru.setLimit( limit );
}
