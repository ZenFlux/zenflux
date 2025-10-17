import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL } from "../_internal/constants";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "../_internal/core";

import commandsManager from "@zenflux/react-commander/commands-manager";
import { useCommandMatch } from "@zenflux/react-commander/hooks";

import type { DCommandArgs, DCommandIdArgs } from "@zenflux/react-commander/definitions";

export function useCommandOnDemand( commandName: string ) {
    const resolveLatestId = React.useCallback( () => {
        const componentName = commandsManager.getComponentName( commandName );
        if ( ! componentName ) return null;

        try {
            const contexts = useCommandMatch( componentName );
            if ( ! contexts.length ) return null;

            for ( let i = contexts.length - 1 ; i >= 0 ; i-- ) {
                const ctx = contexts[ i ];
                if ( ctx.commands && ctx.commands[ commandName ] ) {
                    return {
                        commandName,
                        componentName: ctx.componentName,
                        componentNameUnique: ctx.componentNameUnique,
                    } as DCommandIdArgs;
                }
            }
            return null;
        } catch {
            return null;
        }
    }, [ commandName ] );

    return React.useMemo( () => {
        return {
            run: ( args: DCommandArgs = {}, callback?: ( result: unknown ) => void ) => {
                const id = resolveLatestId();
                if ( ! id ) return;
                return commandsManager.run( id, args, callback as ( r: any ) => void );
            },
            hook: ( callback: ( result: unknown, args?: DCommandArgs ) => void ) => {
                const id = resolveLatestId();
                if ( ! id ) return;
                return commandsManager.hook( id, callback as ( r: any, a?: DCommandArgs ) => void );
            },
            unhook: () => {
                const id = resolveLatestId();
                if ( ! id ) return;
                return commandsManager.unhook( id );
            },
            getInternalContext: () => {
                const id = resolveLatestId();
                if ( ! id ) return null;
                return core[ GET_INTERNAL_SYMBOL ]( id.componentNameUnique );
            },
        };
    }, [ resolveLatestId ] );
}

