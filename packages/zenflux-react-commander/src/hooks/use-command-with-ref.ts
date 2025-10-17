/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { useComponentWithRef } from "./use-component/use-component-with-ref";

import commandsManager from "../commands-manager";

import type { DCommandArgs, DCommandHookHandle } from "../definitions";

export function useCommandWithRef(commandName: string, componentRef: React.RefObject<any> ) {
    const [ command, setCommand ] = React.useState<ReturnType<typeof useComponentWithRef> & { unhookHandle: ( handle: DCommandHookHandle ) => void } | null>( null );

    const componentName = commandsManager.getComponentName( commandName );

    const component = useComponentWithRef( componentName, componentRef );

    React.useEffect( () => {
        if ( ! component ) {
            setCommand( null );
            return;
        }

        setCommand( {
            run: ( args: DCommandArgs = {}, callback?: ( result: any ) => void ) => component.run( commandName, args, callback ),
            hook: ( callback: ( result: any, args?: DCommandArgs ) => void ) => component.hook( commandName, callback ),
            unhook: () => component.unhook( commandName ),
            unhookHandle: ( handle: DCommandHookHandle ) => component.unhookHandle( handle ),
            getInternalContext: () => component.getInternalContext(),
        } );
    }, [ component ] );

    return command;
}

