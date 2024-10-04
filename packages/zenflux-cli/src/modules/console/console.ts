/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { Console as NodeConsole } from "node:console";

import inspector from "node:inspector";

import process from "process";

import type { ConsoleConstructorOptions } from "node:console";

export type TConsoleLoggerMethod = typeof Console.prototype.log |
    typeof Console.prototype.error |
    typeof Console.prototype.warn |
    typeof Console.prototype.info |
    typeof Console.prototype.debug |
    typeof Console.prototype.verbose;

const DEFAULT_LOG_FLAGS = {
    log: 0b00000001,
    error: 0b00000010,
    warn: 0b00000100,
    info: 0b00001000,
    verbose: 0b00010000,
    debug: 0b00100000,
    inspectorDebug: 0b01000000,
};

// Currently default log flag are all except verbose and debug
let logFlags = DEFAULT_LOG_FLAGS.log |
    DEFAULT_LOG_FLAGS.error |
    DEFAULT_LOG_FLAGS.warn |
    DEFAULT_LOG_FLAGS.info;

if ( process.argv.includes( "--verbose" ) ) {
    logFlags |= DEFAULT_LOG_FLAGS.verbose;
}

if ( process.argv.includes( "--debug" ) ) {
    logFlags |= DEFAULT_LOG_FLAGS.debug;
}

if ( inspector.url() || process.argv.includes( "--inspector-debug" ) ) {
    logFlags |= DEFAULT_LOG_FLAGS.inspectorDebug;
}

export class Console extends NodeConsole {
    protected prefix: string;

    public static isFlagEnabled( flag: keyof typeof DEFAULT_LOG_FLAGS ) {
        return ( logFlags & DEFAULT_LOG_FLAGS[ flag ] ) !== 0;
    }

    public constructor( options: ConsoleConstructorOptions ) {
        super( options );

        setTimeout( this.initialize.bind( this ) );
    }

    protected initialize() {
        if ( ! Console.isFlagEnabled( "verbose" ) ) {
            this.verbose = () => {};
        }

        // TODO: Its probably better to send debug directly to inspector instead of sending it via main-thread.
        // Enable debug only when debugger connected
        if ( ! Console.isFlagEnabled( "debug" ) && ! Console.isFlagEnabled( "inspectorDebug" ) ) {
            this.debug = () => {};
        }

        this.prefix = this.getPrefix();
    }

    protected prepareFormat( args: any[], method: ( ( ... args: any[] ) => void ) | ( ( callback: () => any ) => void ) ) {
        args = this.getArgs( method, args );

        if ( this.prefix?.length ) {
            args.unshift( this.prefix );
        }

        if ( this.getFormat ) {
            args = [ this.getFormat( method, args ) ];
        }

        return args;
    }

    public getPrefix() {
        return "";
    }

    public getFormat?( method: TConsoleLoggerMethod, args: any[] ): string;

    public getArgs( method: TConsoleLoggerMethod, args: any[] ) {
        switch ( method.name ) {
            case this.verbose.name:
            case this.debug.name:
                const result = args[ 0 ]();

                args = Array.isArray( result ) ? result : [ result ];
                break;
        }

        return args;
    }

    public output( method: TConsoleLoggerMethod, args: any[], prepareFormat = this.prepareFormat.bind( this ) ) {
        args = prepareFormat( args, method );

        switch ( method.name ) {
            case this.verbose.name:
                super.log( ... args );
                break;

            case this.debug.name:
                if ( inspector.url() ) {
                    // @ts-ignore
                    inspector.console.log( ... args );
                }

                if ( process.argv.includes( "--debug" ) ) {
                    super.log( ... args );
                }
                break;

            case this.log.name:
                super.log( ... args );
                break;

            case this.error.name:
                super.error( ... args );
                break;

            case this.warn.name:
                super.warn( ... args );
                break;

            case this.info.name:
                super.info( ... args );
                break;

            default:
                throw new Error( `Unknown method: ${ method.name }` );

        }
    }

    // TODO: Move out
    public prompt( message: string ): Promise<string> {
        return new Promise( ( resolve ) => {
            this.log( message );

            process.stdin.resume();
            process.stdin.once( "data", ( data ) => {
                process.stdin.pause();

                resolve( data.toString().trim() );
            } );
        } );
    }

    // TODO: Move out
    public confirm( message: string ): Promise<boolean> {
        return new Promise( async ( resolve ) => {
            const answer = await this.prompt( `${ message } (y/n)` );

            resolve( answer === "y" );
        } );
    }

    public log( ... args: any[] ) {
        this.output( this.log, args );
    }

    public error( ... args: any[] ) {
        this.output( this.error, args );
    }

    public warn( ... args: any[] ) {
        this.output( this.warn, args );
    }

    public info( ... args: any[] ) {
        this.output( this.info, args );
    }

    public verbose( callback: () => any ): void {
        this.output( this.verbose, [ callback ] );
    }

    public debug( callback: () => any ): void {
        this.output( this.debug, [ callback ] );
    }
}
