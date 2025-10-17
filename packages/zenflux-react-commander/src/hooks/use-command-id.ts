import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { useCommandMatch } from "./use-command-match";

import commandsManager from "@zenflux/react-commander/commands-manager";

import type { DCommandIdArgs } from "@zenflux/react-commander/definitions";

export function useCommandId(commandName: string, opts?: { match?: string; index?: number; waitForRef?: React.RefObject<any> } ): DCommandIdArgs | null {
    const match = opts?.match ?? commandsManager.getComponentName( commandName );
    const index = opts?.index ?? 0;
    const waitForRef = opts?.waitForRef;

    const [ id, setId ] = React.useState<DCommandIdArgs | null>( null );

    React.useEffect( () => {
        if ( waitForRef && ! waitForRef.current ) {
            setId( null );
            return;
        }

        try {
            if ( ! match ) {
                setId( null );
                return;
            }
            const contexts = useCommandMatch( match );
            const ctx = contexts[ index ];
            if ( ctx ) {
                if ( waitForRef ) {
                    const componentRef = ctx.getComponentContext().getComponentRef();
                    if ( componentRef?.current !== waitForRef.current ) {
                        setId( null );
                        return;
                    }
                }

                setId( {
                    commandName,
                    componentName: ctx.componentName,
                    componentNameUnique: ctx.componentNameUnique,
                } );
            }
        } catch {
            setId( null );
        }
    }, [ match, index, commandName, waitForRef?.current ] );

    return id;
}

