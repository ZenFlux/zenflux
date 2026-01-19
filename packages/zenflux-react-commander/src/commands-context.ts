import React from "react";

import type { DCommandComponentContextProps } from "@zenflux/react-commander/definitions";

const CONTEXT_KEY = Symbol.for( "@zenflux/react-commander/ComponentIdContext" );

const createErrorMessage = ( functionName: string ) => `ComponentCommandContext.Provider is not set. Using default ${ functionName } function.`;

function getOrCreateContext() {
    const globalObj = globalThis as Record<symbol, React.Context<DCommandComponentContextProps>>;

    if ( ! globalObj[ CONTEXT_KEY ] ) {
        globalObj[ CONTEXT_KEY ] = React.createContext<DCommandComponentContextProps>( {
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
    }

    return globalObj[ CONTEXT_KEY ];
}

export const ComponentIdContext = getOrCreateContext();
