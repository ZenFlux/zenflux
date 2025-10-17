import { getSafeContext } from "@zenflux/react-commander/hooks/utils";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "../_internal/core";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL } from "../_internal/constants";

import type React from "react";

export function useCommandState<const TState extends React.ComponentState>( componentName: string ) {
    const componentContext = getSafeContext( componentName );

    const id = componentContext.getNameUnique();

    const internalContext = core[ GET_INTERNAL_SYMBOL ]( id );

    return [
        internalContext.getState<TState>,
        internalContext.setState<TState>,

        internalContext.isMounted,
    ] as const;
}

