
import React from "react";

import { useCommanderChildrenComponents } from "../utils";

import type { useComponent } from "../use-component/use-component";
import type { DCommandArgs } from "../../definitions";

export function useChildCommandHook(
    childComponentName: string,
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void,
    opts?: { filter?: ( ctx: ReturnType<typeof useComponent> ) => boolean; ignoreDuplicate?: boolean }
) {
    const children = useCommanderChildrenComponents( childComponentName );

    React.useEffect( () => {
        const disposers: Array<() => void> = [];

        const alive = children.filter( cmd => {
            try {
                return typeof cmd.isAlive === "function" ? cmd.isAlive() : true;
            } catch {
                return false;
            }
        } );

        alive.forEach( ( cmd ) => {
            if ( opts?.filter && !opts.filter( cmd ) ) return;
            if ( cmd.isAlive && !cmd.isAlive() ) return;
            cmd.hook( commandName, handler );
            disposers.push( () => {
                try {
                    if ( cmd.isAlive && cmd.isAlive() ) cmd.unhook( commandName );
                } catch {}
            } );
        } );

        return () => {
            disposers.forEach( d => d() );
        };
    }, [ children.map( c => c.getId() ).join( "|" ), commandName, handler ] );
}

