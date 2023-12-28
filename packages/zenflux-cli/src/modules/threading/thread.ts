/// <reference types="@zenflux/typescript-vm/import-meta" />

import * as util from "node:util";
import * as process from "node:process";

import { parentPort, Worker, workerData } from "node:worker_threads";

import { fileURLToPath } from "node:url";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";

import { console } from "@zenflux/cli/src/modules/console";

function verbose( id: string, action: string, display: string, message: string ) {
    console.verbose( () => `Thread\t${ id }\t${ action }\t${ util.inspect( display ) }\t${ message }` );
}

export interface ThreadHost {
    name: string;
    id: number;
    display: string;
}

export class Thread {
    private state: "created" | "running" | "idle" | "terminated" | "killed" = "created";

    private worker: Worker;
    private errorCallback: Function | undefined;

    public constructor(
        private readonly name: string,
        private readonly id: number,
        private readonly display: string,
        private readonly work: Function,
        private readonly args: any[],
    ) {
        verbose( id.toString(), "Create", display,"" );

        this.worker = new Worker( zGlobalPathsGet().cli, {
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

        this.worker.on( "error", ( error ) => {
            if ( this.errorCallback ) {
                this.errorCallback( error );
            } else {
                console.error( error );
            }
        } );
    }

    public onError( callback: Function ) {
        this.errorCallback = callback;
    }

    public async run() {
        this.state = "running";
        this.worker.postMessage( "run" );

        return new Promise( ( resolve ) => {
            this.worker.once( "message", ( [ message, result ] ) => {
                switch ( message ) {
                    case "done":
                        this.state = "idle";
                        resolve( result );
                        break;

                    default:
                        throw new Error( `Unknown message: ${ message }` );
                }
            } );
        } );
    }

    public async terminate() {
        this.worker.postMessage( "terminate" );

        return new Promise( ( resolve ) => {
            this.worker.once( "exit", () => {
                this.state = "terminated";
                resolve( undefined );
            } );
        } );
    }

    public async kill() {
        return await this.worker.terminate().then( () => {
            this.state = "killed";
        } );
    }

    public isIdle() {
        return this.state === "idle";
    }
}

const workData = workerData;

if ( workData?.zCliWorkPath === fileURLToPath( import.meta.url ) ) {
    if ( null === parentPort ) {
        throw new Error( "Parent port is not defined" );
    }

    const parent = parentPort!;

    const { zCliWork, zCliWorkFunction, name, id, display } = workData;

    const work = ( await import( zCliWork ) )[ zCliWorkFunction ];

    const threadHost: ThreadHost = {
        name,
        id,
        display,
    };

    let isWorking = false,
        isRequestedToTerminate = false;

    function terminate() {
        process.exit( 0 );
    }

    parentPort.on( "message", ( message ) => {
        switch ( message ) {
            case "run":
                isWorking = true;
                const result = work.call( null, ... workData.args, threadHost );
                isWorking = false;

                if ( result instanceof Promise ) {
                    result.then( ( result ) => {
                        parent.postMessage( [ "done", result ] );
                    } );
                } else {
                    parent.postMessage( [ "done", result ] );
                }

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
