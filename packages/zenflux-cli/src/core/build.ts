/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import path from "node:path";
import process from "node:process";

import { rollup } from "rollup";

import { createResolvablePromise } from "@zenflux/typescript-vm/utils";

import { zRollupGetPlugins } from "@zenflux/cli/src/core/rollup";

import { zRollupSwcCompareCaches } from "@zenflux/cli/src/core/rollup-plugins/rollup-swc/rollup-swc-plugin";

import { zGetPackageByConfig } from "@zenflux/cli/src/utils/common";

import { console } from "@zenflux/cli/src/modules/console";

import type { OutputOptions, RollupBuild, RollupOptions } from "rollup";

import type { Package } from "@zenflux/cli/src/modules/npm/package";
import type { Thread, ThreadHost } from "@zenflux/cli/src/modules/threading/thread";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";
import type { TZBuildOptions, TZBuildWorkerOptions } from "@zenflux/cli/src/definitions/build";
import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

const threads = new Map<number, Thread>();

const waitingThreads = new Map<number, {
    promise: ReturnType<typeof createResolvablePromise>,
    dependencies: Record<string, true>,
}>();

const builders = new Map<string, RollupBuild>();

async function rollupBuildInternal( config: RollupOptions, options: TZBuildOptions ) {
    const output = config.output as OutputOptions;

    if ( ! output ) {
        throw new Error( "Rollup output not found." );
    }

    // TODO: This should be only once
    config.onLog = ( logLevel, message ) => {
        // @ts-ignore
        message.projectPath = options.config.path;
        console.log( `Rollup: ${ util.inspect( message ) }` );
    };

    let isBundleChanged = true;

    // TODO: Save cache to disk.
    const builderKey = `${ output.format }-${ output.file ?? output.entryFileNames }`;

    const prevBuild = builders.get( builderKey ),
        currentBuild = await rollup( config );

    if ( ! prevBuild ) {
        builders.set( builderKey, currentBuild );
    } else if ( ! zRollupSwcCompareCaches( prevBuild.cache!, currentBuild.cache! ) ) {
        builders.set( builderKey, currentBuild );
    } else {
        isBundleChanged = false;
    }

    if ( ! options.silent && ! isBundleChanged ) {
        console.log( `Writing - Skip ${ util.inspect( output.format ) } bundle of ${ util.inspect( output.file ?? output.entryFileNames ) }` );
    }

    const startTime = Date.now(),
        file = output.file ?? output.entryFileNames;

    options.silent || console.log( `Writing - Start ${ util.inspect( output.format ) } bundle to ${ util.inspect( file ) }` );

    await builders.get( builderKey )!.write( output );

    options.silent || console.log( `Writing - Done ${ util.inspect( output.format ) } bundle of ${ util.inspect( file ) } in ${ util.inspect( Date.now() - startTime ) + "ms" }` );

    options.config.onBuiltFormat?.( output.format as TZFormatType );
}

async function waitForDependencies( options: TZBuildWorkerOptions, pkg: Package, config: IZConfigInternal ) {
    const { zWorkspaceGetWorkspaceDependencies } = await import( "@zenflux/cli/src/core/workspace" );

    if ( options.otherConfigs.length ) {
        const packagesDependencies = zWorkspaceGetWorkspaceDependencies( {
            [ pkg.json.name ]: pkg,
        } );

        if ( Object.keys( packagesDependencies[ pkg.json.name ].dependencies ).length ) {
            const dependencies = packagesDependencies[ pkg.json.name ].dependencies;

            const availableDependencies: Record<string, true> = {};

            Object.values( options.otherConfigs ).forEach( ( config ) => {
                const pkg = zGetPackageByConfig( config );

                if ( dependencies[ pkg.json.name ] ) {
                    availableDependencies[ config.outputName ] = true;
                }
            } );

            // TODO: It should favor skipping external dependencies.
            if ( Object.keys( availableDependencies ).length ) {
                console.log( `Thread\t${ options.thread }\tPause\t${ util.inspect( config.outputName ) }` );

                const promise = createResolvablePromise();

                waitingThreads.set( options.thread, {
                    promise,
                    dependencies: availableDependencies,
                } );

                await promise.await;
            }
        }
    }
}

function handleThreadResume( buildPromise: Promise<unknown>, config: IZConfigInternal ) {
    buildPromise.then( () => {
        if ( waitingThreads.size === 0 ) {
            return;
        }

        waitingThreads.forEach( ( { promise, dependencies }, threadId ) => {
            if ( dependencies[ config.outputName ] ) {
                delete dependencies[ config.outputName ];
            }

            if ( 0 === Object.keys( dependencies ).length ) {
                waitingThreads.delete( threadId );

                console.verbose( () => `Thread\t${ threadId }\tResume\t${ util.inspect( config.outputName ) }` );

                promise.resolve();
            }
        } );
    } );
}

export async function zRollupBuildInWorker(
    rollupOptions: RollupOptions[] | RollupOptions,
    config: IZConfigInternal,
    host: ThreadHost,
) {
    rollupOptions = ! Array.isArray( rollupOptions ) ? [ rollupOptions ] : rollupOptions;

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

    await Promise.all( linkedRollupOptions.map( async ( singleRollupOptions ) => {
        const output = singleRollupOptions.output as OutputOptions;

        console.verbose( () => `Thread\t${ host.id }\tPrepare\t${ util.inspect( config.outputName ) } format ${ util.inspect( output.format ) } bundle of ${ util.inspect( output.file ?? output.entryFileNames ) }` );

        const promise = rollupBuildInternal( singleRollupOptions, {
            silent: true,
            config,
        } ).catch( ( error ) => {
            error.cause = config.path;

            throw error;
        } );

        await promise;

        console.log( `Thread\t${ host.id }\tBuild\t${ util.inspect( config.outputName ) } format ${ util.inspect( output.format ) } bundle to ${ util.inspect( output.file ?? output.entryFileNames ) }` );

        // This will ensure `console.log` is flushed.
        return new Promise( ( resolve ) => {
            setTimeout( resolve, 0 );
        } );
    } ) );
}

export async function zRollupCreateBuildWorker( rollupOptions: RollupOptions[], options: TZBuildWorkerOptions ) {
    // Plugins cannot be transferred to worker threads, since they are "live" objects/function etc...
    rollupOptions.forEach( ( o ) => {
        delete o.plugins;
    } );

    const { config } = options;

    if ( ! threads.has( options.thread as number ) ) {
        const { Thread } = ( await import( "@zenflux/cli/src/modules/threading/thread" ) );

        // Create a new thread.
        const thread = new Thread(
            "Build",
            options.thread,
            config.outputName,
            zRollupBuildInWorker, [
                rollupOptions,
                options.config,
            ],
        );

        threads.set( options.thread as number, thread );
    }

    const pkg = zGetPackageByConfig( config );

    const thread = threads.get( options.thread as number );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    await waitForDependencies( options, pkg, config );

    const buildPromise = thread.run();

    handleThreadResume( buildPromise, config );

    return buildPromise;
}

export async function zRollupBuild( rollupOptions: RollupOptions[] | RollupOptions, options: TZBuildOptions ) {
    if ( ! Array.isArray( rollupOptions ) ) {
        rollupOptions = [ rollupOptions ];
    }

    const buildPromise = Promise.all(
        rollupOptions.map( ( rollupOptions ) => rollupBuildInternal( rollupOptions, options ) )
    );

    buildPromise.then( () => {
        options.config.onBuilt?.();
    } );

    return buildPromise;
}
