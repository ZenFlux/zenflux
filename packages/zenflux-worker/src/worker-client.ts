/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */

/// <reference types="@zenflux/typescript-vm/import-meta" />
import * as process from "node:process";

import { fileURLToPath } from "node:url";
import * as util from "node:util";

import { parentPort, workerData } from "node:worker_threads";

import type { ThreadHost } from "@zenflux/worker/definitions";

const workData = workerData;

if ( workData?.zCliRunPath === fileURLToPath( import.meta.url ) ) {

    if ( null === parentPort ) {
        throw new Error( "Parent port is not defined" );
    }

    const parent = parentPort!;

    const { zCliWorkPath, zCliWorkFunction, name, id, display, debugName } = workData;

    const workModule = ( await import( zCliWorkPath ) );

    if ( ! workModule[ zCliWorkFunction ] ) {
        throw new Error( `Function ${ util.inspect( zCliWorkFunction ) } ` +
            `not found in ${ util.inspect( zCliWorkPath ) } ` +
            `thread ${ util.inspect( name ) }: ${ util.inspect( id ) }`
        );
    }

    const workFunction = workModule[ zCliWorkFunction ];

    const threadHost: ThreadHost = {
        name,
        id,
        display,

        sendMessage( type: string, ... args: any[] ) {
            // Serialize args and avoid circular references
            // TODO: Duplicate code
            const reduceCircularReferences = () => {
                const seen = new WeakSet();

                return ( key: any, value: any ) => {
                    if ( typeof value === "object" && value !== null ) {
                        if ( seen.has( value ) ) {
                            return;
                        }
                        seen.add( value );
                    }
                    return value;
                };
            };

            args = JSON.parse( JSON.stringify( args, reduceCircularReferences() ) );

            parent.postMessage( [ type, ... args ] );
        },

        sendLog( ... args: any[] ) {
            this.sendMessage( "log", ... args );
        },

        sendWarn( ... args: any[] ) {
            this.sendMessage( "warn", ... args );
        },

        sendInfo( ... args: any[] ) {
            this.sendMessage( "info", ... args );
        },

        sendVerbose( ... args: any[] ) {
            this.sendMessage( "verbose", ... args );
        },

        sendDebug( ... args: any[] ) {
            this.sendMessage( "debug", ... args );
        },
    };

    let isWorking = false,
        isRequestedToTerminate = false;

    const terminate = () => {
        process.exit( 0 );
    };

    const work = () => {
        isWorking = true;

        return workFunction.call( null, ... workData.args, threadHost );
    };

    const done = ( result: any ) => {
        isWorking = false;

        threadHost.sendMessage( "done", result );
    };

    const debugMemoryUsage = ( prefix: string ) => {
        let output = debugName + ": ";
        for ( const [ key, value ] of Object.entries( process.memoryUsage() ) ) {
            output += ( `By ${ key } -> ${ Math.round( value / 1024 / 1024 * 100 ) / 100 } MB, ` );
        }
        threadHost.sendDebug( "Memory usage", prefix, output );
    };

    parentPort.on( "message", ( message ) => {
        switch ( message ) {
            case "run":
                debugMemoryUsage( "Before work" );

                const result = work();

                if ( result && Object.prototype.toString.call( result ) === "[object Promise]" ) {
                    result
                        .then( done )
                        .catch( ( error ) => {
                            parentPort?.postMessage( [ "internal-error", {
                                name: error.name,
                                message: error.message,
                                code: error.code,
                                stack: error.stack
                            } ] );
                        } );
                } else {
                    done( result );
                }

                debugMemoryUsage( "After work" );

                isRequestedToTerminate && terminate();

                break;

            case "terminate":
                if ( isWorking ) {
                    isRequestedToTerminate = true;
                } else {
                    terminate();
                }

                break;

            default:
                throw new Error( `Unknown message: ${ message }` );
        }
    } );
}

