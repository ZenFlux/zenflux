/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */

/// <reference types="@zenflux/typescript-vm/import-meta" />

import * as process from "node:process";

import * as util from "node:util";

import { parentPort, workerData } from "node:worker_threads";

import type {
    DMessageInterface,
    DThreadHostInterface,
    DWorkerEvent,
    DWorkerTaskWithWorkPath
} from "@zenflux/worker/definitions";

const debugActual = util.debug( "WORKER" );

const debug = ( ... args: any[] ) => {
    debugActual( `[${ workerData.id }] (${ process.env.npm_package_name }~v${ process.env.npm_package_version }) `, ... args );
};

debug( "Worker starting with `zCliWorkPath`:", workerData?.zCliWorkPath );

const tasks: DWorkerTaskWithWorkPath[] = [];

const workModules: { [ key: string ]: any } = {};

async function getWorkFunction( workPath: string, workFunction: string ) {
    if ( workModules[ workPath ] ) {
        return workModules[ workPath ][ workFunction ];
    }

    const workModule = ( await import( workPath ) );

    if ( ! workModule[ workFunction ] ) {
        throw new Error( `Function ${ util.inspect( workFunction ) } ` +
            `not found in ${ util.inspect( workPath ) } ` +
            `thread ${ util.inspect( name ) }: ${ util.inspect( id ) }`
        );
    }

    workModules[ workPath ] = workModule;

    return workModule[ workFunction ];
};

function addTask( task: DWorkerTaskWithWorkPath ) {
    return tasks.push( task );
}

function getTask() {
    const task = tasks.shift();

    return task ?? null;
}

function sendMessage( message: DMessageInterface ) {
    parentPort?.postMessage( JSON.stringify( message ) );
}

if ( null === parentPort ) {
    throw new Error( "Parent port is not defined" );
}

sendMessage( { type: "started" } );

const { name, id, display, zCliWorkPath, zCliWorkFunction, debugName } = workerData;

addTask( {
    workFilePath: zCliWorkPath,
    workFunction: await getWorkFunction( zCliWorkPath, zCliWorkFunction ),
    workArgs: workerData.args,
} );

const threadHost: DThreadHostInterface = {
    name,
    id,
    display,

    sendMessage( type: DWorkerEvent, ... args: any[] ) {
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

        sendMessage( {
            type,
            args,
        } );
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

let isWorking = false;

let isRequestedToTerminate = false;

const terminate = () => {
    isWorking = false;
    process.exit( 0 );
};

const work = async () => {
    const task = getTask();

    if ( ! task ) {
        return;
    }

    isWorking = true;

    if ( ! ( "function" === typeof task.workFunction ) ) {
        task.workFunction = await getWorkFunction( task.workFilePath, task.workFunction as string );
    }

    const result = await ( task.workFunction as Function ).call( null, ... task.workArgs, threadHost );

    sendMessage( {
        type: "task-completed",
        task
    } );

    return result;
};

const done = ( result: any ) => {
    isWorking = false;

    // TODO: Check it out
    sendMessage( {
        type: "done",
        result
    } );
};

const debugMemoryUsage = ( prefix: string ) => {
    let output = debugName + ": ";
    for ( const [ key, value ] of Object.entries( process.memoryUsage() ) ) {
        output += ( `By ${ key } -> ${ Math.round( value / 1024 / 1024 * 100 ) / 100 } MB, ` );
    }
    threadHost.sendDebug( "Memory usage", prefix, output );
};

parentPort.on( "message", async ( raw ) => {
    const message: DMessageInterface = JSON.parse( raw );

    const { type } = message;

    switch ( type ) {
        case "run":
            debugMemoryUsage( "Before work" );

            const promise = work();

            let result = null;

            try {
                result = await promise;

            } catch ( error ) {
                sendMessage( {
                    type: "internal-error",
                    name: error.name,
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                } );
            }

            debugMemoryUsage( "After work" );

            done( result );

            isRequestedToTerminate && terminate();

            break;

        case "add-task":
            const task: DWorkerTaskWithWorkPath = message.task;

            if ( ! task.workFunction || ! task.workFilePath ) {
                const error = new Error( "Task must have workFunction or workFilePath" );

                sendMessage( {
                    type: "internal-error",
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } );

                terminate();

                return;
            }

            addTask( {
                workFilePath: task.workFilePath,
                workFunction: task.workFunction as string,
                workArgs: ( task.workArgs ?? [] ),
                __uniqueId: task.__uniqueId,
            } );

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
