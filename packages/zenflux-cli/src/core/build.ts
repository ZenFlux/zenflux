/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * @TODO: Avoid using useless imports from thread, use dynamic imports instead.
 */
import util from "node:util";
import path from "node:path";
import process from "node:process";

import { rollup } from "rollup";

import { zCreateResolvablePromise } from "@zenflux/utils/src/promise";

import { zTSGetPackageByConfig } from "@zenflux/cli/src/utils/typescript";

import { zRollupGetPlugins } from "@zenflux/cli/src/core/rollup";

import { zRollupSwcCompareCaches } from "@zenflux/cli/src/core/rollup-plugins/rollup-swc/rollup-swc-plugin";

import { ensureInWorker } from "@zenflux/cli/src/modules/threading/utils";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { ConsoleThreadSend } from "@zenflux/cli/src/console/console-thread-send";
import { ConsoleThreadReceive } from "@zenflux/cli/src/console/console-thread-receive";

import type { ThreadHost } from "@zenflux/cli/src/modules/threading/definitions";

import type { OutputOptions, RollupBuild, RollupOptions } from "rollup";

import type { Worker } from "@zenflux/cli/src/modules/threading/worker";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";
import type { TZBuildOptions, TZBuildWorkerOptions } from "@zenflux/cli/src/definitions/build";
import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

