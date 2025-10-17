import React from "react";

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
