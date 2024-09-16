// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "./_internal/core.ts";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL } from "./_internal/constants";

import type {
    DCommandArgs,
    DCommandNewInstanceWithArgs,
    DCommandRegisterArgs,
    DCommandIdArgs,
    DCommandSingleComponentContext
} from "@zenflux/react-commander/definitions";

import type { CommandBase } from "@zenflux/react-commander/command-base";

class CommandsManager {
    private commands: {
        [ componentName: string ]: {
            [ commandName: string ]: CommandBase
        };
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

        return singleComponentContext.emitter.removeAllListeners( commandName );
    }

    public unhookWithinComponent( componentNameUnique: string ) {
        const singleComponentContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique, true ) as DCommandSingleComponentContext;

        singleComponentContext && Object.keys( singleComponentContext.commands ).forEach( ( commandName ) => {
            singleComponentContext.emitter.removeAllListeners( commandName );
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
