
import React from "react";

import { shallowEqual } from "../utils";

import core from "../../_internal/core";
import { INTERNAL_STATE_UPDATED_EVENT, GET_INTERNAL_MATCH_SYMBOL } from "../../_internal/constants";

function resolveInternalContextByRef( componentName: string, ref: React.RefObject<Element | null> ) {
    try {
        const contexts = core[ GET_INTERNAL_MATCH_SYMBOL ]( componentName + "*" );

        const currentContext = contexts.find( ( ctx ) => ctx.getComponentContext().getComponentRef().current === ref.current );

        return currentContext ?? null;
    } catch {
        return null;
    }
}

function useCommandStateWithRefInternal<const TState extends React.ComponentState>(
    componentName: string,
    ref: React.RefObject<Element | null>
) {
    const [ internalContext, setInternalContext ] = React.useState( () => resolveInternalContextByRef( componentName, ref ) );

    React.useEffect( () => {
        setInternalContext( resolveInternalContextByRef( componentName, ref ) );
    }, [ componentName, ref.current ] );

    if ( ! internalContext ) {
        return null;
    }

    return [
        internalContext.getState<TState>,
        internalContext.setState<TState>,
        internalContext.isMounted,
    ] as const;
}

function useCommandStateWithRefSelectorInternal<TState, TSelector>(
    componentName: string,
    ref: React.RefObject<Element | null>,
    selector: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) {
    const [ internalContext, setInternalContext ] = React.useState( () => resolveInternalContextByRef( componentName, ref ) );

    React.useEffect( () => {
        setInternalContext( resolveInternalContextByRef( componentName, ref ) );
    }, [ componentName, ref.current ] );

    const selectorRef = React.useRef( selector );
    selectorRef.current = selector;

    const equalityFn = options?.equalityFn ?? ( shallowEqual as ( a: TSelector, b: TSelector ) => boolean );

    const valueRef = React.useRef<TSelector | null>( internalContext ? selector( internalContext.getState<TState>() ) : null );
    const onChangeRef = React.useRef<( () => void ) | null>( null );

    const handlerRef = React.useRef<( () => void ) | null>( null );

    React.useEffect( () => {
        if ( ! internalContext ) return;

        if ( ! handlerRef.current ) {
            const handleStateChange = () => {
                const currentState = internalContext.getState<TState>();
                const newValue = selectorRef.current( currentState );

                if ( valueRef.current === null || ! equalityFn( valueRef.current, newValue ) ) {
                    valueRef.current = newValue;

                    if ( onChangeRef.current ) {
                        onChangeRef.current();
                    }
                }
            };

            handlerRef.current = handleStateChange;
            internalContext.emitter.on( INTERNAL_STATE_UPDATED_EVENT, handleStateChange );
        }

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

    if ( ! internalContext ) {
        return null;
    }

    return [
        selectedState as TSelector,
        internalContext.setState<TState>,
        internalContext.isMounted,
    ] as const;
}

export function useCommandStateWithRef<TState>(
    componentName: string,
    ref: React.RefObject<Element | null>
): readonly [
    () => TState,
    <K extends keyof TState = keyof TState>( state: TState | Pick<TState, K>, callback?: ( state: TState ) => void ) => void,
    () => boolean
] | null;

export function useCommandStateWithRef<TState, TSelector>(
    componentName: string,
    ref: React.RefObject<Element | null>,
    selector: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
): readonly [
    TSelector,
    <K extends keyof TState = keyof TState>( state: TState | Pick<TState, K>, callback?: ( state: TState ) => void ) => void,
    () => boolean
] | null;

export function useCommandStateWithRef<TState, TSelector = never>(
    componentName: string,
    ref: React.RefObject<Element | null>,
    selector?: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) {
    if ( typeof selector === "function" ) {
        return useCommandStateWithRefSelectorInternal<TState, TSelector>( componentName, ref, selector, options );
    }
    return useCommandStateWithRefInternal<TState>( componentName, ref );
}
