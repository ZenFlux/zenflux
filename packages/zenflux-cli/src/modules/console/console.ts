/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { Console as NodeConsole } from "node:console";

import inspector from "node:inspector";

import process from "process";

import type { ConsoleConstructorOptions } from "node:console";

type TLoggerMethod = typeof Console.prototype.log |
    typeof Console.prototype.error |
    typeof Console.prototype.warn |
    typeof Console.prototype.info |
    typeof Console.prototype.debug |
    typeof Console.prototype.message |
    typeof Console.prototype.verbose;

export class Console extends NodeConsole {
    protected prefix: string;

    protected currentLoggerMethod: null | TLoggerMethod = null;

    public constructor( options: ConsoleConstructorOptions ) {
        super( options );

        if ( ! process.argv.includes( "--verbose" ) ) {
            this.verbose = () => {};
        }

        // TODO: Its probably better to send debug directly to inspector instead of sending it via main-thread.
        // Enable debug only when debugger connected
        if ( ! inspector.url() ) {
            this.debug = () => {};
        }

        this.setPrefix( "" );
    }

    protected setPrefix( prefix: string ) {
        this.prefix = prefix;
    }

    protected output( method: TLoggerMethod, args: any[] ) {
        method.apply( this, args );
    }

    public prompt( message: string ): Promise<string> {
        return new Promise( ( resolve ) => {
            console.log( message );

            process.stdin.resume();
            process.stdin.once( "data", ( data ) => {
                process.stdin.pause();

                resolve( data.toString().trim() );
            } );
        } );
    }

    public confirm( message: string ): Promise<boolean> {
        return new Promise( async ( resolve ) => {
            const answer = await this.prompt( `${ message } (y/n)` );

            resolve( answer === "y" );
        } );
    }

    public log( ... args: any[] ) {
        if ( ! this.currentLoggerMethod ) {
            this.currentLoggerMethod = this.log;
        }

        this.output( this.log, args );

        this.currentLoggerMethod = null;
    }

    public error( ... args: any[] ) {
        this.currentLoggerMethod = this.error;

        this.output( this.error, args );

        this.currentLoggerMethod = null;
    }

    public warn( ... args: any[] ) {
        this.currentLoggerMethod = this.warn;

        this.output( this.warn, args );

        this.currentLoggerMethod = null;
    }

    public info( ... args: any[] ) {
        this.currentLoggerMethod = this.info;

        this.output( this.info, args );

        this.currentLoggerMethod = null;
    }

    public verbose( id: number | string, subject: string, action: string, ... args: any[] ): void;
    public verbose( callback: () => any ): void;

    public verbose( context: any ): void {
        if ( typeof context === "function" ) {
            this.currentLoggerMethod = this.verbose;

            let result = context();

            result = Array.isArray( result ) ? result : [ result ];

            super.log.apply( this, [
                this.prefix,
                ... result
            ] );

            this.currentLoggerMethod = null;

            return;
        }

        const [ id, subject, action, ... args ] = context;

        this.verbose( () => [ id, subject, action, ... args ] );
    }

    public debug( id: number | string, subject: string, action: string, ... args: any[] ): void;
    public debug( callback: () => any ): void;

    public debug( context: any ): void {
        if ( typeof context === "function" ) {
            this.currentLoggerMethod = this.debug;

            let result = context();

            result = Array.isArray( result ) ? result : [ result ];

            if ( inspector.url() ) {
                // @ts-ignore
                inspector.console.log( ... result );
            }

            this.currentLoggerMethod = null;

            return;
        }

        const [ id, subject, action, ... args ] = context;

        this.debug( () => [ id, subject, action, ... args ] );
    }

    public message( id: number | string, subject: string, action: string, ... args: any[] ) {
        const paddedArgs = args.map( arg => String( arg ).padEnd( 50 ) ).join( "\t" );

        // Capitalize subject and Action
        subject = subject.charAt( 0 ).toUpperCase() + subject.slice( 1 );
        action = action.charAt( 0 ).toUpperCase() + action.slice( 1 );

        this.currentLoggerMethod = this.message;

        this.log( id, subject, action, paddedArgs );
    }
}
