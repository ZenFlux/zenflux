/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { useComponent } from "./use-component";

import core from "../../_internal/core";

import { GET_INTERNAL_MATCH_SYMBOL } from "../../_internal/constants";

export function useComponentWithRef(componentName: string, ref: React.RefObject<any> ): ReturnType<typeof useComponent> | null {
    const [ id, setId ] = React.useState<ReturnType<typeof useComponent> | null>( null );

    React.useEffect( () => {
        try {
            const contexts = core[ GET_INTERNAL_MATCH_SYMBOL ]( componentName + "*" );

            const currentContext = contexts.find( ( ctx ) => ctx.getComponentContext().getComponentRef().current === ref.current );

            if ( currentContext ) {
                setId( useComponent( componentName, currentContext.getComponentContext() ) );
            }
        } catch {
            setId( null );
        }

    }, [ componentName, ref.current ] );

    return id;
}

