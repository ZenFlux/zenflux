import React from "react";

import { useCommandId, useCommandWithRef } from "@zenflux/react-commander/hooks";

import commandsManager from "@zenflux/react-commander/commands-manager";

import type { DCommandArgs, DCommandIdArgs } from "@zenflux/react-commander/definitions";

export function useCommandHook(
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void,
    ref?: React.RefObject<any>,
) {
    const ownerIdRef = React.useRef<string | null>( null );

    if ( ! ownerIdRef.current ) {
        ownerIdRef.current = `${ commandName }:${ Math.random().toString( 36 ).slice( 2 ) }`;
    }

    const command = ref ? useCommandWithRef( commandName, ref ) : null;
    const id = ref ? null : useCommandId( commandName );

    React.useEffect( () => {
        if ( ref ) {
            if ( ! command ) return;

            const ctx = command.getInternalContext?.();
            if ( ! ctx ) return;

            const resolvedId = {
                commandName,
                componentName: ctx.componentName,
                componentNameUnique: ctx.componentNameUnique,
            } as DCommandIdArgs;

            try {
                if ( ! commandsManager.isContextRegistered( resolvedId.componentNameUnique ) ) return;
                const handle = commandsManager.hookScoped( resolvedId, ownerIdRef.current as string, handler );
                return () => {
                    handle?.dispose();
                };
            } catch {
                return;
            }
        } else {
            if ( id ) {
                try {
                    if ( ! commandsManager.isContextRegistered( id.componentNameUnique ) ) return;
                    const handle = commandsManager.hookScoped( id, ownerIdRef.current as string, handler );
                    return () => {
                        handle?.dispose();
                    };
                } catch {
                    return;
                }
            }

            const componentName = commandsManager.getComponentName( commandName );
            if ( ! componentName ) return;

            try {
                const handle = commandsManager.hookByNameScoped( { commandName, componentName, ownerId: ownerIdRef.current as string }, handler );
                return () => {
                    handle?.dispose();
                };
            } catch {
                return;
            }
        }
    }, [ ref?.current, command, id, handler ] );
}

