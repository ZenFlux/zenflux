import React from "react";

import type { QueryClient } from "@zenflux/react-commander/query/client";
import type { DQueryModuleBaseStatic } from "@zenflux/react-commander/query/definitions";
import type { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

const QueryClientContext = React.createContext<QueryClient | null>( null );

let currentClient: QueryClient | null = null;

export function QueryProvider( props: { client: QueryClient; children: React.ReactNode } ) {
    const { client, children } = props;

    React.useEffect( () => {
        currentClient = client;
        return () => {
            if ( currentClient === client ) currentClient = null;
        };
    }, [ client ] );

    return (
        <QueryClientContext.Provider value={ client }>
            { children }
        </QueryClientContext.Provider>
    );
}

export function useQueryClient(): QueryClient {
    const client = React.useContext( QueryClientContext );
    if ( ! client ) {
        throw new Error( "QueryClient is not available. Wrap your app with <QueryProvider client={...}>" );
    }
    return client;
}

export function getQueryClient(): QueryClient {
    if ( ! currentClient ) {
        throw new Error( "No QueryClient set. Ensure <QueryProvider> is mounted." );
    }
    return currentClient;
}

export function getQueryModule<TResource extends object>( module: DQueryModuleBaseStatic<TResource> ): QueryModuleBase<TResource> {
    const client = getQueryClient();
    return client.getModule<TResource>( module );
}

