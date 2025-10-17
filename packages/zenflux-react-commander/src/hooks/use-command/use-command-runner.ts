import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { useCommandId } from "../use-command-id";

import commandsManager from "@zenflux/react-commander/commands-manager";

import type { DCommandArgs } from "definitions";

export function useCommandRunner( commandName: string, opts?: { match?: string; index?: number } ) {
    const id = useCommandId( commandName, opts );

    return React.useCallback( ( args: DCommandArgs = {}, callback?: ( result: unknown ) => void ) => {
        if ( ! id ) return;
        return commandsManager.run( id, args, callback );
    }, [ id ] );
}

