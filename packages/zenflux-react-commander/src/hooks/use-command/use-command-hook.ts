
import React from "react";

import { useCommand } from "./use-command";

import type { DCommandArgs } from "../../definitions";

export function useCommandHook(
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void,
    ref?: React.RefObject<any>,
) {
    const cmd = useCommand( commandName, ref as React.RefObject<any> );

    React.useEffect( () => {
        if ( ! cmd ) return;
        cmd.hook( handler );
        return () => {
            cmd.unhook();
        };
    }, [ cmd, handler ] );
}

