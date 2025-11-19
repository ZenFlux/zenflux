/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import * as path from "path";
import { createRequire } from "node:module";

import { Worker as NodeWorker } from "node:worker_threads";

import util from "node:util";

import process from "node:process";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { zCreateResolvablePromise } from "@zenflux/utils/promise";

import type {
    DMessageInterface,
    DWorkerEvent,
    DWorkerState,
    DWorkerTaskWithWorkPath
} from "@zenflux/worker/definitions";

const requireModule = createRequire( import.meta.url );

const workerIds = new Map<string, boolean>();

const DEFAULT_WORKER_CLIENT = "worker-client.ts";

export class WorkerServer {
    private worker: NodeWorker;

    private state: DWorkerState = "none";

    private createPromise: ReturnType<typeof zCreateResolvablePromise>;
    private runPromise: ReturnType<typeof zCreateResolvablePromise>;
    private exitPromise: ReturnType<typeof zCreateResolvablePromise>;
    private taskPromises: Map<string, ReturnType<typeof zCreateResolvablePromise>> = new Map();

    private error: Error | undefined;

    private exitCode: number | undefined;

    private killReason: string | undefined;

    private eventCallbacks = new Map<DWorkerEvent, Function[]>();

    private readonly debugName: string;

    public constructor(
        private readonly name: string,
        private readonly id: string,
        private readonly display: string,
        private readonly workFunction: Function,
        private readonly workPath: string,
        private readonly workArgs: any[],
    ) {
        // Ensure worker id is unique
        if ( workerIds.has( id ) ) {
            throw new Error( `Worker with id '${ id }' is already in use` );
        }

        workerIds.set( id, true );

        this.debugName = `z-thread-${ this.name }-${ this.id }`;

        this.createPromise = zCreateResolvablePromise( "z-worker-create", false );
        this.exitPromise = zCreateResolvablePromise( "z-worker-exit", false );
        this.runPromise = zCreateResolvablePromise( "z-worker-run", false );
    }

