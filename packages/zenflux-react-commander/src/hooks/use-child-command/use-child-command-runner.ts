
import React from "react";

import { useCommanderChildrenComponents } from "../utils";

import type { DCommandArgs, DCommandSingleComponentContext } from "../../definitions";

export function useChildCommandRunner(
    childComponentName: string,
    selector: ( ctx: DCommandSingleComponentContext ) => string
) {
    const children = useCommanderChildrenComponents( childComponentName );

    const getByKey = React.useCallback( ( key: string ) => {
        for ( const cmd of children ) {
            const ctx = cmd.getInternalContext();
            const k = selector( ctx );
            if ( k === key ) return cmd;
        }
        return null;
    }, [ children, selector ] );

    const run = React.useCallback( ( key: string, commandName: string, args: DCommandArgs ) => {
        const cmd = getByKey( key );
        if ( !cmd ) return false;
        cmd.run( commandName, args );
        return true;
    }, [ getByKey ] );

    return run;
}

