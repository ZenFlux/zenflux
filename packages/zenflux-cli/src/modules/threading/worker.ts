/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */

/// <reference types="@zenflux/typescript-vm/import-meta" />

import * as process from "node:process";

import { fileURLToPath } from "node:url";
import * as util from "node:util";

import { parentPort, Worker as NodeWorker, workerData } from "node:worker_threads";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";

import type { ThreadHost, TWorkerEvent, TWorkerState } from "@zenflux/cli/src/modules/threading/definitions";

declare module globalThis {
    var zWorkersCount: number;
}

if ( ! globalThis.zWorkersCount ) {
    globalThis.zWorkersCount = 0;
}

export function zWorkerGetCount() {
    return globalThis.zWorkersCount;
}

export class Worker {
    private worker: NodeWorker;

    private state: TWorkerState = "created";
    private stateReason: string | undefined;

    private eventCallbacks = new Map<TWorkerEvent, Function[]>();

    public constructor(
        private readonly name: string,
        private readonly id: number,
        private readonly display: string,
        private readonly work: Function,
        private readonly args: any[],
    ) {
        this.worker = new NodeWorker( zGlobalPathsGet().cli, {
            name: `z-thread-${ this.name }-${ this.id }`,

            argv: process.argv,

            workerData: {
                zCliWorkPath: fileURLToPath( import.meta.url ),
                zCliWork: fileURLToPath( import.meta.refererUrl ),
                zCliWorkFunction: work.name,

                name: this.name,
                id: this.id,
                display: this.display,

                args: this.args
            }
        } );

        globalThis.zWorkersCount++;

        this.worker.on( "exit", () => {
            globalThis.zWorkersCount--;
        } );

        this.worker.on( "message", ( [ type, ... args ]: any [] ) => {
            if ( this.eventCallbacks.has( type ) ) {
                if ( [ "verbose", "debug" ].includes( type ) ) {
                    this.eventCallbacks.get( type )!.forEach( c => c.call( null, () => args  ) );
                } else {
                    this.eventCallbacks.get( type )!.forEach( c => c.call( null, ... args ) );
                }

            } else if( "done" !== type ) {
                throw new Error( `Unhandled message: '${ type }', at worker: '${ this.name + ":" + this.id }'` );
            }
        } );
    }

    public getId() {
        return this.id;
    }

    public on( event: TWorkerEvent, callback: Function ) {
        if ( ! this.eventCallbacks.has( event ) ) {
            this.eventCallbacks.set( event, [] );
        }

        this.eventCallbacks.get( event )!.push( callback );
    }

    public run() {
        this.stateReason = undefined;

        if ( this.state === "skip-run" ) {
            this.state = "idle";

            return Promise.resolve( "skipped" );
        }

        return new Promise( ( resolve, reject ) => {
            const onMessageCallback = ( [ message, ... args ]: any [] ) => {
                if ( message === "done" ) {
                    this.state = "idle";

                    resolve( args[ 0 ] );

                    this.worker.off( "message", onMessageCallback );
                }
            };

            this.worker.on( "message", onMessageCallback );

            this.worker.once( "error", ( error ) => {
                this.state = "error";

                reject( error );
            } );

            this.worker.once( "exit", () => {
                if ( this.isKilled() ) {
                    reject( new Error( this.stateReason || "Thread was killed" ) );
                }
            } );

            this.state = "running";
            this.worker.postMessage( "run" );
        } );
    }

    public skipNextRun() {
        this.state = "skip-run";
    }

    public waitForDone() {
        // Wait for run "done" message
        return new Promise( ( resolve, reject ) => {
            const onMessageCallback = ( [ message, ... _args ]: any [] ) => {
                if ( message === "done" ) {
                    this.worker.off( "message", onMessageCallback );

                    resolve( true );
                }
            };

            this.worker.once( "exit", reject );
            this.worker.once( "error", reject );

            this.worker.on( "message", onMessageCallback );
        } );
    }

    public terminate() {
        this.worker.postMessage( "terminate" );

        return new Promise( ( resolve ) => {
            this.worker.once( "exit", () => {
                this.state = "terminated";
                resolve( undefined );
            } );
        } );
    }

    public async kill( reason?: string ) {
        this.state = "kill-request";
        this.stateReason = reason;

        return await this.worker.terminate().then( () => {
            this.state = "killed";
        } );
    }

    public isIdle() {
        return this.state === "idle";
    }

    public isAlive() {
        return this.state !== "error" && this.state !== "terminated" && ! this.isKilled();
    }

    public isKilled() {
        return this.state === "killed" || this.state === "kill-request";
    }
}

const workData = workerData;

if ( workData?.zCliWorkPath === fileURLToPath( import.meta.url ) ) {

    if ( null === parentPort ) {
        throw new Error( "Parent port is not defined" );
    }

    const parent = parentPort!;

    const { zCliWork, zCliWorkFunction, name, id, display } = workData;

    const workModule = ( await import( zCliWork ) );

    if ( ! workModule[ zCliWorkFunction ] ) {
        throw new Error( `Function ${ util.inspect( zCliWorkFunction ) } ` +
            `not found in ${ util.inspect( zCliWork ) } ` +
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

    parentPort.on( "message", ( message ) => {
        switch ( message ) {
            case "run":
                const result = work();

                result instanceof Promise ? result.then( done ) : done( result );

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
