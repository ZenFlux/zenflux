import EventEmitter from "eventemitter3";

import type { DCommandOptions, DCommandArgs, DCommandRegisterArgs } from "@zenflux/react-commander/definitions";

import type React from "react";

/**
 * Each created command is registered within the commands manager, and the instance created only once per command.
 */
export abstract class CommandBase<TState = React.ComponentState, TArgs = DCommandArgs> {
    private static globalEmitter: EventEmitter = new EventEmitter();

    public readonly commandName: string;

    private options: DCommandOptions<TState> = {};

    public static getName(): string {
        throw new Error( "You have should implement `static getName()` method, since the commands run by name ;)" );
    }

    public static globalHook( callback: ( result?: any, args?: DCommandArgs ) => any ) {
        this.globalEmitter.on( this.getName(), callback );
    }

    public static globalUnhook() {
        this.globalEmitter.listeners( this.getName() ).forEach( ( listener: any ) => {
            this.globalEmitter.off( this.getName(), listener );
        } );
    }

    public constructor( private args: DCommandRegisterArgs ) {
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

    public execute( emitter: EventEmitter, args: TArgs, options?: DCommandOptions<TState> ): any {
        if ( options ) {
            this.options = options;
        }

        this.validateArgs?.( args, options );

        const result = this.apply?.( args );

        emitter.emit( this.commandName, result, args );

        this.global().globalEmitter.emit( this.commandName, result, args );

        this.options = {};

        return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected validateArgs?( args: TArgs, options?: DCommandOptions<TState> ) {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected apply?( args: TArgs ) {
    }

    protected get state(): TState {
        this.validateState();

        return this.options.state;
    }

    protected setState<K extends keyof TState>(
        state: ( ( prevState: Readonly<TState> ) => Pick<TState, K> | TState | null ) | ( Pick<TState, K> | TState | null ),
        callback?: ( state: TState ) => void,
    ) {
        this.validateState();

        return new Promise( ( resolve ) => {
            this.options.setState!( state, ( currentState: React.ComponentState ) => {
                callback?.( currentState );

                resolve( currentState );
            } );
        } );
    }

    private validateState() {
        if ( "undefined" === typeof this.options.state || "function" !== typeof this.options.setState ) {
            throw new Error( "There is no state for the current command, you should use `withCommands( component, class, state, commands )` including the state to enable it" );
        }
    }
}

