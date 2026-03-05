
import { DEBUG_ENABLED, GET_INTERNAL_SYMBOL } from "./_internal/constants";
import { logger } from "./_internal/logger";

import core from "./_internal/core.ts";

import { Commands as CoreCommands } from "@zenflux/core/src/managers/commands";
import { CommandNotFound } from "@zenflux/core/src/errors/command-not-found";

import type { TCommandCallbackType } from "@zenflux/core/src/interfaces";

import type { CommandBase } from "@zenflux/react-commander/command-base";
import type { CommandBase as CoreCommandBase } from "@zenflux/core/src/command-bases/command-base";

import type {
    DCommandArgs,
    DCommandHookHandle,
    DCommandIdArgs,
    DCommandNewInstanceWithArgs,
    DCommandRegisterArgs,
    DCommandSingleComponentContext
} from "@zenflux/react-commander/definitions";

/**
 * Adapter that exposes core Commands' protected hook-firing methods.
 */
class CoreCommandsAdapter extends CoreCommands {
    public static getName() {
        return "@zenflux/react-commander/CoreCommandsAdapter";
    }

    public static getSourcePath() {
        return "@zenflux/react-commander";
    }

    public fireBeforeRun( command: CoreCommandBase, args: any = {}, options = {} ) {
        this.onBeforeRun( command, args, options );
    }

    public async fireAfterRun( command: CoreCommandBase, args: any, options: {}, result: any ) {
        return this.onAfterRun( command, args, options, result );
    }
}

class CommandsManager {
    /**
     * Core Commands instance providing hook infrastructure
     * (onBefore, onAfter, onAfterUI, onAfterOnce, onAfterAffect).
     */
    private coreCommands = new CoreCommandsAdapter();

    private commands: {
        [ componentName: string ]: {
            [ commandName: string ]: CommandBase
        };
    } = {};

    private scopedHooks: {
        [ componentNameUnique: string ]: {
            [ commandName: string ]: Array<{ ownerId: string; original: ( result?: any, args?: DCommandArgs ) => any; wrapped: ( result?: any, args?: DCommandArgs ) => any; }>
        }
    } = {};

    private commandToComponentMap: {
        [ commandName: string ]: string;
    } = {};

    public register( args: DCommandRegisterArgs ) {
        const { componentName, commands } = args;

        if ( this.commands[ componentName ] ) {
        }

        const createdCommands: CommandBase[] = [];

        if ( ! this.commands[ componentName ] ) {
            this.commands[ componentName ] = {};
        }

        commands.forEach( ( command ) => {
            const commandName = ( command as unknown as typeof CommandBase ).getName();
            const commandInstance = new ( command as unknown as DCommandNewInstanceWithArgs )( args );

            this.commands[ componentName ][ commandName ] = commandInstance;
            this.commandToComponentMap[ commandName ] = componentName;

            createdCommands.push( commandInstance );
        } );

        return createdCommands;
    }

    public async run( id: DCommandIdArgs, args: DCommandArgs, callback?: ( result: any ) => any ) {
        const { componentNameUnique, componentName, commandName } = id;

        const command = this.commands[ componentName ]?.[ commandName ];

        if ( ! command ) {
            throw new CommandNotFound( commandName );
        }

        if ( DEBUG_ENABLED ) logger.debug( this.run, `Commands.run() '${ commandName }' for component '${ componentNameUnique }'`, args );

        // Fire core's before-run hooks
        this.coreCommands.fireBeforeRun( command as unknown as CoreCommandBase, args );

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique );

        let executionResult;

        if ( singleComponentContext.getState ) {
            executionResult = await command.execute( singleComponentContext.emitter, args, {
                state: singleComponentContext.getState(),
                setState: singleComponentContext.setState,
            } );
        } else {
            executionResult = await command.execute( singleComponentContext.emitter, args );
        }

        // Fire core's after-run hooks
        await this.coreCommands.fireAfterRun( command as unknown as CoreCommandBase, args, {}, executionResult );

        if ( callback ) {
            callback( executionResult );
        }

