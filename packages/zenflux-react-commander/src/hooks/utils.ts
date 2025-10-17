import React from "react";

import { useComponent } from "@zenflux/react-commander/hooks";

import { ComponentIdContext } from "@zenflux/react-commander/commands-context";

import type { DCommandComponentContextProps } from "@zenflux/react-commander/definitions";

export function getSafeContext( componentName: string, context?: DCommandComponentContextProps ) {
    function maybeWrongContext( componentName: string, componentNameUnique: string ) {
        if ( componentName === componentNameUnique ) {
            return;
        }
        throw new Error(
            `You are not in: '${ componentName }', you are in '${ componentNameUnique }' which is not your context\n` +
            "If you are trying to reach sub-component context, it has to rendered, before you can use it\n",
        );
    }

    const componentContext = context || React.useContext( ComponentIdContext );

    const componentNameContext = componentContext.getComponentName();

    maybeWrongContext( componentName, componentNameContext );

    return componentContext;
}

export function shallowEqual<T extends Record<string, unknown>>( a: T, b: T ): boolean {
    if ( a === b ) return true;
    if ( ! a || ! b ) return false;

    const aKeys = Object.keys( a );
    const bKeys = Object.keys( b );
    if ( aKeys.length !== bKeys.length ) return false;

    for ( const key of aKeys ) {
        if ( ( a as Record<string, unknown> )[ key ] !== ( b as Record<string, unknown> )[ key ] ) {
            return false;
        }
    }
    return true;
}

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
                    const childComponent = useComponent( componentName, child );

                    newChildrenComponents.push( childComponent );
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

