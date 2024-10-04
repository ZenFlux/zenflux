/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */

/// <reference types="@zenflux/typescript-vm/import-meta" />

import * as fs from "fs";
import * as process from "node:process";

import { fileURLToPath } from "node:url";
import * as util from "node:util";

import { parentPort, Worker as NodeWorker, workerData } from "node:worker_threads";

import * as path from "path";

import type { ThreadHost, TWorkerEvent, TWorkerState } from "@zenflux/worker/definitions";

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

    private debugName: string;

    public constructor(
        private readonly name: string,
        private readonly id: number,
        private readonly display: string,
        private readonly workFunction: Function,
        private readonly workPath: string,
        private readonly workArgs: any[],
    ) {
        this.debugName = `z-thread-${ this.name }-${ this.id }`;

        const runnerTarget = fileURLToPath( import.meta.url ),
            paths = [
                ... process.env.PATH!.split( path.delimiter ),
                process.env.PWD + "/node_modules/.bin",
            ],
            binPath = paths.find( ( p: string ) =>
                p.endsWith( "node_modules/.bin" ) && fs.existsSync( path.resolve( p, "@z-runner" ) )
            );

        if ( ! binPath ) {
            throw new Error( `'@z-runner' not found in PATHs: ${ util.inspect( paths ) }` );
        }

        const runnerPath = path.resolve( binPath, "@z-runner" );

        process.env.Z_RUN_TARGET = runnerTarget;

        const argv = [];

        if ( process.argv.includes( "--z-worker-vm-verbose" ) ) {
            argv.push( "--zvm-verbose" );
        }

        if ( process.argv.includes( "--z-worker-vm-memory-verbose" ) ) {
            argv.push( "--zvm-memory-verbose" );
            argv.push( "isolated" );
        }

        this.worker = new NodeWorker( runnerPath, {
            name: this.debugName,

            argv,

            // Required by `@z-runner`
            execArgv: [
                "--no-warnings",
                "--experimental-vm-modules",
                "--experimental-import-meta-resolve",
            ],

            workerData: {
                debugName: this.debugName,

                zCliRunPath: runnerTarget,
                zCliWorkPath: this.workPath,
                zCliWorkFunction: workFunction.name,

                name: this.name,
                id: this.id,
                display: this.display,

                args: this.workArgs
            }
        } );

        globalThis.zWorkersCount++;

        this.worker.on( "exit", () => {
            globalThis.zWorkersCount--;

            if ( this.state !== "killed" ) {
                this.state = "terminated";
            }
        } );

        this.worker.on( "message", ( [ type, ... args ]: any [] ) => {
            if ( this.eventCallbacks.has( type ) ) {
                if ( [ "verbose", "debug" ].includes( type ) ) {
                    this.eventCallbacks.get( type )!.forEach( c => c.call( null, () => args ) );
                } else {
                    this.eventCallbacks.get( type )!.forEach( c => c.call( null, ... args ) );
                }

            } else if ( type === "internal-error" ) {
                // Bypass.
            } else if ( "done" !== type ) {
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

                    this.worker.off( "message", onMessageCallback );

                    resolve( args[ 0 ] );
                } else if ( message === "internal-error" ) {
                    this.state = "error";
                    this.worker.off( "message", onMessageCallback );

                    reject( args[ 0 ] );
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

interface ZCreateWorkerArguments {
    name: string;
    id?: number;
    display?: string;
    workFunction: Function;
    workFilePath?: string;
    workArgs?: any[]
}

export const zCreateWorker: ( args: ZCreateWorkerArguments ) => Worker = ( {
   name,
   id = zWorkerGetCount(),
   display = name,
   workFunction,
   workFilePath = import.meta.refererUrl ? fileURLToPath( import.meta.refererUrl ) : undefined,
   workArgs = []
} ) => {
    let isExist = false;

    try {
        isExist = workFilePath && fs.existsSync( workFilePath );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch ( e ) {
    }

    if ( ! isExist ) {
        throw new Error( `File not found: ${ workFilePath }` );
    }

    return new Worker( name, id, display, workFunction, workFilePath, workArgs );
};
