import { SUSPENSE_PENDING_START_DATA } from "@zenflux/react-dom-bindings/src/server/fizz-instruction-set/ReactDOMFizzInstructionSetShared";

import { COMMENT_NODE } from "@zenflux/react-dom-bindings/src/client/HTMLNodeType";
import {
    SUSPENSE_END_DATA,
    SUSPENSE_FALLBACK_START_DATA,
    SUSPENSE_START_DATA
} from "@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-suspense-data-flags";

import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";

// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
export function getParentSuspenseInstance( targetInstance: Node ): null | SuspenseInstance {
    let node = targetInstance.previousSibling;
    // Skip past all nodes within this suspense boundary.
    // There might be nested nodes so we need to keep track of how
    // deep we are and only break out when we're back on top.
    let depth = 0;

    while ( node ) {
        if ( node.nodeType === COMMENT_NODE ) {
            const data = ( ( node as any ).data as string );

            if ( data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA ) {
                if ( depth === 0 ) {
                    return ( ( node as any ) as SuspenseInstance );
                } else {
                    depth--;
                }
            } else if ( data === SUSPENSE_END_DATA ) {
                depth++;
            }
        }

        node = node.previousSibling;
    }

    return null;
}
