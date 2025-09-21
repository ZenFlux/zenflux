import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL, GET_INTERNAL_MATCH_SYMBOL } from "./_internal/constants";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "./_internal/core";

import { ComponentIdContext } from "@zenflux/react-commander/commands-context";
import commandsManager from "@zenflux/react-commander/commands-manager";

import type { DCommandArgs, DCommandComponentContextProps, DCommandIdArgs } from "@zenflux/react-commander/definitions";

function getSafeContext( componentName: string, context?: DCommandComponentContextProps ) {
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

/**
 * Custom hook to create a command handler for a specific command.
 */
export function useCommanderCommand( commandName: string ) {
    const componentContext = React.useContext( ComponentIdContext );

    // Get component context
    const componentNameUnique = componentContext.getNameUnique();

    // Get command context
    const commandSignalContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique );

    // Set id, used to identify command
    const id = {
        commandName,
        componentNameUnique,
        componentName: commandSignalContext.componentName,
    };

    return {
        run: ( args: DCommandArgs, callback?: ( result: any ) => void ) => commandsManager.run( id, args, callback ),
        hook: ( callback: ( result: any, args?: DCommandArgs ) => void ) => commandsManager.hook( id, callback ),
        unhook: () => commandsManager.unhook( id ),

        // TODO: Remove.
        getInternalContext: () => commandSignalContext,
    };
}

/**
 * Custom hook to create a command handler for a specific component.
 */
export function useCommanderComponent( componentName: string, context?: DCommandComponentContextProps, options = { silent: false } ) {
    if ( ! options.silent ) {
        context = getSafeContext( componentName, context );
    }

    const id = context!.getNameUnique();

    return {
        run: ( commandName: string, args: DCommandArgs, callback?: ( result: any ) => void ) =>
            commandsManager.run( { commandName, componentName, componentNameUnique: id }, args, callback ),
        hook: ( commandName: string, callback: ( result?: any, args?: DCommandArgs ) => void ) =>
            commandsManager.hook( { commandName, componentName, componentNameUnique: id }, callback ),
        unhook: ( commandName: string ) =>
            commandsManager.unhook( { commandName, componentName, componentNameUnique: id } ),

        // TODO: Remove.
        getId: () => id,
        getKey: () => core[ GET_INTERNAL_SYMBOL ]( id ).key,
        isAlive: () => !! core[ GET_INTERNAL_SYMBOL ]( id, true ),
        getInternalContext: () => core[ GET_INTERNAL_SYMBOL ]( id ),
        getContext: () => context!,
        getState: <TState extends React.ComponentState>() => core[ GET_INTERNAL_SYMBOL ]( id ).getState() as TState,
    };
}

