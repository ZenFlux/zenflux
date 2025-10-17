/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { useComponent } from "./use-component/use-component";

import { ComponentIdContext } from "../commands-context";
import commandsManager from "../commands-manager";

import type { DCommandComponentContextProps } from "../definitions";

export function useCommanderChildrenComponents(
    componentName: string,
    onChildrenUpdate?: ( commands: ReturnType<typeof useComponent>[] ) => ( () => void ) | void,
) {
    const componentContext = React.useContext( ComponentIdContext );

    const [ childrenComponents, setChildrenComponents ] = React.useState<ReturnType<typeof useComponent>[]>( [] );

    function getDescendantsKeys( context: DCommandComponentContextProps ) {
        let keys: string[] = [];

        if ( context.children ) {
            for ( const key in context.children ) {
                keys.push( key );

                keys = keys.concat( getDescendantsKeys( context.children[ key ] ) );
            }
        }

        return keys.join( "-" );
    }

    React.useEffect( () => {
        const children = componentContext.children;

        if ( ! children ) {
            throw new Error( `Current component: '${ componentContext.getComponentName() }' cannot find: '${ componentName }' children` );
        }

        const newChildrenComponents: ReturnType<typeof useComponent>[] = [];

        const loopChildren = ( children: { [ x: string ]: DCommandComponentContextProps; } ) => {
            for ( const childName in children ) {
                const child = children[ childName ];

                if ( child.getComponentName() === componentName ) {
                    const id = child.getNameUnique();
                    if (commandsManager.isContextRegistered(id)) {
                        const childComponent = useComponent( componentName, child );
                        newChildrenComponents.push( childComponent );
                    }
                }

                if ( child.children ) {
                    loopChildren( child.children );
                }
            }
        };

        loopChildren( children );

        setChildrenComponents( newChildrenComponents );

        const callback = onChildrenUpdate?.( newChildrenComponents );

        return () => {
            callback?.();
        };
    }, [ getDescendantsKeys( componentContext ) ] );

    return childrenComponents;
}