    public async initialize() {
        const runnerTarget = path.join( path.dirname( fileURLToPath( import.meta.url ) ), DEFAULT_WORKER_CLIENT );

        const runnerPath = this.resolveRunnerPath();

        process.env.Z_RUN_TARGET = runnerTarget;

        if ( ! process.env.Z_RUN_TSCONFIG_PATH ) {
            const workspaceTsConfig = path.resolve( process.cwd(), "tsconfig.json" );

            if ( fs.existsSync( workspaceTsConfig ) ) {
                process.env.Z_RUN_TSCONFIG_PATH = workspaceTsConfig;
            }
        }

        const argv = [];

        // TODO: Find better solution
        if ( process.argv.includes( "--z-worker-vm-verbose" ) ) {
            argv.push( "--zvm-verbose" );
        }
        if ( process.argv.includes( "--verbose" ) ) {
            argv.push( "--verbose" );
        }
        if ( process.argv.includes( "--debug" ) ) {
            argv.push( "--debug" );
        }
        if ( process.argv.includes( "--z-worker-vm-memory-verbose" ) ) {
            argv.push( "--zvm-memory-verbose" );
            argv.push( "isolated" );
        }

        argv.push( "--z-worker-display-id-in-args=" + this.id );

        globalThis.zWorkersCount++;

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
                zCliWorkFunction: typeof this.workFunction === "string" ? this.workFunction : this.workFunction.name,

                name: this.name,
                id: this.id,
                display: this.display,

                args: this.workArgs
            }
        } );

        this.worker.on( "exit", this.exitInternal.bind( this ) );
        this.worker.on( "error", this.errorInternal.bind( this ) );
        this.worker.on( "message",
            ( message ) => this.messageInternal( JSON.parse( message ) )
        );

        process.on( "SIGINT", async () => {
            if ( this.isKilled() ) {
                return;
            }

            await this.kill( "SIGINT" );
        } );

        process.on( "beforeExit", () => {
            if ( this.isKilled() ) {
                return;
            }

            this.kill( "beforeExit" );
        } );

        return this.createPromise.await;
    }

    private resolveRunnerPath() {
        try {
            return requireModule.resolve( "@zenflux/runner/src/index.js" );
        } catch {
            const paths = [
                ... ( process.env.PATH ? process.env.PATH.split( path.delimiter ) : [] ),
                process.env.PWD ? path.join( process.env.PWD, "node_modules/.bin" ) : undefined,
            ].filter( Boolean ) as string[];

            const binPath = paths.find( ( p: string ) =>
                p.endsWith( "node_modules/.bin" ) && fs.existsSync( path.resolve( p, "@z-runner" ) )
            );

            if ( ! binPath ) {
                throw new Error( `'@z-runner' not found in PATHs: ${ util.inspect( paths ) }` );
            }

            return path.resolve( binPath, "@z-runner" );
        }
    }

    protected errorInternal( error: Error ) {
        this.error = error;
        this.state = "error";
    }

    protected exitInternal( code: number ) {
        this.exitCode = code;

        if ( this.isAlive() ) {
            workerIds.set( this.id, false );
            globalThis.zWorkersCount--;
        }

        if ( this.state !== "dead" ) {
            this.state = "terminated";
        }

        if ( this.createPromise.isPending ) {
            const error = this.error || new Error( "Worker exited with code: " + code );
            this.createPromise.reject( error );
        } else if ( this.runPromise.isPending ) {
            this.runPromise.reject( this.error || new Error( "Worker exited with code: " + code ) );
        }

        if ( this.exitPromise.isPending ) {
            this.exitPromise.resolve( code );
        } else {
            ConsoleManager.$.log( this.exitInternal.name, `Worker ${ this.id } exited with code: ${ code }, error: ${ this.error?.stack ?? "none" }` );
        }
    }

    protected messageInternal( message: DMessageInterface ) {
        const { type, args = [] } = message;

        if ( this.eventCallbacks.has( type ) ) {
            if ( [ "verbose", "debug" ].includes( type ) ) {
                this.eventCallbacks.get( type )!.forEach( c => c.call( null, () => args ) );
            } else {
                this.eventCallbacks.get( type )!.forEach( c => c.call( null, ... args ) );
            }

            return;
        }

        switch ( type ) {
            case "internal-error": {
                let error: any = Object.assign( {}, message );

                error = Object.assign( new Error( error.message, {
                    cause: error.cause,
                } ), error );

                this.errorInternal( error );

                // Reject the runPromise so the error is propagated to the calling code
                this.runPromise.reject( error );

                break;
            }

            case "started": {
                this.state = "created";

                this.createPromise.resolve();

                break;
            }

            case "task-completed": {
                const { __uniqueId } = message.task;

                const taskPromise = this.taskPromises.get( __uniqueId );

                if ( taskPromise ) {
                    taskPromise.resolve();

                    this.taskPromises.delete( __uniqueId );
                }

                break;
            }

            case "done": {
                this.state = "idle";

                this.runPromise.resolve( "done" );

                break;
            }

            default: {
                this.errorInternal( new Error( `Unhandled message: '${ type }', at worker: '${ this.name + ":" + this.id }'` ) );
            }
        }
    }

    protected sendMessage( message: DMessageInterface ) {
        function ensureRawObject( this: Worker, obj: any ) {
            if ( typeof obj === "function" || ( obj && typeof obj === "function" && /^class\s/.test( Function.prototype.toString.call( obj ) ) ) ) {
                throw new Error( `Live objects (function, class) detected.\n   at worker: '${ this.name + ":" + this.id }'\n   at object: ${ util.inspect( obj, { colors: false } ) }` );
            }

            if ( obj && typeof obj === "object" ) {
                for ( const key in obj ) {
                    if ( obj[ key ] ) ensureRawObject.call( this, obj[ key ] );
                }
            }
        }

        ensureRawObject.call( this, message );

        return this.worker.postMessage( JSON.stringify( message ) );
    }

    public on( event: DWorkerEvent, callback: Function ) {
        if ( ! this.eventCallbacks.has( event ) ) {
            this.eventCallbacks.set( event, [] );
        }

        this.eventCallbacks.get( event )!.push( callback );
    }

    public async run() {
        this.killReason = undefined;

        if ( this.runPromise.isFulfilled ) {
            this.runPromise = zCreateResolvablePromise( "z-worker-run-recreated", false );
        }

        if ( "skip-run" === this.state ) {
            this.state = "idle";

            // Skipped
            return;
        } else if ( "running" == this.state ) {
            throw new Error( "Thread is already running" );
        }

        this.state = "running";
        this.sendMessage( { type: "run" } );

        try {
            await this.createPromise.await;
            await this.runPromise.await;
        } catch ( e ) {
            if ( this.isKilled() ) {
                throw new Error( this.killReason || "Thread was killed" );
            }

            throw e;
        }
    }

    public addTask( task: DWorkerTaskWithWorkPath ) {
        if ( "function" === typeof task.workFunction ) {
            task.workFunction = task.workFunction.name;
        }

        // Return unique task id;
        const uniqueId = `${ task.workFunction }:${ task.workArgs.join( "," ) }:${ new Date().getTime() + Math.random() }`;

        task.__uniqueId = uniqueId;

        this.taskPromises.set(
            uniqueId,
            zCreateResolvablePromise( "z-worker-task-promise" + uniqueId, false )
        );

        this.sendMessage( {
            type: "add-task",
            task,
        } );

        return uniqueId;
    }

    public skipNextRun() {
        this.state = "skip-run";
    }

    public async waitForDone() {
        return await this.runPromise.await;
    }

    public async waitForTaskComplete( uniqueTaskId: string ) {
        const taskPromise = this.taskPromises.get( uniqueTaskId );

        if( ! taskPromise ) {
            throw new Error( `Task with id '${ uniqueTaskId }' not found` );
        }

        return await taskPromise.await;
    }

    public terminate() {
        this.worker.postMessage( "terminate" );

        return new Promise( ( resolve ) => {
            this.exitPromise.await.finally( () => resolve( this.exitCode ) );
        } );
    }

    public async kill( reason?: string ) {
        this.state = "kill-request";
        this.killReason = reason;

        return await this.worker.terminate().then( () => {
            this.state = "dead";

            this.exitInternal( 0 );
        } );
    }

    public getId() {
        return this.id;
    }

    public getState() {
        return this.state;
    }

    public getExitCode() {
        return this.exitCode;
    }

    public isIdle() {
        return this.state === "idle";
    }

    public isAlive() {
        return this.state !== "error" && this.state !== "terminated" && ! this.isKilled();
    }

    public isKilled() {
        return this.state === "dead" || this.state === "kill-request";
    }

    public async awaitRunning() {
        await this.runPromise.finally( this.awaitRunning.name, () => {} );
    }
}
