import EventEmitter from "eventemitter3";

import { CommandPublic } from "@zenflux/core/src/command-bases/command-public";

import type { DCommandOptions, DCommandArgs, DCommandRegisterArgs } from "@zenflux/react-commander/definitions";

import type React from "react";

/**
 * Each created command is registered within the commands manager, and the instance created only once per command.
 *
 * Extends `CommandPublic` from `@zenflux/core` to inherit:
 * - `ObjectBase`: unique id, `getName()`, `getUniqueId()`, `getHierarchyNames()`
 * - `CommandBase`: logger, `onBeforeApply`/`onAfterApply` lifecycle hooks, `run()` method
 * - `CommandPublic`: semantic marker for user-facing commands
 */
export abstract class CommandBase<TState = React.ComponentState, TArgs = DCommandArgs> extends CommandPublic {
    private static globalEmitter: EventEmitter = new EventEmitter();

    public readonly commandName: string;

    private reactOptions: DCommandOptions<TState> = {};

    public static getName(): string {
        throw new Error( "You have should implement `static getName()` method, since the commands run by name ;)" );
    }

    public static getSourcePath(): string {
        return "@zenflux/react-commander";
    }

    public static globalHook( callback: ( result?: any, args?: DCommandArgs ) => any ) {
        this.globalEmitter.on( this.getName(), callback );
    }

    public static globalUnhook() {
        this.globalEmitter.listeners( this.getName() ).forEach( ( listener: any ) => {
            this.globalEmitter.off( this.getName(), listener );
        } );
    }

    /**
     * React-commander creates command instances during registration (not per-execution),
     * so we pass empty args/options to core's CommandBase constructor.
     */
    public constructor( private registerArgs: DCommandRegisterArgs ) {
        super( {}, {} );

        this.commandName = ( new.target as typeof CommandBase ).getName();
    }

    public global() {
        const global = ( this.constructor as typeof CommandBase );

        return global as unknown as {
            getName: typeof CommandBase.getName;

            globalEmitter: EventEmitter;
            globalHook: typeof CommandBase.globalHook;
            globalUnhook: typeof CommandBase.globalUnhook;
        };
    }

    /**
     * React-aware command execution entry point.
     *
     * Integrates core's lifecycle hooks (`onBeforeApply`/`onAfterApply`) while
     * preserving react-commander's event emission and state management.
     */
    public async execute( emitter: EventEmitter, args: TArgs, options?: DCommandOptions<TState> ): Promise<any> {
        if ( options ) {
            this.reactOptions = options;
        }

        this.validateArgs?.( args, options );

        // Core lifecycle: before
        this.onBeforeApply?.();

        const result = await this.apply( args as any );

        // Core lifecycle: after
        this.onAfterApply?.();

        const listeners = emitter.listeners( this.commandName );
        for ( const listener of listeners ) {
            await listener( result, args );
        }

        const globalListeners = this.global().globalEmitter.listeners( this.commandName );
        for ( const globalListener of globalListeners ) {
            await globalListener( result, args );
        }

        this.reactOptions = {};

        return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected validateArgs?( args: TArgs, options?: DCommandOptions<TState> ) {
    }

    /**
     * Override core's `apply()` (which throws `ForceMethodImplementation`) to be
     * optional — react-commander commands may or may not implement apply.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected apply( args?: any, _options?: any ): Promise<any> | any {
    }

    protected get state(): TState {
        this.validateState();

        return this.reactOptions.state;
    }

    protected setState<K extends keyof TState>(
        state: ( ( prevState: Readonly<TState> ) => Pick<TState, K> | TState | null ) | ( Pick<TState, K> | TState | null ),
        callback?: ( state: TState ) => void,
    ) {
        this.validateState();

        return new Promise( ( resolve ) => {
            this.reactOptions.setState!( state, ( currentState: React.ComponentState ) => {
                callback?.( currentState );

                resolve( currentState );
            } );
        } );
    }

    private validateState() {
        if ( "undefined" === typeof this.reactOptions.state || "function" !== typeof this.reactOptions.setState ) {
            throw new Error( "There is no state for the current command, you should use `withCommands( component, class, state, commands )` including the state to enable it" );
        }
    }
}
