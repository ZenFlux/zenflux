/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as Scheduler from "@zenflux/react-scheduler";

// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
const {
    unstable_scheduleCallback: scheduleCallback,
    unstable_IdlePriority: IdlePriority,
} = Scheduler;

interface Entry<T> {
    value: T;
    onDelete: () => void;
    previous: Entry<T>;
    next: Entry<T>;
}

interface LRU<T> {
    add( value: T, onDelete: () => void ): Entry<T>;
    update( entry: Entry<T>, newValue: T ): void;
    access( entry: Entry<T> ): T;
    setLimit( newLimit: number ): void;
}

export function createLRU<T>( limit: number ): LRU<T> {
    let LIMIT = limit;

    // Circular, doubly-linked list
    let first: Entry<T> | null = null;
    let size: number = 0;

    let cleanUpIsScheduled: boolean = false;

    function scheduleCleanUp() {
        if ( cleanUpIsScheduled === false && size > LIMIT ) {
            cleanUpIsScheduled = true;
            scheduleCallback( IdlePriority, cleanUp );
        }
    }

    function cleanUp() {
        cleanUpIsScheduled = false;
        deleteLeastRecentlyUsedEntries( LIMIT );
    }

    function deleteLeastRecentlyUsedEntries( targetSize: number ) {
        if ( first !== null ) {
            const resolvedFirst: Entry<T> = first as Entry<T>;
            let last: Entry<T> | null = resolvedFirst.previous;
            while ( size > targetSize && last !== null ) {
                const onDelete = last.onDelete;
                const previous = last.previous;
                last.onDelete = ( () => {
                } ) as any;

                last.previous = last.next = ( null as any );
                if ( last === first ) {
                    first = last = null;
                } else {
                    ( first as any ).previous = previous;
                    previous!.next = ( first as any );
                    last = previous;
                }

                size -= 1;

                onDelete();
            }
        }
    }

    function add( value: T, onDelete: () => void ): Entry<T> {
        const entry: Entry<T> = {
            value,
            onDelete,
            next: ( null as any ),
            previous: ( null as any ),
        };
        if ( first === null ) {
            entry.previous = entry.next = entry;
            first = entry;
        } else {
            const last = first.previous;
            last!.next = entry;
            entry.previous = last!;

            first.previous = entry;
            entry.next = first;

            first = entry;
        }
        size += 1;
        return entry;
    }

    function update( entry: Entry<T>, newValue: T ): void {
        entry.value = newValue;
    }

    function access( entry: Entry<T> ): T {
        const next = entry.next;
        if ( next !== null ) {
            const resolvedFirst: Entry<T> = first as Entry<T>;
            if ( first !== entry ) {
                const previous = entry.previous;
                previous!.next = next;
                next!.previous = previous;

                const last = resolvedFirst.previous;
                last!.next = entry;
                entry.previous = last!;

                resolvedFirst.previous = entry;
                entry.next = resolvedFirst;

                first = entry;
            }
        }
        scheduleCleanUp();
        return entry.value;
    }

    function setLimit( newLimit: number ): void {
        LIMIT = newLimit;
        scheduleCleanUp();
    }

    return {
        add,
        update,
        access,
        setLimit,
    };
}
