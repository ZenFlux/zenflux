/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { GET_INTERNAL_SYMBOL, GET_INTERNAL_MATCH_SYMBOL } from "../../_internal/constants";

import core from "../../_internal/core";
import { ComponentIdContext } from "../../commands-context";
import commandsManager from "../../commands-manager";

import type { DCommandArgs, DCommandHookHandle, DCommandIdArgs, DCommandSingleComponentContext } from "../../definitions";

type CommandRun = ( args?: DCommandArgs, callback?: ( result: unknown ) => void ) => unknown
type CommandHook = ( callback: ( result: unknown, args?: DCommandArgs ) => void ) => unknown
type CommandUnhook = () => void
type CommandUnhookHandle = ( handle: DCommandHookHandle ) => void
type CommandGetInternalContext = () => DCommandSingleComponentContext | null | undefined

type UseCommandAdapter = {
    run: CommandRun
    hook: CommandHook
    unhook: CommandUnhook
    unhookHandle?: CommandUnhookHandle
    getInternalContext: CommandGetInternalContext
}

export function useCommand( commandName: string ): UseCommandAdapter;
export function useCommand( commandName: string, ref: React.RefObject<any> ): UseCommandAdapter | null;
export function useCommand( commandName: string, ref?: React.RefObject<any> ) {
    const componentContext = React.useContext( ComponentIdContext );

    const debug = ( ...args: Array<unknown> ) => {
        try {
            // TODO: Enable when needed
            // console.debug( "[react-commander/useCommand]", ...args );
        } catch {}
    };

    const makeAdapterFromId = ( id: DCommandIdArgs, getInternal?: () => DCommandSingleComponentContext ): UseCommandAdapter => {
        return {
            run: ( args: DCommandArgs = {}, callback?: ( result: unknown ) => void ) =>
                commandsManager.run( id, args, callback as ( r: unknown ) => void ),
            hook: ( callback: ( result: unknown, args?: DCommandArgs ) => void ) =>
                commandsManager.hook( id, callback as ( r: unknown, a?: DCommandArgs ) => void ),
            unhook: () => commandsManager.unhook( id ),
            unhookHandle: ( handle: DCommandHookHandle ) => commandsManager.unhookHandle( handle ),
            getInternalContext: () => getInternal?.() ?? null,
        };
    };

    const getAdapterInCurrentContext = (): UseCommandAdapter | null => {
        const mapped = commandsManager.getComponentName( commandName );
        if ( ! mapped ) { debug( "current", commandName, "no-mapped" ); return null; }

        const unique = componentContext.getNameUnique();
        const internal = core[ GET_INTERNAL_SYMBOL ]( unique );
        if ( internal.componentName !== mapped ) { debug( "current", commandName, "component-mismatch", { current: internal.componentName, mapped } ); return null; }
        if ( internal.commands && ! internal.commands[ commandName ] ) { debug( "current", commandName, "not-in-current" ); return null; }

        const id: DCommandIdArgs = { commandName, componentNameUnique: unique, componentName: internal.componentName };
        debug( "current", commandName, "resolved", id );
        return makeAdapterFromId( id, () => internal );
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
                    return makeAdapterFromId( id, () => core[ GET_INTERNAL_SYMBOL ]( ctx.componentNameUnique ) );
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
            return makeAdapterFromId( id, () => core[ GET_INTERNAL_SYMBOL ]( ctx.componentNameUnique ) );
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

        return {
            run: ( args: DCommandArgs = {}, callback?: ( result: unknown ) => void ) => { const id = resolveLatestId(); if ( ! id ) { debug( "onDemand", commandName, "run: no-id" ); return; } debug( "onDemand", commandName, "run", id ); return commandsManager.run( id, args, callback as ( r: any ) => void ); },
            hook: ( callback: ( result: unknown, args?: DCommandArgs ) => void ) => { const id = resolveLatestId(); if ( ! id ) { debug( "onDemand", commandName, "hook: no-id" ); return; } debug( "onDemand", commandName, "hook", id ); return commandsManager.hook( id, callback as ( r: any, a?: DCommandArgs ) => void ); },
            unhook: () => { const id = resolveLatestId(); if ( ! id ) { debug( "onDemand", commandName, "unhook: no-id" ); return; } debug( "onDemand", commandName, "unhook", id ); return commandsManager.unhook( id ); },
            getInternalContext: () => { const id = resolveLatestId(); if ( ! id ) { debug( "onDemand", commandName, "getInternalContext: no-id" ); return null; } const ctx = core[ GET_INTERNAL_SYMBOL ]( id.componentNameUnique ); debug( "onDemand", commandName, "getInternalContext", { componentNameUnique: id.componentNameUnique } ); return ctx; },
        };
    };

    const adapter = ref
        ? ( getAdapterInRef() || getAdapterByName() || getAdapterOnDemand() )
        : ( getAdapterInCurrentContext() || getAdapterByName() || getAdapterOnDemand() );

    return adapter;
}
