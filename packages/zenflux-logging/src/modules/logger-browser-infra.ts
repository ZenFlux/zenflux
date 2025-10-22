/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description a logger for web browser.
 *
 * TODO:
 *  - Add dark/light switch for chrome devtools.
 *      - https://stackoverflow.com/questions/41961037/is-there-a-way-to-detect-if-chromes-devtools-are-using-dark-mode
 *      - Maybe 'zenflux-logging` should be chrome extension.
 */
import { bases } from "@zenflux/core";

import { getHexColorDelta, reduceCircularReferences } from "@z-logging/utils";

import type { interfaces } from "@zenflux/core";

// TODO: Should by dynamic/configure-able.
const MAX_MAPPING_RECURSIVE_DEPTH = 4,
    UNKNOWN_CALLER_NAME = "anonymous function";

// TODO: Should by dynamic/configure-able.
Error.stackTraceLimit = 50;

export abstract class LoggerBrowserInfra extends bases.ObjectBase {
    public static mappers: Function[] = [];
    public static mapperDepth = 0;

    public static colorsOwners: { [ key: string ]: string } = {};
    public static colorsUsed: string[] = [];

    public defaultStyle: string[];

    protected readonly owner: typeof bases.ObjectBase;

    protected args: {
        repeatedly: boolean;
    };

    protected color: string;

    private outputHandler: Function = console.log;

    public static getName() {
        return "ZenFlux/Logging/Modules/LoggerBrowserInfra";
    }

    /**
     * Reset logger globals.
     */
    public static reset() {
        LoggerBrowserInfra.mappers = [];
        LoggerBrowserInfra.mapperDepth = 0;
        LoggerBrowserInfra.colorsUsed = [];
        LoggerBrowserInfra.colorsOwners = {};
    }

    /**
     * Creates a custom mapper for a specific class type.
     *
     * The mapper is a callback function that can modify or enhance objects mapping.
     */
    public static createObjectMapper( callback: Function ) {
        LoggerBrowserInfra.mappers.push( callback );
    }

    /**
     * Gets mapped version of the object by using custom created object mapper.
     */
    public static useObjectMapper( obj: object, shouldHandleChildren = true ) {
        if ( ! obj || Array.isArray( obj ) || "object" !== typeof obj ) {
            return obj;
        }

        LoggerBrowserInfra.mapperDepth++;

        // Result will lose typeof(obj), instanceOf will not work, now based on callback.
        let result = { ... obj } as { [ key: string ]: any };

        // Run all mappers.
        LoggerBrowserInfra.mappers.forEach( ( mapper ) => {
            result = mapper( obj ) || result;
        } );

        // Prevent infinite recursive.
        if ( LoggerBrowserInfra.mapperDepth >= MAX_MAPPING_RECURSIVE_DEPTH ) {
            LoggerBrowserInfra.mapperDepth--;
            return result;
        }

        // Children handling.
        if ( shouldHandleChildren && result ) {
            Object.entries( result ).forEach( ( [ key, value ] ) => {
                result[ key ] = this.useObjectMapper( value, true );
            } );
        }

        LoggerBrowserInfra.mapperDepth--;

        return result;
    }

    public constructor( owner: typeof bases.ObjectBase, args = {} ) {
        super();

        this.args = {
            repeatedly: false,

            ... args,
        };

        this.owner = owner;

        this.initialize();
    }

    protected initialize() {
        const ownerName = this.owner.getName();

        if ( this.args.repeatedly && LoggerBrowserInfra.colorsOwners[ ownerName ] ) {
            this.color = LoggerBrowserInfra.colorsOwners[ ownerName ];
        } else {
            this.color = this.getRandomColor();

            LoggerBrowserInfra.colorsUsed.push( this.color );
        }

        LoggerBrowserInfra.colorsOwners[ ownerName ] = this.color;

        this.defaultStyle = [
            "color: grey;font-size:7px",
            "display: block",
            `color: ${ this.color }`,
            "color: grey",
            "font-weight: bold",
            "color: #607D8B",
            "font-size: 16px;color: red;font-weight:800",
        ];
    }

    public output( ... args: any ) {
        this.outputHandler.apply( this, args );
    }

    protected setOutputHandler( outputHandler: Function ) {
        this.outputHandler = outputHandler;
    }

    protected printFunctionNotify( prefix: string, caller: interfaces.TCaller, output: any ) {
        const callerName = this.getCallerName( caller );

        this.output.apply(
            this,
            [ `%c(${ prefix })-> %c%c${ this.owner.getName() }%c::%c${ callerName }%c() ${ output }%c` ].concat(
                this.defaultStyle
            )
        );
    }

