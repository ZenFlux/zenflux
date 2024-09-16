import React from "react";

import type { DCommandComponentContextProps } from "@zenflux/react-commander/definitions";

// An internal context used by `use-commands`
export const ComponentIdContext = React.createContext<DCommandComponentContextProps>( {
    isSet: false,

    getNameUnique: () => {
        throw new Error( "ComponentCommandContext.Provider is not set. Using default getUniqueName function." );
    },
    getComponentName: () => {
        throw new Error( "ComponentCommandContext.Provider is not set. Using default getUniqueName function." );
    },
    getComponentRef: () => {
        throw new Error( "ComponentCommandContext.Provider is not set. Using default getComponentRef function." );
    }
} );
