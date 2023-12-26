import { REACT_MEMO_CACHE_SENTINEL } from "@zenflux/react-shared/src/react-symbols";

import { ReactFiberHooksCurrent, ReactFiberHooksInfra } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";

import type { MemoCache } from "@zenflux/react-shared/src/react-internal-types/cache";
import type { FunctionComponentUpdateQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

export function useMemoCache( size: number ): Array<any> {
    let memoCache: MemoCache | null | undefined = null;
    // Fast-path, load memo cache from wip fiber if already prepared
    let updateQueue: FunctionComponentUpdateQueue | null = ( ReactFiberHooksCurrent.renderingFiber.updateQueue as any );

    if ( updateQueue !== null ) {
        memoCache = updateQueue.memoCache;
    }

    // Otherwise clone from the current fiber
    if ( memoCache == null ) {
        const current = ReactFiberHooksCurrent.renderingFiber.alternate;

        if ( current !== null ) {
            const currentUpdateQueue = current.updateQueue;

            if ( currentUpdateQueue !== null ) {
                const currentMemoCache: MemoCache | null | undefined = currentUpdateQueue.memoCache;

                if ( currentMemoCache != null ) {
                    memoCache = {
                        data: currentMemoCache.data.map( array => array.slice() ),
                        index: 0
                    };
                }
            }
        }
    }

    // Finally fall back to allocating a fresh instance of the cache
    if ( memoCache == null ) {
        memoCache = {
            data: [],
            index: 0
        };
    }

    if ( updateQueue === null ) {
        updateQueue = ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        ReactFiberHooksCurrent.renderingFiber.updateQueue = updateQueue;
    }

    if ( null === memoCache ) {
        throw new Error( "memoCache should be initialized at this point." );
    }

    updateQueue!.memoCache = memoCache;

    let data = memoCache.data[ memoCache.index ];

    if ( data === undefined ) {
        data = memoCache.data[ memoCache.index ] = new Array( size );

        for ( let i = 0 ; i < size ; i++ ) {
            data[ i ] = REACT_MEMO_CACHE_SENTINEL;
        }
    } else if ( data.length !== size ) {
        // TODO: consider warning or throwing here
        if ( __DEV__ ) {
            console.error( "Expected a constant size argument for each invocation of useMemoCache. " + "The previous cache was allocated with size %s but size %s was requested.", data.length, size );
        }
    }

    memoCache.index++;

    return data;
}
