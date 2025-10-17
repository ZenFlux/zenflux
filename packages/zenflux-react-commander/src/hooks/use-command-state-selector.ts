import React from "react";

import { getSafeContext, shallowEqual } from "@zenflux/react-commander/hooks/utils";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "../_internal/core";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL, INTERNAL_STATE_UPDATED_EVENT } from "../_internal/constants";

export function useCommandStateSelector<TState, TSelected>(
    componentName: string,
    selector: ( state: TState ) => TSelected,
    options?: { equalityFn?: ( a: TSelected, b: TSelected ) => boolean }
) {
    const componentContext = getSafeContext( componentName );
    const id = componentContext.getNameUnique();
    const internalContext = core[ GET_INTERNAL_SYMBOL ]( id );

    const selectorRef = React.useRef( selector );
    selectorRef.current = selector;

    const equalityFn = options?.equalityFn ?? ( shallowEqual as unknown as ( a: TSelected, b: TSelected ) => boolean );

    const valueRef = React.useRef<TSelected>( selector( internalContext.getState<TState>() ) );
    const onChangeRef = React.useRef<(() => void) | null>( null );

    const handlerRef = React.useRef<(() => void) | null>( null );

    if ( ! handlerRef.current ) {
        const handleStateChange = () => {
            const currentState = internalContext.getState<TState>();
            const newValue = selectorRef.current( currentState );

            if ( ! equalityFn( valueRef.current, newValue ) ) {
                valueRef.current = newValue;

                if ( onChangeRef.current ) {
                    onChangeRef.current();
                }
            }
        };

        handlerRef.current = handleStateChange;
        internalContext.emitter.on( INTERNAL_STATE_UPDATED_EVENT, handleStateChange );
    }

    React.useEffect(() => {
        return () => {
            if ( handlerRef.current ) {
                internalContext.emitter.off( INTERNAL_STATE_UPDATED_EVENT, handlerRef.current );
                handlerRef.current = null;
            }
        };
    }, [ internalContext, componentName ] );

    const subscribe = React.useCallback( ( onChange: () => void ) => {
        onChangeRef.current = onChange;

        return () => {
            onChangeRef.current = null;
        };
    }, [ componentName ] );

    const getSnapshot = React.useCallback( () => {
        return valueRef.current;
    }, [] );

    const selectedState = React.useSyncExternalStore( subscribe, getSnapshot, getSnapshot );

    return [
        selectedState as TSelected,
        internalContext.setState<TState>,
        internalContext.isMounted,
    ] as const;
}