        return executionResult;
    }

    public unregister( componentName: string ) {
        this.unhookWithinComponent( componentName );

        // Clean up command to component mapping
        Object.keys( this.commandToComponentMap ).forEach( commandName => {
            if ( this.commandToComponentMap[ commandName ] === componentName ) {
                delete this.commandToComponentMap[ commandName ];
            }
        } );

        delete this.commands[ componentName ];
    }

    public hook( id: DCommandIdArgs, callback: ( result?: any, args?: DCommandArgs ) => any, options?: {
        __ignoreDuplicatedHookError?: boolean;
    } ) {
        const { componentNameUnique, componentName, commandName } = id;

        if ( ! this.commands[ componentName ] ) {
            throw new Error( `Component '${ componentName }' not registered` );
        }

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique ) as DCommandSingleComponentContext;

        // Check if id exist within the component context
        if ( ! singleComponentContext.commands[ commandName ] ) {
            throw new CommandNotFound( commandName );
        }

        const listeners = singleComponentContext.emitter.listeners( commandName );

        if ( ! options?.__ignoreDuplicatedHookError ) {
            // Check if the same callback is already registered
            if ( listeners.length > 0 && listeners.find( l => l.name === callback.name ) ) {
                logger.warn( this.hook,
                    `Probably duplicated hook in '${ commandName }'\n` +
                    `callback '${ callback.name }()' already hooked for component '${ componentNameUnique }'` +
                    "The hook will be ignored, to avoid this error bound the callback or pass options: { __ignoreDuplicatedHookError: true }"
                );

                return;
            }
        }

        singleComponentContext.emitter.on( commandName, callback );

        return {
            componentNameUnique,
            commandName,
            callback,
            dispose: () => {
                singleComponentContext.emitter.off( commandName, callback );
            }
        };
    }

    public hookScoped( id: DCommandIdArgs, ownerId: string, callback: ( result?: any, args?: DCommandArgs ) => any ): DCommandHookHandle {
        const { componentNameUnique, componentName, commandName } = id;

        if ( ! this.commands[ componentName ] ) {
            throw new Error( `Component '${ componentName }' not registered` );
        }

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique ) as DCommandSingleComponentContext;

        if ( ! singleComponentContext.commands[ commandName ] ) {
            throw new CommandNotFound( commandName );
        }
        const wrapped = ( result?: any, args?: DCommandArgs ) => callback( result, args );
        singleComponentContext.emitter.on( commandName, wrapped );

        if ( ! this.scopedHooks[ componentNameUnique ] ) this.scopedHooks[ componentNameUnique ] = {} as any;
        if ( ! this.scopedHooks[ componentNameUnique ][ commandName ] ) this.scopedHooks[ componentNameUnique ][ commandName ] = [];

        this.scopedHooks[ componentNameUnique ][ commandName ].push( { ownerId, original: callback, wrapped } );

        const handle: DCommandHookHandle = {
            componentNameUnique,
            commandName,
            ownerId,
            dispose: () => this.unhookHandle( handle )
        };

        return handle;
    }

    public unhook( id: DCommandIdArgs ) {
        const { componentNameUnique, componentName, commandName } = id;

        if ( ! this.commands[ componentName ] ) {
            throw new Error( `Component '${ componentName }' not registered` );
        }

        // If HMR is active, suppress errors for missing contexts during hot reload
        const shouldSilentError = !! import.meta.hot;

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, shouldSilentError ) as DCommandSingleComponentContext;

        if ( ! singleComponentContext && shouldSilentError ) {
            return;
        }

        // Check if id exist within the component context
        if ( ! singleComponentContext.commands[ commandName ] ) {
            throw new CommandNotFound( commandName );
        }

        singleComponentContext.emitter.removeAllListeners( commandName );

        if ( this.scopedHooks[ componentNameUnique ] && this.scopedHooks[ componentNameUnique ][ commandName ] ) {
            delete this.scopedHooks[ componentNameUnique ][ commandName ];
        }
    }

    public unhookHandle( handle: DCommandHookHandle ) {
        const { componentNameUnique, commandName, ownerId } = handle;
        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, true ) as DCommandSingleComponentContext;
        if ( ! singleComponentContext ) return;

        const records = this.scopedHooks[ componentNameUnique ]?.[ commandName ];
        if ( ! records ) return;

        const remaining: typeof records = [];
        records.forEach( ( record ) => {
            if ( record.ownerId === ownerId ) {
                singleComponentContext.emitter.off( commandName, record.wrapped );
            } else {
                remaining.push( record );
            }
        } );

        this.scopedHooks[ componentNameUnique ][ commandName ] = remaining;
    }

    public unhookWithinComponent( componentNameUnique: string ) {
        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, true ) as DCommandSingleComponentContext;

        singleComponentContext && Object.keys( singleComponentContext.commands ).forEach( ( commandName ) => {
            singleComponentContext.emitter.removeAllListeners( commandName );
        } );

        delete this.scopedHooks[ componentNameUnique ];
    }

    public get( componentName: string, shouldSilentError = false ) {
        if ( ! shouldSilentError && ! this.commands[ componentName ] ) {
            throw new Error( `Component '${ componentName }' not registered` );
        }

        return this.commands[ componentName ];
    }

    public getComponentName( commandName: string ) {
        return this.commandToComponentMap[ commandName ];
    }

    public getCommands() {
        return this.commands;
    }

    public isHooked( id: DCommandIdArgs ) {
        const { componentNameUnique, commandName } = id;

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, true ) as DCommandSingleComponentContext;

        if ( ! singleComponentContext ) {
            return false;
        }

        const listeners = singleComponentContext.emitter.listeners( commandName );

        return listeners.length > 0;
    }

    public resolveId( commandName: string, componentName: string, index = 0 ): DCommandIdArgs {
        const contexts = core.__devGetContextValues?.() || [];
        const matches = contexts.filter( c => c.componentName === componentName && !!c.commands[ commandName ] );
        const ctx = matches[ index ];
        if ( ! ctx ) throw new CommandNotFound( commandName );
        return { commandName, componentName, componentNameUnique: ctx.componentNameUnique };
    }

    public runByName( commandName: string, componentName: string, args: DCommandArgs ) {
        const id = this.resolveId( commandName, componentName );
        return this.run( id, args );
    }

    public hookByNameScoped( params: { commandName: string; componentName: string; ownerId: string }, callback: ( result?: any, args?: DCommandArgs ) => any ) {
        const id = this.resolveId( params.commandName, params.componentName );
        return this.hookScoped( id, params.ownerId, callback );
    }

    public isContextRegistered( componentNameUnique: string ) {
        return !! core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, true );
    }

    // --- Core Commands hook API delegation ---

    /**
     * Register a data-only before hook for a command.
     */
    public onBefore( hookCommand: string, callback: TCommandCallbackType ) {
        this.coreCommands.onBefore( hookCommand, callback );
    }

    /**
     * Register a UI-only before hook for a command.
     */
    public onBeforeUI( hookCommand: string, callback: TCommandCallbackType ) {
        this.coreCommands.onBeforeUI( hookCommand, callback );
    }

    /**
     * Register a data-only after hook for a command.
     */
    public onAfter( hookCommand: string, callback: TCommandCallbackType ) {
        this.coreCommands.onAfter( hookCommand, callback );
    }

    /**
     * Register a UI-only after hook for a command.
     */
    public onAfterUI( command: string, callback: TCommandCallbackType ) {
        this.coreCommands.onAfterUI( command, callback );
    }

    /**
     * Register a one-time after hook for a command.
     */
    public onAfterOnce( command: string, callback: TCommandCallbackType ) {
        this.coreCommands.onAfterOnce( command, callback );
    }

    /**
     * Register a trigger that runs a command after another command runs.
     */
    public onAfterAffect( hookCommand: string, affectCommand: string ) {
        this.coreCommands.onAfterAffect( hookCommand, affectCommand );
    }

    public devShowComponents() {
        console.group( "🔧 CommandsManager Dev Info" );

        console.log( "📋 Registered Commands:" );
        Object.entries( this.commands ).forEach( ( [ componentName, commands ] ) => {
            console.group( `  ${ componentName }` );
            Object.keys( commands ).forEach( commandName => {
                console.log( `    - ${ commandName }` );
            } );
            console.groupEnd();
        } );

        console.log( "🗺️ Command to Component Mapping:" );
        Object.entries( this.commandToComponentMap ).forEach( ( [ commandName, componentName ] ) => {
            console.log( `  ${ commandName } → ${ componentName }` );
        } );

        console.log( "🔗 Scoped Hooks:" );
        Object.entries( this.scopedHooks ).forEach( ( [ componentNameUnique, commandHooks ] ) => {
            console.group( `  ${ componentNameUnique }` );
            Object.entries( commandHooks ).forEach( ( [ commandName, hooks ] ) => {
                console.log( `    ${ commandName }: ${ hooks.length } hook(s)` );
                hooks.forEach( ( hook, index ) => {
                    console.log( `      [${ index }] owner: ${ hook.ownerId }` );
                } );
            } );
            console.groupEnd();
        } );

        console.log( "🌐 Non-Scoped Hooks:" );
        const contextKeys = core.__devGetContextKeys();
        contextKeys.forEach( key => {
            const context = core[ GET_INTERNAL_SYMBOL ]( key, true );
            const hasNonScopedHooks = Object.keys( context.commands ).some( commandName => {
                const listeners = context.emitter.listeners( commandName );
                return listeners.length > 0;
            } );

            if ( hasNonScopedHooks ) {
                console.group( `  ${ key }` );
                Object.keys( context.commands ).forEach( commandName => {
                    const listeners = context.emitter.listeners( commandName );
                    if ( listeners.length > 0 ) {
                        console.log( `    ${ commandName }: ${ listeners.length } listener(s)` );
                        listeners.forEach( ( listener, index ) => {
                            console.log( `      [${ index }] ${ listener.name || "anonymous" }` );
                        } );
                    }
                } );
                console.groupEnd();
            }
        } );

        console.log( "🏗️ Core Context:" );
        console.log( `  Total components: ${ contextKeys.length }` );
        contextKeys.forEach( key => {
            const context = core[ GET_INTERNAL_SYMBOL ]( key, true );
            console.log( `    ${ key }: ${ context.commands.length } command(s)` );
        } );

        console.groupEnd();
    }
}

const COMMANDS_MANAGER_KEY = Symbol.for( "@zenflux/react-commander/commands-manager" );

function getOrCreateCommandsManager(): CommandsManager {
    const globalStore = globalThis as unknown as Record<symbol, CommandsManager>;

    if ( ! globalStore[ COMMANDS_MANAGER_KEY ] ) {
        globalStore[ COMMANDS_MANAGER_KEY ] = new CommandsManager();
    }

    return globalStore[ COMMANDS_MANAGER_KEY ];
}

export const commands = getOrCreateCommandsManager();

if ( import.meta.env.DEV ) {
    ( window as any ).$$commands = commands;
    ( window as any ).$$dev = () => commands.devShowComponents();
}

export default commands;
