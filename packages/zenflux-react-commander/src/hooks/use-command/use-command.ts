
import React from "react";

import { GET_INTERNAL_SYMBOL, GET_INTERNAL_MATCH_SYMBOL } from "../../_internal/constants";

import core from "../../_internal/core";
import { ComponentIdContext } from "../../commands-context";
import commandsManager from "../../commands-manager";

import type { DCommandArgs, DCommandIdArgs, DCommandSingleComponentContext } from "../../definitions";

type CommandRun = ( args?: DCommandArgs, callback?: ( result: unknown ) => void ) => unknown
type CommandHook = ( callback: ( result: unknown, args?: DCommandArgs ) => void ) => void
type CommandUnhook = () => void
//
type CommandGetInternalContext = () => DCommandSingleComponentContext | null | undefined

type UseCommandAdapter = {
    run: CommandRun
    hook: CommandHook
    unhook: CommandUnhook
    getInternalContext: CommandGetInternalContext
}

export function useCommand( commandName: string ): UseCommandAdapter;
export function useCommand( commandName: string, ref: React.RefObject<any> ): UseCommandAdapter | null;
export function useCommand( commandName: string, ref?: React.RefObject<any> ) {
    const componentContext = React.useContext( ComponentIdContext );

    const ownerIdRef = React.useRef<string | null>( null );
    if ( ! ownerIdRef.current ) {
        ownerIdRef.current = `${ commandName }:${ Math.random().toString( 36 ).slice( 2 ) }`;
    }

    type HookHandle = { componentNameUnique: string; commandName: string; ownerId: string; dispose: () => void };
    const hookedCallbacksRef = React.useRef<Map<Function, HookHandle>>( new Map() );

    React.useEffect( () => {
        return () => {
            for ( const handle of hookedCallbacksRef.current.values() ) {
                try { commandsManager.unhookHandle( handle ); } catch {}
            }
            hookedCallbacksRef.current.clear();
        };
    }, [] );

    const debug = ( ..._args: Array<unknown> ) => {
        try {
            // TODO: Enable when needed
            // console.debug( "[react-commander/useCommand]", ..._args );
        } catch {}
    };

    const lastIdRef = React.useRef<DCommandIdArgs | null>( null );

    function defer( fn: () => void ) {
        try {
            if ( typeof queueMicrotask === "function" ) {
                queueMicrotask( fn );
                return;
            }
        } catch {}
        setTimeout( fn, 0 );
    }

    function createAdapterFromId(
        id: DCommandIdArgs,
        getInternal?: () => DCommandSingleComponentContext,
    ): UseCommandAdapter {
        lastIdRef.current = id;
        return {
            run: (
                _args: DCommandArgs = {},
                callback?: ( result: unknown ) => void,
            ) => {
                return commandsManager.run(
                    id,
                    _args,
                    callback as ( _r: unknown ) => void,
                );
            },
            hook: ( callback: ( result: unknown, args?: DCommandArgs ) => void ) => {
                if ( hookedCallbacksRef.current.has( callback ) ) return;
                if ( ! commandsManager.isContextRegistered( id.componentNameUnique ) ) {
                    defer( () => {
                        if ( hookedCallbacksRef.current.has( callback ) ) return;
                        if ( ! commandsManager.isContextRegistered( id.componentNameUnique ) ) return;
                        const h = commandsManager.hookScoped(
                            id,
                            ownerIdRef.current as string,
                            callback as ( r: unknown, a?: DCommandArgs ) => void,
                        );
                        if ( h ) hookedCallbacksRef.current.set( callback, h );
                    } );
                    return;
                }
                const handle = commandsManager.hookScoped(
                    id,
                    ownerIdRef.current as string,
                    callback as ( r: unknown, a?: DCommandArgs ) => void,
                );
                if ( handle ) hookedCallbacksRef.current.set( callback, handle );
            },
            unhook: () => {
                for ( const handle of hookedCallbacksRef.current.values() ) {
                    try {
                        commandsManager.unhookHandle( handle );
                    } catch {}
                }
                hookedCallbacksRef.current.clear();
            },
            getInternalContext: () => getInternal?.() ?? null,
        };
    }

    function createAdapterFromResolver(
        resolveId: () => DCommandIdArgs | null,
        getInternalForId: ( id: DCommandIdArgs ) => DCommandSingleComponentContext | null,
    ): UseCommandAdapter {
        return {
            run: (
                _args: DCommandArgs = {},
                callback?: ( result: unknown ) => void,
            ) => {
                const id = resolveId();
                if ( ! id ) return;
                return commandsManager.run(
                    id,
                    _args,
                    callback as ( _r: unknown ) => void,
                );
            },
            hook: ( callback: ( result: unknown, args?: DCommandArgs ) => void ) => {
                if ( hookedCallbacksRef.current.has( callback ) ) return;
                const id = resolveId();
                if ( ! id ) return;
                if ( ! commandsManager.isContextRegistered( id.componentNameUnique ) ) {
                    defer( () => {
                        if ( hookedCallbacksRef.current.has( callback ) ) return;
                        const next = resolveId();
                        if ( ! next ) return;
                        if ( ! commandsManager.isContextRegistered( next.componentNameUnique ) ) return;
                        const h = commandsManager.hookScoped(
                            next,
                            ownerIdRef.current as string,
                            callback as ( r: unknown, a?: DCommandArgs ) => void,
                        );
                        if ( h ) hookedCallbacksRef.current.set( callback, h );
                    } );
                    return;
                }
                const handle = commandsManager.hookScoped(
                    id,
                    ownerIdRef.current as string,
                    callback as ( r: unknown, a?: DCommandArgs ) => void,
                );
                if ( handle ) hookedCallbacksRef.current.set( callback, handle );
            },
            unhook: () => {
                for ( const handle of hookedCallbacksRef.current.values() ) {
                    try {
                        commandsManager.unhookHandle( handle );
                    } catch {}
                }
                hookedCallbacksRef.current.clear();
            },
            getInternalContext: () => {
                const id = resolveId();
                if ( ! id ) return null;
                return getInternalForId( id );
            },
        };
    }

    const getAdapterInCurrentContext = (): UseCommandAdapter | null => {
        const mapped = commandsManager.getComponentName( commandName );
        if ( ! mapped ) { debug( "current", commandName, "no-mapped" ); return null; }

        const unique = componentContext.getNameUnique();
        const internal = core[ GET_INTERNAL_SYMBOL ]( unique );
        if ( internal.componentName !== mapped ) { debug( "current", commandName, "component-mismatch", { current: internal.componentName, mapped } ); return null; }
        if ( internal.commands && ! internal.commands[ commandName ] ) { debug( "current", commandName, "not-in-current" ); return null; }

        const id: DCommandIdArgs = { commandName, componentNameUnique: unique, componentName: internal.componentName };
        debug( "current", commandName, "resolved", id );
        return createAdapterFromId( id, () => internal );
    };

    const getAdapterByName = (): UseCommandAdapter | null => {
        const mapped = commandsManager.getComponentName( commandName );
        if ( ! mapped ) { debug( "byName", commandName, "no-mapped" ); return null; }

        try {
            const contexts = core[ GET_INTERNAL_MATCH_SYMBOL ]( mapped + "*" ) as Array<any>;
            for ( let i = contexts.length - 1 ; i >= 0 ; i-- ) {
                const ctx = contexts[ i ];
                if ( ctx.commands && ctx.commands[ commandName ] ) {
                    const id: DCommandIdArgs = { commandName, componentName: ctx.componentName, componentNameUnique: ctx.componentNameUnique };
                    debug( "byName", commandName, "resolved", id );
                    return createAdapterFromId(
                        id,
                        () => core[ GET_INTERNAL_SYMBOL ]( ctx.componentNameUnique ),
                    );
                }
            }
        } catch { debug( "byName", commandName, "error" ); return null; }
        debug( "byName", commandName, "none" );
        return null;
    };

    const getAdapterInRef = (): UseCommandAdapter | null => {
        if ( ! ref?.current ) { debug( "inRef", commandName, "no-ref" ); return null; }

        try {
            const mapped = commandsManager.getComponentName( commandName );
            if ( ! mapped ) { debug( "inRef", commandName, "no-mapped" ); return null; }
            const contexts = core[ GET_INTERNAL_MATCH_SYMBOL ]( mapped + "*" );
            const ctx = contexts.find( ( c: any ) => c.getComponentContext().getComponentRef().current === ref.current );
            if ( ! ctx ) { debug( "inRef", commandName, "no-match" ); return null; }

            const id: DCommandIdArgs = { commandName, componentName: ctx.componentName, componentNameUnique: ctx.componentNameUnique };
            debug( "inRef", commandName, "resolved", id );
            return createAdapterFromId(
                id,
                () => core[ GET_INTERNAL_SYMBOL ]( ctx.componentNameUnique ),
            );
        } catch { debug( "inRef", commandName, "error" ); return null; }
    };

    const getAdapterOnDemand = (): UseCommandAdapter => {
        const resolveLatestId = () => {
            const mapped = commandsManager.getComponentName( commandName );
            if ( ! mapped ) { debug( "onDemand", commandName, "no-mapped" ); return null; }
            try {
                const contexts = core[ GET_INTERNAL_MATCH_SYMBOL ]( mapped + "*" );
                for ( let i = contexts.length - 1 ; i >= 0 ; i-- ) {
                    const ctx = contexts[ i ];
                    if ( ctx.commands && ctx.commands[ commandName ] ) {
                        const id = { commandName, componentName: ctx.componentName, componentNameUnique: ctx.componentNameUnique } as DCommandIdArgs;
                        debug( "onDemand", commandName, "resolved", id );
                        return id;
                    }
                }
                debug( "onDemand", commandName, "none" );
                return null;
            } catch { debug( "onDemand", commandName, "error" ); return null; }
        };

        return createAdapterFromResolver(
            resolveLatestId,
            ( id ) => core[ GET_INTERNAL_SYMBOL ]( id.componentNameUnique ),
        );
    };

    const adapter = ref
        ? ( getAdapterInRef() || getAdapterByName() || getAdapterOnDemand() )
        : ( getAdapterInCurrentContext() || getAdapterByName() || getAdapterOnDemand() );

    return adapter;
}
