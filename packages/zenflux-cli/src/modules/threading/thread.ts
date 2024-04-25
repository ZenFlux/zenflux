/// <reference types="@zenflux/typescript-vm/import-meta" />

import * as util from "node:util";
import * as process from "node:process";

import { fileURLToPath } from "node:url";

import { parentPort, Worker, workerData } from "node:worker_threads";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";

export interface ThreadHost {
    name: string;
    id: number;
    display: string;

    sendMessage( type: string, ... args: any[] ): void;
}

export class Thread {
    private state: "created" | "running" | "idle" | "terminated" | "killed" = "created";

    private worker: Worker;
    private errorCallbacks: Function[] | undefined;
    private messageCallbacks: Function[] | undefined;
    private verboseCallbacks: Function[] | undefined;
    private debugCallbacks: Function[] | undefined;

    public constructor(
        private readonly name: string,
        private readonly id: number,
        private readonly display: string,
        private readonly work: Function,
        private readonly args: any[],
    ) {
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
            if ( this.errorCallbacks ) {
                this.errorCallbacks.forEach( c => c.call( null, ... [ this.id, error ] ) );
            } else {
                throw error;
            }
        } );

        this.worker.on( "message", ( [ message, ... args ]: any [] ) => {
            switch ( message ) {
                case "message":
                    if ( this.messageCallbacks ) {
                        this.messageCallbacks.forEach( c => c.call( null, ... [ this.id, ... args ] ) );
                    } else {
                        throw new Error( `Unhandled message: ${ message }` );
                    }
                    break;

                case "error":
                    if ( this.errorCallbacks ) {
                        this.errorCallbacks.forEach( c => c.call( null, ... [ this.id, ... args ] ) );
                    } else {
                        throw new Error( `Unhandled error: ${ message }` );
                    }
                    break;

                case "verbose":
                    if ( this.verboseCallbacks ) {
                        this.verboseCallbacks.forEach( c => c.call( null, () => [ this.id, ... args ] ) );
                    } else {
                        throw new Error( `Unhandled verbose: ${ message }` );
                    }
                    break;

                case "debug":
                    if ( this.debugCallbacks ) {
                        this.debugCallbacks.forEach( c => c.call( null, () => [ this.id, ... args ] ) );
                    } else {
                        throw new Error( `Unhandled debug: ${ message }` );
                    }
                    break;
            }
        } );
    }

    public onError( callback: Function ) {
        if ( ! this.errorCallbacks ) {
            this.errorCallbacks = [];
        }

        this.errorCallbacks.push( callback );
    }

    public onMessage( callback: Function ) {
        if ( ! this.messageCallbacks ) {
            this.messageCallbacks = [];
        }

        this.messageCallbacks.push( callback );
    }

    public onVerbose( callback: Function ) {
        if ( ! this.verboseCallbacks ) {
            this.verboseCallbacks = [];
        }

        this.verboseCallbacks.push( callback );
    }

    public onDebug( callback: Function ) {
        if ( ! this.debugCallbacks ) {
            this.debugCallbacks = [];
        }

        this.debugCallbacks.push( callback );
    }

    public async run() {
        this.state = "running";
        this.worker.postMessage( "run" );

        return new Promise( ( resolve ) => {
            const onMessageCallback = ( [ message, ... args ]: any [] ) => {
                if ( message === "done" ) {
                    this.state = "idle";

                    resolve( args[ 0 ] );

                    this.worker.off( "message", onMessageCallback );
                }
            };

            this.worker.on( "message", onMessageCallback );
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
            parent.postMessage( [ type, ... args ] );
        }
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
                const result = workFunction.call( null, ... workData.args, threadHost );
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
