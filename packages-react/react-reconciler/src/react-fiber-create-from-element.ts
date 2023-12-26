import { createFiberFromTypeAndProps } from "@zenflux/react-reconciler/src/react-fiber-from-create-type-n-props";

import type { ReactElement } from "@zenflux/react-shared/src/react-element-type";
import type { Fiber, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

export function createFiberFromElement( element: ReactElement, mode: TypeOfMode, lanes: Lanes ): Fiber {
    let source: typeof element._source | null = null;
    let owner: typeof element._owner | null = null;

    if ( __DEV__ ) {
        source = element._source;
        owner = element._owner;
    }

    const type = element.type;
    const key = element.key;
    const pendingProps = element.props;
    const fiber = createFiberFromTypeAndProps( type, key, pendingProps, source, owner, mode, lanes );

    if ( __DEV__ ) {
        fiber._debugSource = element._source;
        fiber._debugOwner = element._owner;
    }

    return fiber;
}
