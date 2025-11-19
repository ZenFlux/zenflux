import pc from "picocolors";

import { EventBus } from "../event-bus/event-bus";
import { ObjectBase } from "../../bases";

import {
    getLoggerLogLevel,
    getLoggerLogLevelString,
    isLoggerDebugEnabled,
    isLoggerDisabled,
    isLoggerPreviousSourceDisabled
} from "./config";

import { LoggerBrowserInfra } from "./logger-browser-infra";

import { reduceCircularReferences } from "./utils";

import type * as interfaces from "../../interfaces";

const DEFAULT_LOG_PREFIX = pc.white( "⚪  - [LOG]" ),
    DEFAULT_INFO_PREFIX = pc.blue( "🔵 - [INFO]" ),
    DEFAULT_DEBUG_PREFIX = pc.gray( "🟤 - [DEBUG]" ),
    DEFAULT_WARN_PREFIX = pc.yellow( "🟡 - [WARN]" ),
    DEFAULT_ERROR_PREFIX = pc.red( "🔴 - [ERROR]" ),
    DEFAULT_ADMIN_PREFIX = pc.bold( "🟣 - [ADMIN]" );

const registeredNames: Record<string, boolean> = {};

type ICaller = interfaces.TCaller;

interface LoggerOptions {
    skipEventBusHook?: boolean;
    repeatedly?: boolean;
}

export class Logger extends LoggerBrowserInfra implements interfaces.ILogger {
    private static lastLogTime: number = Date.now();

    private readonly ownerName: string;

    private messagePrefixes: string[] = [];

    private config: LoggerOptions = {};

    public static getName(): string {
        return "ZenFlux/Core/Modules/Logger";
    }

    public static getLogLevelString(): string {
        return getLoggerLogLevelString();
    }

    public static getLogLevel(): number {
        return getLoggerLogLevel();
    }

    public static isDebugEnabled() {
        return isLoggerDebugEnabled();
    }

    public constructor( owner: any, options?: LoggerOptions ) {
        const { repeatedly = false, skipEventBusHook } = options || {};

        super( owner, { repeatedly } );

        this.config = { skipEventBusHook };
        this.ownerName = Logger.resolveOwnerName( owner );

        if ( registeredNames[ this.ownerName ] ) {
            throw new Error( `Logger for '${ this.ownerName }' already exists` );
        }

        registeredNames[ this.ownerName ] = true;

        if ( isLoggerDisabled() ) {
            this.disableLoggers();
            return;
        }

        if ( isLoggerPreviousSourceDisabled() ) {
            this.getPreviousSource = () => "";
        }

        switch ( getLoggerLogLevel() ) {
            case 0:
                this.error = () => {};
            // falls through
            case 1:
                this.warn = () => {};
            // falls through
            case 2:
                this.admin = () => {};
            // falls through
            case 3:
                this.info = () => {};
            // falls through
            case 4:
                this.log = () => {};
            // falls through
            case 5:
                this.debug = () => {};
        }

        if ( !this.config.skipEventBusHook ) {
            EventBus.$.registerMultiInstances( this, [ this.outputEvent ] );
        }
    }

    public addMessagePrefix( prefix: string ) {
        this.messagePrefixes.push( prefix );
    }

    public log( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( DEFAULT_LOG_PREFIX, caller, message, ...params );
    }

    public info( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( DEFAULT_INFO_PREFIX, caller, message, ...params );
    }

    public debug( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( DEFAULT_DEBUG_PREFIX, caller, message, ...params );
    }

    public warn( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( DEFAULT_WARN_PREFIX, caller, message, ...params );
    }

    public error( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( DEFAULT_ERROR_PREFIX, caller, message, ...params );
    }

    public admin( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( DEFAULT_ADMIN_PREFIX, caller, message, ...params );
    }

    public startsEmpty( caller: interfaces.TCaller ) {
        this.printFunctionNotify( "▶", caller, "" );
    }

    public startsWith( caller: interfaces.TCaller, params: string | object ) {
        this.printObjectEfficient( "▶", caller, params );
    }

