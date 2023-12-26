
import { getNextHydratableSibling } from "@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-hydrate";

import { COMMENT_NODE } from "@zenflux/react-dom-bindings/src/client/HTMLNodeType";

import {
    SUSPENSE_END_DATA,
    SUSPENSE_FALLBACK_START_DATA,
    SUSPENSE_PENDING_START_DATA,
    SUSPENSE_START_DATA
} from "@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-suspense-data-flags";

import type { HydratableInstance } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";

export function getNextHydratableInstanceAfterSuspenseInstance( suspenseInstance: SuspenseInstance ): null | HydratableInstance {
    let node = suspenseInstance.nextSibling;
    // Skip past all nodes within this suspense boundary.
    // There might be nested nodes so we need to keep track of how
    // deep we are and only break out when we're back on top.
    let depth = 0;

    while ( node ) {
        if ( node.nodeType === COMMENT_NODE ) {
            const data = ( ( node as any ).data as string );

            if ( data === SUSPENSE_END_DATA ) {
                if ( depth === 0 ) {
                    return getNextHydratableSibling( ( node as any ) );
                } else {
                    depth--;
                }
            } else if ( data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA ) {
                depth++;
            }
        }

        node = node.nextSibling;
    }

    // TODO: Warn, we didn't find the end comment boundary.
    return null;
}

export function isSuspenseInstancePending( instance: SuspenseInstance ): boolean {
    return instance.data === SUSPENSE_PENDING_START_DATA;
}

export function isSuspenseInstanceFallback( instance: SuspenseInstance ): boolean {
    return instance.data === SUSPENSE_FALLBACK_START_DATA;
}

export function getSuspenseInstanceFallbackErrorDetails( instance: SuspenseInstance ): {
    digest: string | null | undefined;
    message?: string;
    stack?: string;
} {
    const dataset = instance.nextSibling && ( ( instance.nextSibling as any ) as HTMLElement ).dataset;
    let digest, message, stack;

    if ( dataset ) {
        digest = dataset.dgst;

        if ( __DEV__ ) {
            message = dataset.msg;
            stack = dataset.stck;
        }
    }

    if ( __DEV__ ) {
        return {
            message,
            digest,
            stack
        };
    } else {
        // Object gets DCE'd if constructed in tail position and matches callsite destructuring
        return {
            digest
        };
    }
}

export function registerSuspenseInstanceRetry( instance: SuspenseInstance, callback: () => void ) {
    instance._reactRetry = callback;
}
