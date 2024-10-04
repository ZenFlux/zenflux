/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import process from "node:process";

import { fileURLToPath } from "node:url";

import util from "node:util";
import path from "node:path";

import { Worker as NodeWorker } from "worker_threads";

import type { TWorkerEvent, TWorkerState } from "@zenflux/worker/definitions";

export class WorkerServer {
    private worker: NodeWorker;

    private state: TWorkerState = "created";
    private stateReason: string | undefined;

    private eventCallbacks = new Map<TWorkerEvent, Function[]>();

    private readonly debugName: string;

    public constructor(
        private readonly name: string,
        private readonly id: number,
        private readonly display: string,
        private readonly workFunction: Function,
        private readonly workPath: string,
        private readonly workArgs: any[],
    ) {
        this.debugName = `z-thread-${ this.name }-${ this.id }`;

        const runnerTarget = path.dirname( fileURLToPath( import.meta.url ) ) + "/worker-client.ts",
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
