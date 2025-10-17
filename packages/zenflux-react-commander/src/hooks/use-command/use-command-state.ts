/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { useCommand } from "./use-command";

import { getSafeContext, shallowEqual } from "../utils";

import core from "../../_internal/core";
import { INTERNAL_STATE_UPDATED_EVENT, GET_INTERNAL_SYMBOL } from "../../_internal/constants";

function resolveInternalContext( name: string ) {
    const cmd = useCommand( name );
    const byCommand = cmd?.getInternalContext?.();
    if ( byCommand ) return byCommand;

    try {
        const componentContext = getSafeContext( name );
        const id = componentContext.getNameUnique();
        return core[ GET_INTERNAL_SYMBOL ]( id );
    } catch {
        return null;
    }
}

function useCommandStateInternal<const TState extends React.ComponentState>( commandName: string ) {
    const internalContext = resolveInternalContext( commandName );
    if ( ! internalContext ) {
        throw new Error( `useCommandState(\"${ commandName }\") cannot resolve internal context` );
    }

    return [
        internalContext.getState<TState>,
        internalContext.setState<TState>,

        internalContext.isMounted,
    ] as const;
}

function useCommandStateSelectorInternal<TState, TSelector>(
    commandName: string,
    selector: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) {
    const internalContext = resolveInternalContext( commandName );
    if ( ! internalContext ) {
        throw new Error( `useCommandState(\"${ commandName }\") cannot resolve internal context` );
    }

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
    }, [ internalContext, commandName ] );

    const subscribe = React.useCallback( ( onChange: () => void ) => {
        onChangeRef.current = onChange;

        return () => {
            onChangeRef.current = null;
        };
    }, [ commandName ] );

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

export function useCommandState<TState>( commandName: string ): readonly [
    () => TState,
    <K extends keyof TState = keyof TState>( state: TState | Pick<TState, K>, callback?: ( state: TState ) => void ) => void,
    () => boolean
];

export function useCommandState<TState, TSelector>(
    commandName: string,
    selector: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) : readonly [
    TSelector,
    <K extends keyof TState = keyof TState>( state: TState | Pick<TState, K>, callback?: ( state: TState ) => void ) => void,
    () => boolean
];

export function useCommandState<TState, TSelector = never>(
    commandName: string,
    selector?: ( state: TState ) => TSelector,
    options?: { equalityFn?: ( a: TSelector, b: TSelector ) => boolean }
) {
    if ( typeof selector === "function" ) {
        return useCommandStateSelectorInternal<TState, TSelector>( commandName, selector, options );
    }
    return useCommandStateInternal<TState>( commandName );
}
