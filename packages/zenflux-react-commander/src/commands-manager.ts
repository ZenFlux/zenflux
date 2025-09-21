// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "./_internal/core.ts";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL } from "./_internal/constants";

import type {
    DCommandArgs,
    DCommandNewInstanceWithArgs,
    DCommandRegisterArgs,
    DCommandIdArgs,
    DCommandSingleComponentContext,
    DCommandHookHandle
} from "@zenflux/react-commander/definitions";

import type { CommandBase } from "@zenflux/react-commander/command-base";

class CommandsManager {
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

            createdCommands.push( commandInstance );
        } );

        return createdCommands;
    }

    public run( id: DCommandIdArgs, args: DCommandArgs, callback?: ( result: any ) => any ) {
        const { componentNameUnique, componentName, commandName } = id;

        const command = this.commands[ componentName ]?.[ commandName ];

        if ( ! command ) {
            throw new Error( `Command '${ commandName }' not registered for component '${ componentName }'` );
        }

        console.log( `Commands.run() '${ commandName }' for component '${ componentNameUnique }'`, args );

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique );

        let executionResult;

        if ( singleComponentContext.getState ) {
            executionResult = command.execute( singleComponentContext.emitter, args, {
                state: singleComponentContext.getState(),
                setState: singleComponentContext.setState,
            } );
        } else {
            executionResult = command.execute( singleComponentContext.emitter, args );
        }

        if ( callback ) {
            callback( executionResult );
        }

        return executionResult;
    }

    public unregister( componentName: string ) {
        this.unhookWithinComponent( componentName );

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
            throw new Error( `Command '${ commandName }' not registered for component '${ componentNameUnique }'` );
        }

        const listeners = singleComponentContext.emitter.listeners( commandName );

        if ( ! options?.__ignoreDuplicatedHookError ) {
            // Check if the same callback is already registered
            if ( listeners.length > 0 && listeners.find( l => l.name === callback.name ) ) {
                console.warn(
                    `Probably duplicated hook in '${ commandName }'\n` +
                    `callback '${ callback.name }()' already hooked for component '${ componentNameUnique }'` +
                    "The hook will be ignored, to avoid this error bound the callback or pass options: { __ignoreDuplicatedHookError: true }"
                );

                return;
            }
        }

        return singleComponentContext.emitter.on( commandName, callback );
    }

    public hookScoped( id: DCommandIdArgs, ownerId: string, callback: ( result?: any, args?: DCommandArgs ) => any, options?: {
        __ignoreDuplicatedHookError?: boolean;
    } ): DCommandHookHandle {
        const { componentNameUnique, componentName, commandName } = id;

        if ( ! this.commands[ componentName ] ) {
            throw new Error( `Component '${ componentName }' not registered` );
        }

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique ) as DCommandSingleComponentContext;

        if ( ! singleComponentContext.commands[ commandName ] ) {
            throw new Error( `Command '${ commandName }' not registered for component '${ componentNameUnique }'` );
        }

        const listeners = singleComponentContext.emitter.listeners( commandName );
        if ( ! options?.__ignoreDuplicatedHookError ) {
            if ( listeners.length > 0 && listeners.find( l => l.name === callback.name ) ) {
                console.warn(
                    `Probably duplicated hook in '${ commandName }'\n` +
                    `callback '${ callback.name }()' already hooked for component '${ componentNameUnique }'` +
                    "The hook will be ignored, to avoid this error bound the callback or pass options: { __ignoreDuplicatedHookError: true }"
                );

                return {
                    componentNameUnique,
                    commandName,
                    ownerId,
                    dispose: () => void 0,
                };
            }
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

        // @ts-ignore - If it hot reloads then skip the error
        const shouldSilentError = !! typeof import.meta.hot?.hmrClient.pruneMap.size;

        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, shouldSilentError ) as DCommandSingleComponentContext;

        if ( ! singleComponentContext && shouldSilentError ) {
            return;
        }

        // Check if id exist within the component context
        if ( ! singleComponentContext.commands[ commandName ] ) {
            throw new Error( `Command '${ commandName }' not registered for component '${ componentNameUnique }'` );
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

    public unhookWithinComponentByOwner( componentNameUnique: string, ownerId: string ) {
        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, true ) as DCommandSingleComponentContext;
        if ( ! singleComponentContext ) return;

        const perCommand = this.scopedHooks[ componentNameUnique ];
        if ( ! perCommand ) return;

        Object.keys( perCommand ).forEach( ( commandName ) => {
            const records = perCommand[ commandName ];
            const remaining: typeof records = [];
            records.forEach( ( record ) => {
                if ( record.ownerId === ownerId ) {
                    singleComponentContext.emitter.off( commandName, record.wrapped );
                } else {
                    remaining.push( record );
                }
            } );
            perCommand[ commandName ] = remaining;
        } );
    }

    public get( componentName: string, shouldSilentError = false ) {
        if ( ! shouldSilentError && ! this.commands[ componentName ] ) {
            throw new Error( `Component '${ componentName }' not registered` );
        }

        return this.commands[ componentName ];
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

    public isContextRegistered( componentNameUnique: string ) {
        return !! core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, true );
    }
}

export const commands = new CommandsManager();

if ( import.meta.env.DEV ) {
    ( window as any ).$$commands = commands;
}

export default commands;
