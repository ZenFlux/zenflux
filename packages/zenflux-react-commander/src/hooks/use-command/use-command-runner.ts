
import React from "react";

import { useCommand } from "./use-command";

import type { DCommandArgs } from "../../definitions";

export function useCommandRunner( commandName: string, ref?: React.RefObject<any> ) {
    const cmd = ref ? useCommand( commandName, ref ) : useCommand( commandName );

    return React.useCallback( ( args: DCommandArgs = {}, callback?: ( result: unknown ) => void ) => {
        if ( ! cmd ) return;
        return cmd.run( args, callback );
    }, [ cmd ] );
}

