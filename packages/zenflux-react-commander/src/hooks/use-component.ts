
import { getSafeContext } from "@zenflux/react-commander/hooks/utils";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "../_internal/core";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL } from "../_internal/constants";

import commandsManager from "@zenflux/react-commander/commands-manager";

import type React from "react";
import type { DCommandArgs, DCommandComponentContextProps, DCommandHookHandle } from "@zenflux/react-commander/definitions";

export function useComponent( componentName: string, context?: DCommandComponentContextProps, options = { silent: false } ) {
    if ( ! options.silent ) {
        context = getSafeContext( componentName, context );
    }

    const id = context!.getNameUnique();

    return {
        run: ( commandName: string, args: DCommandArgs, callback?: ( result: any ) => void ) =>
            commandsManager.run( { commandName, componentName, componentNameUnique: id }, args, callback ),
        hook: ( commandName: string, callback: ( result?: any, args?: DCommandArgs ) => void ) =>
            commandsManager.hook( { commandName, componentName, componentNameUnique: id }, callback ),
        unhook: ( commandName: string ) =>
            commandsManager.unhook( { commandName, componentName, componentNameUnique: id } ),
        unhookHandle: ( handle: DCommandHookHandle ) =>
            commandsManager.unhookHandle( handle ),

        getId: () => id,
        getKey: () => core[ GET_INTERNAL_SYMBOL ]( id ).key,
        isAlive: () => !! core[ GET_INTERNAL_SYMBOL ]( id, true ),
        getInternalContext: () => core[ GET_INTERNAL_SYMBOL ]( id ),
        getContext: () => context!,
        getState: <TState extends React.ComponentState>() => core[ GET_INTERNAL_SYMBOL ]( id ).getState() as TState,
    };
}

