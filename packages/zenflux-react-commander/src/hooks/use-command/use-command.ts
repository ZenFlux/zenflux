import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "../../_internal/core";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL } from "../../_internal/constants";

import { ComponentIdContext } from "@zenflux/react-commander/commands-context";
import commandsManager from "@zenflux/react-commander/commands-manager";

import type { DCommandArgs } from "definitions";

export function useCommand( commandName: string ) {
    const componentContext = React.useContext( ComponentIdContext );

    const componentNameUnique = componentContext.getNameUnique();

    const commandSignalContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique );

    const id = {
        commandName,
        componentNameUnique,
        componentName: commandSignalContext.componentName,
    };

    return {
        run: ( args: DCommandArgs = {}, callback?: ( result: any ) => void ) => commandsManager.run( id, args, callback ),
        hook: ( callback: ( result: any, args?: DCommandArgs ) => void ) => commandsManager.hook( id, callback ),
        unhook: () => commandsManager.unhook( id ),

        getInternalContext: () => commandSignalContext,
    };
}

