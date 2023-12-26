import is from "@zenflux/react-shared/src/object-is";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import type { FunctionComponentUpdateQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

export function isRenderConsistentWithExternalStores( finishedWork: Fiber ): boolean {
    // Search the rendered tree for external store reads, and check whether the
    // stores were mutated in a concurrent event. Intentionally using an iterative
    // loop instead of recursion so we can exit early.
    let node: Fiber = finishedWork;

    while ( true ) {
        if ( node.flags & FiberFlags.StoreConsistency ) {
            const updateQueue: FunctionComponentUpdateQueue | null = ( node.updateQueue as any );

            if ( updateQueue !== null ) {
                const checks = updateQueue.stores;

                if ( checks !== null ) {
                    for ( let i = 0 ; i < checks.length ; i++ ) {
                        const check = checks[ i ];
                        const getSnapshot = check.getSnapshot;
                        const renderedValue = check.value;

                        try {
                            if ( ! is( getSnapshot(), renderedValue ) ) {
                                // Found an inconsistent store.
                                return false;
                            }
                        } catch ( error ) {
                            // If `getSnapshot` throws, return `false`. This will schedule
                            // a re-render, and the error will be rethrown during render.
                            return false;
                        }
                    }
                }
            }
        }

        const child = node.child;

        if ( node.subtreeFlags & FiberFlags.StoreConsistency && child !== null ) {
            child.return = node;
            node = child;
            continue;
        }

        if ( node === finishedWork ) {
            return true;
        }

        while ( node.sibling === null ) {
            if ( node.return === null || node.return === finishedWork ) {
                return true;
            }

            node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
    }

    // Flow doesn't know this is unreachable, but eslint does
    // eslint-disable-next-line no-unreachable
    return true;
}
