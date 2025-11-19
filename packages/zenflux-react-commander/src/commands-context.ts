import React from "react";

import type { DCommandComponentContextProps } from "@zenflux/react-commander/definitions";

const createErrorMessage = ( functionName: string ) => `ComponentCommandContext.Provider is not set. Using default ${ functionName } function.`;

// An internal context used by `use-commands`
export const ComponentIdContext = React.createContext<DCommandComponentContextProps>( {
    isSet: false,

    getNameUnique: () => {
        throw new Error( createErrorMessage( "getUniqueName" ) );
    },
    getComponentName: () => {
        throw new Error( createErrorMessage( "getComponentName" ) );
    },
    getComponentRef: () => {
        throw new Error( createErrorMessage( "getComponentRef" ) );
    }
} );
