import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { useComponent } from "./use-component";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { useCommandMatch } from "../use-command-match";



export function useComponentWithRef(componentName: string, ref: React.RefObject<any> ): ReturnType<typeof useComponent> | null {
    const [ id, setId ] = React.useState<ReturnType<typeof useComponent> | null>( null );

    React.useEffect( () => {
        try {
            const contexts = useCommandMatch( componentName );

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