export function useCommanderChildrenComponents(
    componentName: string,
    onChildrenUpdate?: ( commands: ReturnType<typeof useCommanderComponent>[] ) => ( () => void ) | void,
) {
    const componentContext = React.useContext( ComponentIdContext );

    const [ childrenComponents, setChildrenComponents ] = React.useState<ReturnType<typeof useCommanderComponent>[]>( [] );

    function getDescendantsKeys( context: DCommandComponentContextProps ) {
        let keys: string[] = [];

        // Check if the context has children
        if ( context.children ) {
            // Iterate over each child in the context
            for ( const key in context.children ) {
                // Add the current child's key to the keys array
                keys.push( key );

                // Recursively get the keys of the descendants of the current child
                // and concatenate them to the keys array
                keys = keys.concat( getDescendantsKeys( context.children[ key ] ) );
            }
        }

        // Join all the keys with a separator to form a unique ID
        return keys.join( "-" );
    }

    React.useEffect( () => {
        const children = componentContext.children;

        if ( ! children ) {
            throw new Error( `Current component: '${ componentContext.getComponentName() }' cannot find: '${ componentName }' children` );
        }

        const newChildrenComponents: ReturnType<typeof useCommanderComponent>[] = [];

        const loopChildren = ( children: { [ x: string ]: DCommandComponentContextProps; } ) => {
            for ( const childName in children ) {
                const child = children[ childName ];

                if ( child.getComponentName() === componentName ) {
                    const childComponent = useCommanderComponent( componentName, child );

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

export function useCommanderState<TState>( componentName: string ) {
    const componentContext = getSafeContext( componentName );

    const id = componentContext.getNameUnique();

    const internalContext = core[ GET_INTERNAL_SYMBOL ]( id );

    return [
        internalContext.getState<TState>,
        internalContext.setState<TState>,

        internalContext.isMounted,
    ] as const;
}

/**
 * Unsafe, this command should be used carefully, since it can be used to run commands from any component.
 * It should be used only in cases where you are sure that there are no conflicts, and there are no other ways to do it.
 */
export function useAnyComponentCommands( componentName: string ) {
    return core[ GET_INTERNAL_MATCH_SYMBOL ]( componentName + "*" );
}

export function useCommandId( commandName: string, opts?: { match?: string; index?: number } ): DCommandIdArgs | null {
    const match = opts?.match ?? commandName;
    const index = opts?.index ?? 0;

    const [ id, setId ] = React.useState<DCommandIdArgs | null>( null );

    React.useEffect( () => {
        try {
            const contexts = useAnyComponentCommands( match );
            const ctx = contexts[ index ];
            if ( ctx ) {
                setId( {
                    commandName,
                    componentName: ctx.componentName,
                    componentNameUnique: ctx.componentNameUnique,
                } );
            }
        } catch ( _e ) {
            setId( null );
        }
    }, [ match, index, commandName ] );

    return id;
}

export function useScopedCommand( commandName: string, opts?: { match?: string; index?: number } ) {
    const componentContext = React.useContext( ComponentIdContext );
    const fallbackId = React.useId();
    const ownerId = componentContext?.isSet ? componentContext.getNameUnique() : ( "GLOBAL-" + fallbackId );

    const id = useCommandId( commandName, opts );

    const run = React.useCallback( ( args: DCommandArgs, callback?: ( result: unknown ) => void ) => {
        if ( ! id ) return;
        return commandsManager.run( id, args, callback );
    }, [ id ] );

    const hookScoped = React.useCallback( (
        callback: ( result?: unknown, args?: DCommandArgs ) => void,
        options?: { __ignoreDuplicatedHookError?: boolean }
    ) => {
        if ( ! id ) return { dispose: () => void 0 } as any;
        return commandsManager.hookScoped( id, ownerId, callback, options );
    }, [ id, ownerId ] );

    const unhookHandle = React.useCallback( ( handle: { dispose: () => void } ) => {
        commandsManager.unhookHandle( handle as any );
    }, [] );

    const hook = React.useCallback( (
        callback: ( result?: unknown, args?: DCommandArgs ) => void,
        options?: { __ignoreDuplicatedHookError?: boolean }
    ) => {
        if ( ! id ) return;
        return commandsManager.hook( id, callback, options );
    }, [ id ] );

    const unhook = React.useCallback( () => {
        if ( ! id ) return;
        commandsManager.unhook( id );
    }, [ id ] );

    return {
        id,
        run,
        hook,
        unhook,
        hookScoped,
        unhookHandle,
    } as const;
}

function toAdapterKey( name: string ): string {
    const last = name.split( "/" ).pop() || name;
    return last.charAt( 0 ).toLowerCase() + last.slice( 1 );
}

export function useCommands( input: string[] | Record<string, string> ) {
    const entries = React.useMemo( () => {
        if ( Array.isArray( input ) ) {
            return input.map( ( name ) => [ toAdapterKey( name ), name ] as const );
        }
        return Object.entries( input );
    }, [ input ] );

    const adapters = entries.map( ( [ _key, name ] ) => useScopedCommand( name ) );

    const result = React.useMemo( () => {
        const out: { [ k: string ]: ReturnType<typeof useScopedCommand> } = {};
        entries.forEach( ( [ key ], i ) => {
            out[ key ] = adapters[ i ];
        } );
        return out;
    }, [ entries, adapters ] );

    return result;
}

