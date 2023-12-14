/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import path from "node:path";
import process from "node:process";

import { fileURLToPath, pathToFileURL } from "node:url";

import { parentPort, Worker, workerData } from "node:worker_threads";

import { rollup } from "rollup";

import { zRollupGetPlugins } from "@zenflux/cli/src/core/rollup";

import { console } from "@zenflux/cli/src/modules/console";

import type { OutputOptions, RollupOptions } from "rollup";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";
import type { TZBuildOptions } from "@zenflux/cli/src/definitions/build";

const workers = new Map<number, Worker>();

async function rollupBuildInternal( config: RollupOptions, options: TZBuildOptions ) {
    const output = config.output as OutputOptions;

    if ( ! output ) {
        throw new Error( "Rollup output not found." );
    }

    config.onLog = ( logLevel, message ) => {
        // @ts-ignore
        message.projectPath = options.config.path;
        console.log( `Rollup: ${ util.inspect( message ) }` );
    };

    const bundle = await rollup( config ),
        startTime = Date.now(),
        file = output.file ?? output.entryFileNames;

    options.silent || console.log( `Writing - Start ${ util.inspect( output.format ) } bundle to ${ util.inspect( file ) }` );

    await bundle.write( output );

    options.silent || console.log( `Writing - Done ${ util.inspect( output.format ) } bundle of ${ util.inspect( file ) } in ${ util.inspect( Date.now() - startTime ) + "ms" }` );

    options.config.onBuiltFormat?.( output.format as TZFormatType );
}

function zRollupBuildInWorker() {
    if ( ! workerData.options.thread && 0 !== workerData.options.thread ) {
        throw new Error( "Thread options not found." );
    }

    const id = workerData.options.thread,
        rollupOptions: RollupOptions[] = ! Array.isArray( workerData.rollupOptions ) ? [ workerData.rollupOptions ] : workerData.rollupOptions,
        buildOptions = workerData.options as TZBuildOptions,
        config = buildOptions.config;

    const linkedRollupOptions = rollupOptions.map( ( rollupOptions ) => {
        const output = rollupOptions.output as OutputOptions;

        rollupOptions.plugins = zRollupGetPlugins( {
                extensions: config.extensions || [],
                format: output.format!,
                moduleForwarding: config.moduleForwarding,
                sourcemap: !! output.sourcemap,
                minify: "development" !== process.env.NODE_ENV,
                projectPath: path.dirname( config.path )
            },
        );

        return rollupOptions;
    } );

    // Waiting for the parent to send a message.
    parentPort?.on( "message", async ( message ) => {
        switch ( message ) {
            case "run":
                const buildRequest = async () => {
                    console.verbose( () => `Thread\t${ id }\tRun\t${ util.inspect( config.outputName ) }` );

                    return Promise.all( linkedRollupOptions.map( async ( singleRollupOptions ) => {
                        const output = singleRollupOptions.output as OutputOptions;

                        console.log( `Thread\t${ id }\tBuild\t${ util.inspect( config.outputName ) } format ${ util.inspect( output.format ) } bundle to ${ util.inspect( output.file ?? output.entryFileNames ) }` );

                        try {
                            await rollupBuildInternal( singleRollupOptions, workerData.options );
                        } catch ( error ) {
                            parentPort?.postMessage( {
                                __ERROR_WORKER_INTERNAL__: true,
                                error: {
                                    ... JSON.parse( JSON.stringify( error ) ),
                                    message: (error as Error).message,
                                    stack: (error as Error).stack
                                },
                                config: config.path
                            } );
                        }

                        console.verbose( () => `Thread\t${ id }\tReady\t${ util.inspect( config.outputName ) } format ${ util.inspect( output.format ) } bundle of ${ util.inspect( output.file ?? output.entryFileNames ) }` );
                    } ) );
                };

                await buildRequest();

                console.verbose( () => `Thread\t${ id }\tDone\t${ util.inspect( config.outputName ) }` );

                // Ensuring that console.log is flushed.
                setTimeout( () => {
                    parentPort?.postMessage( "done" );
                } );

                break;

            default:
                throw new Error( `Unknown message: ${ message }` );
        }
    } );
}

async function zRollupCreateBuildWorker( rollupOptions: RollupOptions[], options: TZBuildOptions ) {
    // Since worker do not need to load it, it can't be in top level.
    const { zGlobalPathsGet } = ( await import( "@zenflux/cli/src/core/global" ) );

    // Plugins cannot be transferred to worker threads, since they are "live" objects/function etc...
    rollupOptions.forEach( ( o ) => {
        delete o.plugins;
    } );

    // Await for the worker to finish.
    return new Promise( ( resolve ) => {
        // Run zenflux `tsnode-vm` in the worker thread.
        if ( ! workers.has( options.thread as number ) ) {
            console.verbose( () => `Thread\t${ options.thread }\tStart\t${ util.inspect( options.config.outputName ) }` );

            const worker = new Worker( pathToFileURL( zGlobalPathsGet().cli ), {
                argv: process.argv,
                workerData: {
                    zCliWorkPath: fileURLToPath( import.meta.url ),

                    rollupOptions: rollupOptions,

                    options
                },
            } );

            workers.set( options.thread as number, worker );
        }

        const worker = workers.get( options.thread as number ) as Worker;

        worker.once( "message", ( message ) => {
            switch ( message ) {
                case "done":
                    // Kill the worker.
                    worker.terminate();

                    resolve( undefined );
                    break;

                default:
                    if ( message.__ERROR_WORKER_INTERNAL__ ) {
                        const { error } = message;

                        error.cause = message.config;

                        console.error( "\n" + util.inspect( error ) );
                        process.exit( 1 );
                    }

                    throw new Error( `Unknown message: ${ message }` );
            }
        } );

        worker.postMessage( "run" );
    } );
}

export async function zRollupBuild( rollupOptions: RollupOptions[] | RollupOptions, options: TZBuildOptions ) {
    if ( ! Array.isArray( rollupOptions ) ) {
        rollupOptions = [ rollupOptions ];
    }

    let buildPromise;

    if ( ! options.thread && 0 !== options.thread ) {
        // No threads.
        buildPromise = Promise.all(
            rollupOptions.map( ( rollupOptions ) => rollupBuildInternal( rollupOptions, options ) )
        );
    } else {
        // With threads.
        buildPromise = zRollupCreateBuildWorker( rollupOptions, options );
    }

    buildPromise.then( () => {
        options.config.onBuilt?.();
    } );

    return buildPromise;
}

if ( workerData?.zCliWorkPath ) {
    zRollupBuildInWorker();
}