    protected printObjectEfficient( prefix: string, caller: interfaces.TCaller, params: string|object ) {
        params = Object.assign( {}, params );

        if ( typeof params === "string" ) {
            this.printInLineString( prefix, caller, params );

            return;
        }

        if ( Object.keys( params ).length === 1 ) {
            const key = Object.keys( params )[ 0 ];
            let value = Object.values( params )[ 0 ];

            // TODO: Check is repeated logic, handle it.
            if ( "object" === typeof value ) {
                this.printInNextLineObject( prefix, caller, key, value || {} );
            } else if ( "function" === typeof value ) {
                this.printInLineFunction( prefix, caller, key, value );
            } else {
                this.printInLineElement( prefix, caller, key, value );
            }

            return;
        }

        this.printMultiLineObject( prefix, caller, params as any );
    }

    protected printInLineElement( prefix: string, caller: interfaces.TCaller, key: string, value: any, notice = "" ) {
        const callerName = this.getCallerName( caller ),
            ownerName = this.owner.getName(),
            format = notice.length ?
                `%c(${ prefix })-> %c%c${ ownerName }%c::%c${ callerName }%c() ->> [${ notice }] ->> ${ key }: '${ value }'%c` :
                `%c(${ prefix })-> %c%c${ ownerName }%c::%c${ callerName }%c() ->> ${ key }: '${ value }'%c`;

        this.output.apply( this, [ format ].concat( this.defaultStyle ) );
    }

    protected printInLineFunction( prefix: string, caller: interfaces.TCaller, key: string, fn: string | Function ) {
        fn = this.getFunctionView( fn );

        this.printInLineElement( prefix, caller, key, fn );
    }

    protected printInLineString( prefix: string, caller: interfaces.TCaller, string: string ) {
        this.printInLineElement( prefix, caller, "(string)", string );
    }

    protected printInNextLineObject( prefix: string, caller: interfaces.TCaller, key: string, obj: object ) {
        const mapped = LoggerBrowserInfra.useObjectMapper( obj ),
            callerName = this.getCallerName( caller );

        this.output.apply(
            this,
            [
                `%c(${ prefix })-> %c%c${ this.owner.getName() }%c::%c${ callerName }%c() ->> ${ key } %c↓`,
            ].concat( this.defaultStyle )
        );

        // print in next line
        this.output( mapped );
    }

    protected printMultiLineObject( prefix: string, caller: interfaces.TCaller, obj: { [ key: string ]: string | Function } ) {
        const callerName = this.getCallerName( caller );

        this.output.apply(
            this,
            [
                `%c(${ prefix })-> %c%c${ this.owner.getName() }%c::%c${ callerName }%c(${ Object.keys( obj )
                    .join( ", " ) }) %c↓`,
            ].concat( this.defaultStyle )
        );

        for ( let key in obj ) {
            let value = obj[ key ];

            if ( typeof value === "object" ) {
                const mapped = LoggerBrowserInfra.useObjectMapper( value );

                value = JSON.stringify( mapped, reduceCircularReferences() );
            } else if ( typeof obj[ key ] == "function" ) {
                value = this.getFunctionView( value );
            }

            this.output.apply( this, [
                "%c" + key + ": `" + value + "`",
                "color: #a3a3a3",
            ] );
        }
    }

    private getRandomColor(): string {
        const hex = "0123456789ABCDEF";
        let color = "#";

        for ( let i = 0 ; i < 6 ; i++ ) {
            color += hex[ Math.floor( Math.random() * 16 ) ];
        }

        let similar = LoggerBrowserInfra.colorsUsed.some( ( value ) => {
            // it returns the ratio of difference... closer to 1.0 is less difference.
            return getHexColorDelta( color, value ) >= 0.8;
        } );

        // if the color is similar, try again.
        if ( similar ) {
            return this.getRandomColor();
        }

        return color;
    }

    private getCallerName( caller: interfaces.TCaller ) {
        if ( "function" === typeof caller ) {
            return caller.prototype instanceof bases.ObjectBase ? "constructor" : caller.name;
        }

        throw new Error( "Invalid caller" );
    }

    private getFunctionView( fn: string | Function ): ( string | Function ) {
        let fReturn = UNKNOWN_CALLER_NAME;

        // TODO: Check if needed.
        if ( typeof fn !== "string" && fn.name.length !== 0 ) {
            fReturn = fn.name.split( " " )[ 1 ] + "()";
        }

        return fReturn;
    }
}

