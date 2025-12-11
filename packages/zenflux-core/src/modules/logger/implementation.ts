import pc from "picocolors";

import {
    getLoggerLogLevel,
    getLoggerLogLevelString,
    getLoggerTimeFormat,
    isLoggerDebugEnabled,
    isLoggerDisabled,
    isLoggerPreviousSourceDisabled
} from "./config";

import { LoggerBrowserInfra, type LoggerOutputFormat, type LoggerOutputMetadata, type LoggerOutputSubscriber } from "./logger-browser-infra";

import { reduceCircularReferences } from "./utils";

import { ObjectBase } from "../../bases/object-base";
import { EventBus } from "../event-bus/event-bus";

import type * as interfaces from "../../interfaces";

const DEFAULT_LOG_PREFIX = pc.white( "⚪  - [LOG]" ),
    DEFAULT_INFO_PREFIX = pc.blue( "🔵 - [INFO]" ),
    DEFAULT_DEBUG_PREFIX = pc.gray( "🟤 - [DEBUG]" ),
    DEFAULT_WARN_PREFIX = pc.yellow( "🟡 - [WARN]" ),
    DEFAULT_ERROR_PREFIX = pc.red( "🔴 - [ERROR]" ),
    DEFAULT_ADMIN_PREFIX = pc.bold( "🟣 - [ADMIN]" );

type LoggerLevel = "log" | "info" | "debug" | "warn" | "error" | "admin";

const LEVEL_LABELS: Record<LoggerLevel, string> = {
    log: "LOG",
    info: "INFO",
    debug: "DEBUG",
    warn: "WARN",
    error: "ERROR",
    admin: "ADMIN",
};

const registeredNames: Record<string, boolean> = {};

type ICaller = interfaces.TCaller;

interface LoggerOptions {
    skipEventBusHook?: boolean;
    repeatedly?: boolean;
}

export class Logger extends LoggerBrowserInfra implements interfaces.ILogger {
    private static lastLogTime: number = Date.now();
    private static timestampFormat: string = getLoggerTimeFormat();

    private readonly ownerName: string;

    private messagePrefixes: string[] = [];

    private config: LoggerOptions = {};

    public static setTimestampFormat( format: string ) {
        Logger.timestampFormat = ( format || "" ).trim();
    }

    public static getTimestampFormat() {
        return Logger.timestampFormat;
    }

    public static getName(): string {
        return "ZenFlux/Core/Modules/Logger";
    }

    public static getLogLevelString(): string {
        return getLoggerLogLevelString();
    }

    public static getLogLevel(): number {
        return getLoggerLogLevel();
    }

    public static attachOutputListener( listener: LoggerOutputSubscriber ) {
        return LoggerBrowserInfra.attachOutputSubscriber( listener );
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
        this.writeLog( "log", DEFAULT_LOG_PREFIX, caller, message, ...params );
    }

    public info( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( "info", DEFAULT_INFO_PREFIX, caller, message, ...params );
    }

    public debug( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( "debug", DEFAULT_DEBUG_PREFIX, caller, message, ...params );
    }

    public warn( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( "warn", DEFAULT_WARN_PREFIX, caller, message, ...params );
    }

    public error( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( "error", DEFAULT_ERROR_PREFIX, caller, message, ...params );
    }

    public admin( caller: ICaller, message: string, ...params: any[] ): void {
        this.writeLog( "admin", DEFAULT_ADMIN_PREFIX, caller, message, ...params );
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

    private writeLog( level: LoggerLevel, prefix: string, caller: ICaller, message: string, ...params: any[] ): void {
        const callerName = this.getCallerName( caller );
        const source = this.getPreviousSource() + pc.white( `${ this.ownerName }::${ callerName }` );

        let messagePrefix = "";

        if ( this.messagePrefixes.length ) {
            messagePrefix = `[${ this.messagePrefixes.join( "][" ) }]`;
        }

        const timestampValue = Date.now();
        const timeDiff = ( timestampValue - Logger.lastLogTime ).toString().padStart( 4, "0" );

        const timeFormat = Logger.getTimestampFormat();
        const timestamp = timeFormat ? this.formatTime( new Date( timestampValue ), timeFormat ) : "";

        this.outputEvent( prefix, timeDiff, source, messagePrefix, message, params );

        const timestampPart = timestamp ? `${ timestamp } ` : "";
        const output = `${ timestampPart }${ prefix }[+${ timeDiff }ms][${ source }]${ messagePrefix }: ${ message }`;

        const formatted = this.createBrowserFormat( level, callerName, messagePrefix, message );
        const metadata: LoggerOutputMetadata = {
            id: `${ timestampValue }-${ Math.random().toString( 16 ).slice( 2 ) }`,
            level,
            namespace: this.ownerName,
            callerName,
            message,
            messagePrefix,
            payload: params.length === 0 ? undefined : ( params.length === 1 ? params[ 0 ] : params ),
            timestamp: timestampValue,
            formatted,
        };

        this.runWithOutputMetadata( metadata, () => {
            this.output( output, ...params );
        } );

        Logger.lastLogTime = timestampValue;
    }

    private createBrowserFormat( level: LoggerLevel, callerName: string, messagePrefix: string, message: string ): LoggerOutputFormat {
        const prefixLabel = LEVEL_LABELS[ level ] || level.toUpperCase();
        const prefixPart = messagePrefix ? `${ messagePrefix } ` : "";

        return {
            format: `%c(${ prefixLabel })-> %c%c${ this.ownerName }%c::%c${ callerName }%c() ${ prefixPart }${ message }%c`,
            styles: [ ...this.defaultStyle ],
        };
    }

    private formatTime( date: Date, format: string ): string {
        // Supported tokens (longest matched first):
        //   YYYY / Y  year
        //   M        month (01-12)
        //   D        day (01-31)
        //   HH / hh  hours 00-23
        //   mm       minutes 00-59
        //   ss       seconds 00-59
        //   SSS / S  milliseconds (000-999)
        const pad = ( num: number, size = 2 ) => num.toString().padStart( size, "0" );

        const tokens: Record<string, string> = {
            "YYYY": date.getFullYear().toString(),
            "Y": date.getFullYear().toString(),
            "M": pad( date.getMonth() + 1 ),
            "D": pad( date.getDate() ),
            "HH": pad( date.getHours() ),
            "hh": pad( date.getHours() ),
            "mm": pad( date.getMinutes() ),
            "ss": pad( date.getSeconds() ),
            "SSS": pad( date.getMilliseconds(), 3 ),
            "S": pad( date.getMilliseconds(), 3 ),
        };

        return format.replace( /YYYY|HH|hh|mm|ss|SSS|Y|M|D|S|h|m|s/g, ( token ) => tokens[ token ] ?? token );
    }
}

export default Logger;