    public dump( caller: interfaces.TCaller, params: { [ key: string ]: object | string } = {}, notice = "" ) {
        for ( const key in params ) {
            if ( typeof params[ key ] === "object" ) {
                params[ key ] = JSON.stringify(
                    LoggerBrowserInfra.useObjectMapper( params[ key ] as object ),
                    reduceCircularReferences()
                );
            }

            this.printInLineElement( "dp", caller, key, params[ key ], notice );
        }
    }

    public drop( caller: interfaces.TCaller, according: { [ key: string ]: string }, data: any ) {
        for ( const key in according ) {
            this.printInLineElement( "dr", caller, key, according[ key ], "corresponding" );
        }

        this.output( data );
    }

    /**
     * TODO: Should respect debug levels, when to throw...
     */
    public throw( caller: interfaces.TCaller, output: string, name: string = "null", params = {} ) {
        this.printFunctionNotify( "tw", caller, output );

        if ( params ) {
            this.printInNextLineObject( "tw", caller, name, params );
        }

        throw new Error().stack;
    }

    public beep() {
        console.log( "\x07" );
    }

    public clone() {
        return Object.assign( Object.create( Object.getPrototypeOf( this ) ), this );
    }

    public outputEvent( _prefix: string, _timeDiff: string, _source: string, _messagePrefix: string, _message: string, _params: any[] ): void {
        // Intentionally left blank, can be hooked via EventBus.
    }

    private static resolveOwnerName( owner: any ): string {
        if ( typeof owner === "string" ) {
            return owner;
        }

        if ( owner instanceof ObjectBase ) {
            return owner.getName();
        }

        if ( owner && typeof owner.getName === "function" ) {
            return owner.getName();
        }

        return "UnknownOwner";
    }

    private disableLoggers() {
        this.error = () => {};
        this.warn = () => {};
        this.admin = () => {};
        this.info = () => {};
        this.log = () => {};
        this.debug = () => {};
    }

    private getStackTrace(): any[] {
        const stackTrace = ( new Error().stack || "" ).split( "\n" );
        const stackLines = stackTrace.slice( 1 );

        const stackRegex = / at (.+?) \((.+?)\)/;
        const result = [];

        for ( const line of stackLines ) {
            const match = line.match( stackRegex );

            if ( match ) {
                const [ , context, file ] = match;
                const parsedLine: any = { context, file };

                if ( line.startsWith( "new" ) ) {
                    parsedLine.isNew = true;
                    parsedLine.object = context.split( " " )[ 1 ];
                } else if ( context !== "Object.<anonymous>" ) {
                    parsedLine.object = context;
                }

                result.push( parsedLine );
            }
        }

        return result;
    }

    public getPreviousSource(): string {
        const stack = this.getStackTrace()
            .filter( ( line: any ) => line.file.includes( "/src/" ) )
            .filter( ( line: any ) => !line.file.includes( "logger.ts" ) )
            .filter( ( line: any ) => !line.file.includes( "debugger.ts" ) )
            .filter( ( line: any ) => !line.file.includes( "/node_modules/" ) );

        let previousSource = "";

        const previousCaller = stack[ 1 ]?.object?.split( "." );

        if ( previousCaller?.length > 1 ) {
            const previousCallerName = previousCaller[ 0 ],
                previousCallerMethod = previousCaller[ 1 ];

            previousSource = `${ previousCallerName }::${ previousCallerMethod }]` + "[";
        }

        return previousSource;
    }

    private writeLog( prefix: string, caller: ICaller, message: string, ...params: any[] ): void {
        const source = this.getPreviousSource() + pc.white( `${ this.ownerName }::${ this.getCallerName( caller ) }` );

        let messagePrefix = "";

        if ( this.messagePrefixes.length ) {
            messagePrefix = `[${ this.messagePrefixes.join( "][" ) }]`;
        }

        const timeDiff = ( Date.now() - Logger.lastLogTime ).toString().padStart( 4, "0" );

        this.outputEvent( prefix, timeDiff, source, messagePrefix, message, params );

        const output = `${ prefix }[+${ timeDiff }ms][${ source }]${ messagePrefix }: ${ message }`;

        console.log( output, ...params );

        Logger.lastLogTime = Date.now();
    }
}

export default Logger;