import type { Package } from "@zenflux/cli/src/modules/npm/package";
import type { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

const threads = new Map<number, Worker>(),
    builders = new Map<string, RollupBuild>();

const waitingThreads = new Map<number, {
    promise: ReturnType<typeof zCreateResolvablePromise>,
    dependencies: Record<string, true>,
}>();

async function rollupBuildInternal( config: RollupOptions, options: TZBuildOptions ) {
    const output = config.output as OutputOptions;

    if ( ! output ) {
        throw new Error( "Rollup output not found." );
    }

    // TODO: This should be only once
    config.onLog = ( logLevel, message ) => {
        // @ts-ignore
        message.projectPath = options.config.path;
        ConsoleManager.$.log( `Rollup: ${ util.inspect( message ) }` );
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
        ConsoleManager.$.log( `Writing - Skip ${ util.inspect( output.format ) } bundle of ${ util.inspect( output.file ?? output.entryFileNames ) }` );
    }

    const startTime = Date.now(),
        file = output.file ?? output.entryFileNames;

    options.silent ||
        ConsoleManager.$.log( `Writing - Start ${ util.inspect( output.format ) } bundle to ${ util.inspect( file ) }` );

    await builders.get( builderKey )!.write( output );

    options.silent ||
        ConsoleManager.$.log( `Writing - Done ${ util.inspect( output.format ) } bundle of ${ util.inspect( file ) } in ${ util.inspect( Date.now() - startTime ) + "ms" }` );

    options.config.onBuiltFormat?.( output.format as TZFormatType );
}

export async function zRollupBuildInWorker(
    rollupOptions: RollupOptions[] | RollupOptions,
    config: IZConfigInternal,
    host: ThreadHost,
) {
    ensureInWorker();

    // Hook local console logs to worker messages.
    ConsoleManager.setInstance( new ConsoleThreadSend( host ) );

    rollupOptions = ! Array.isArray( rollupOptions ) ? [ rollupOptions ] : rollupOptions;

    const linkedRollupOptions = await Promise.all( rollupOptions.map( async ( rollupOptions ) => {
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
            enableCustomLoader: !! config.enableCustomLoader,
            enableCjsAsyncWrap: !! config.enableCjsAsyncWrap,
        rollupOptions.plugins = await zRollupGetPlugins( {
            enableCustomLoader: !! config.enableCustomLoader,
            enableCjsAsyncWrap: !! config.enableCjsAsyncWrap,
            extensions: config.extensions || [],
            format: convertFormatToInternalFormat( output.format! ),
            moduleForwarding: config.moduleForwarding,
            sourcemap: !! output.sourcemap,
            minify: "development" !== process.env.NODE_ENV,
            projectPath: path.dirname( config.path )
        } );

        return rollupOptions;
    } ) );

    await Promise.all( linkedRollupOptions.map( async ( singleRollupOptions ) => {
        const output = singleRollupOptions.output as OutputOptions,
            outputFile = output.file ?? output.entryFileNames;

        // TODO: Sending formated message to the host, not the best practice.
        host.sendLog( "build", "prepare",
            util.inspect( config.outputName ),
            "->",
            outputFile,
        );

        const promise = rollupBuildInternal( singleRollupOptions, {
            silent: true,
            config,
        } ).catch( ( error ) => {
            error.cause = config.path;

            throw error;
        } );

        await promise;

        host.sendLog( "build", "done",
            util.inspect( config.outputName ),
            "->",
            outputFile,
        );

        // This will ensure `console.$.log` is flushed.
        return new Promise( ( resolve ) => {
            setTimeout( resolve, 0 );
        } );
    } ) );
}

export async function zRollupCreateBuildWorker( rollupOptions: RollupOptions[], options: TZBuildWorkerOptions, activeConsole: ConsoleThreadFormat  ) {
    // Plugins cannot be transferred to worker threads, since they are "live" objects/function etc...
    rollupOptions.forEach( ( o ) => {
        delete o.plugins;
    } );

    const { config } = options;

    if ( ! threads.has( options.threadId as number ) ) {
        const { Worker } = ( await import( "@zenflux/cli/src/modules/threading/worker" ) );

        // Create a new thread.
        const worker = new Worker(
            "Build",
            options.threadId,
            config.outputName,
            zRollupBuildInWorker, [
                rollupOptions,
                options.config,
            ],
        );

        ConsoleThreadReceive.connect( worker, activeConsole );

        threads.set( options.threadId as number, worker );
    }

    const thread = threads.get( options.threadId as number );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    await zBuildThreadWaitForDependencies( options, zTSGetPackageByConfig( config ), config, activeConsole );

    const buildPromise = thread.run().catch( ( error ) => {
        activeConsole.error( "build", "error", "in RO-" + options.threadId , "\n ->", error );
    } );

    zBuildThreadHandleResume( buildPromise, config );

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

async function zBuildThreadWaitForDependencies( options: TZBuildWorkerOptions, pkg: Package, config: IZConfigInternal, activeConsole = ConsoleManager.$ ) {
    const { zWorkspaceGetWorkspaceDependencies } = await import( "@zenflux/cli/src/core/workspace" );

    if ( options.otherConfigs.length ) {
        const packagesDependencies = zWorkspaceGetWorkspaceDependencies( {
            [ pkg.json.name ]: pkg,
        } );

        if ( Object.keys( packagesDependencies[ pkg.json.name ].dependencies ).length ) {
            const dependencies = packagesDependencies[ pkg.json.name ].dependencies;

            const availableDependencies: Record<string, true> = {};

            Object.values( options.otherConfigs ).forEach( ( config ) => {
                const pkg = zTSGetPackageByConfig( config );

                if ( dependencies[ pkg.json.name ] ) {
                    availableDependencies[ config.outputName ] = true;
                }
            } );

            // TODO: It should favor skipping external dependencies.
            if ( Object.keys( availableDependencies ).length ) {
                activeConsole.verbose( () => [
                    "build",
                    zBuildThreadWaitForDependencies.name,
                    "Pause",
                    util.inspect( config.outputName ) ]
                );

                const promise = zCreateResolvablePromise();

                waitingThreads.set( options.threadId, {
                    promise,
                    dependencies: availableDependencies,
                } );

                await promise.await;

                activeConsole.verbose( () => [
                    "build",
                    zBuildThreadWaitForDependencies.name,
                    "Resume",
                    util.inspect( config.outputName )
                ] );
            }
        }
    }
}

function zBuildThreadHandleResume( buildPromise: Promise<unknown>, config: IZConfigInternal ) {
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

                promise.resolve();
            }
        } );
    } );
}
