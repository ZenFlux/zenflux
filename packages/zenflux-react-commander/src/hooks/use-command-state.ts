/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { getSafeContext, shallowEqual } from "./utils";

import { GET_INTERNAL_SYMBOL, INTERNAL_STATE_UPDATED_EVENT } from "../_internal/constants";

import core from "../_internal/core";

function useCommandStateInternal<const TState extends React.ComponentState>( componentName: string ) {
    const componentContext = getSafeContext( componentName );

    const id = componentContext.getNameUnique();

    const internalContext = core[ GET_INTERNAL_SYMBOL ]( id );

    return [
        internalContext.getState<TState>,
        internalContext.setState<TState>,

        internalContext.isMounted,
    ] as const;
}

function useCommandStateSelectorInternal<TState, TSelector>(
    componentName: string,
    selector: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) {
    const componentContext = getSafeContext( componentName );
    const id = componentContext.getNameUnique();
    const internalContext = core[ GET_INTERNAL_SYMBOL ]( id );

    const selectorRef = React.useRef( selector );
    selectorRef.current = selector;

    const equalityFn = options?.equalityFn ?? ( shallowEqual as unknown as ( a: TSelector, b: TSelector ) => boolean );

    const valueRef = React.useRef<TSelector>( selector( internalContext.getState<TState>() ) );
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
        selectedState as TSelector,
        internalContext.setState<TState>,
        internalContext.isMounted,
    ] as const;
}

export function useCommandState<TState>( componentName: string ): readonly [
    () => TState,
    <K extends keyof TState = keyof TState>( state: TState | Pick<TState, K>, callback?: ( state: TState ) => void ) => void,
    () => boolean
];

export function useCommandState<TState, TSelector>(
    componentName: string,
    selector: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) : readonly [
    TSelector,
    <K extends keyof TState = keyof TState>( state: TState | Pick<TState, K>, callback?: ( state: TState ) => void ) => void,
    () => boolean
];

export function useCommandState<TState, TSelector = never>(
    componentName: string,
    selector?: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) {
    if ( typeof selector === "function" ) {
        return useCommandStateSelectorInternal<TState, TSelector>( componentName, selector, options );
    }
    return useCommandStateInternal<TState>( componentName );
}
