/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Module for logging instances.
 * @TODO:
 *  - Remove `@ts-ignore`, requires a refactor.
 *  - Add dark/light mode.
 */

import { LoggerBrowserInfra } from "@zenflux/logging/src/modules/logger-browser-infra";

import { reduceCircularReferences } from "@zenflux/logging/src/utils";

import type { interfaces } from "@zenflux/core";

export class Logger extends LoggerBrowserInfra implements interfaces.ILogger {
    public static getName() {
        return "ZenFlux/Logging/Modules/Logger";
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public log( caller: interfaces.TCaller, message: string, ... params: any[] ): void {
        this.printFunctionNotify( "lg", caller, message );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public warn( caller: interfaces.TCaller, message: string, ... params: any[] ): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public error( caller: interfaces.TCaller, message: string, ... params: any[] ): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public info( caller: interfaces.TCaller, message: string, ... params: any[] ): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public debug( caller: interfaces.TCaller, message: string,  ... params: any[] ): void {
        this.printFunctionNotify( "db", caller, message );
    }

    public startsEmpty( caller: interfaces.TCaller ) {
        this.printFunctionNotify( "▶", caller, "", );
    }

    public startsWith( caller: interfaces.TCaller, params: string|object ) {
        this.printObjectEfficient( "▶", caller, params );
    }

    public dump( caller: interfaces.TCaller, params: { [ key: string ]: object|string } = {}, notice = "" ) {
        for ( let key in params ) {
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
        for ( let key in according ) {
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

    public clone() {
        return Object.assign( Object.create( Object.getPrototypeOf( this ) ), this );
    }
}

export default Logger;
