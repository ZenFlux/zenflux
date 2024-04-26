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

import { ensureInWorker } from "@zenflux/cli/src/modules/threading/utils";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";
import { ThreadConsole } from "@zenflux/cli/src/console/thread-console";

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

async function threadWaitForDependencies( options: TZBuildWorkerOptions, pkg: Package, config: IZConfigInternal, activeConsole = ConsoleManager.$ ) {
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
                activeConsole.verbose( () => [
                    options.thread,
                    threadWaitForDependencies.name,
                    "Pause",
                    util.inspect( config.outputName ) ]
                );

                const promise = createResolvablePromise();

                waitingThreads.set( options.thread, {
                    promise,
                    dependencies: availableDependencies,
                } );

                await promise.await;

                activeConsole.verbose( () => [
                    options.thread,
                    threadWaitForDependencies.name,
                    "Resume",
                    util.inspect( config.outputName )
                ] );
            }
        }
    }
}

function threadHandleResume( buildPromise: Promise<unknown>, config: IZConfigInternal ) {
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

export async function zRollupBuildInWorker(
    rollupOptions: RollupOptions[] | RollupOptions,
    config: IZConfigInternal,
    host: ThreadHost,
) {
    ensureInWorker();

    // Hook console logs to thread messages.
    ConsoleManager.setInstance( new ThreadConsole( host ) );

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
        const output = singleRollupOptions.output as OutputOptions,
            outputFile = output.file ?? output.entryFileNames;

        // TODO: Prefer `sendVerbose` or `sendMessage` instead of passing `type`.

        host.sendMessage( "message", "build", "prepare",
            config.outputName,
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

        host.sendMessage( "message", "build", "done",
            config.outputName,
            outputFile,
        );

        // This will ensure `console.$.log` is flushed.
        return new Promise( ( resolve ) => {
            setTimeout( resolve, 0 );
        } );
    } ) );
}

export async function zRollupCreateBuildWorker( rollupOptions: RollupOptions[], options: TZBuildWorkerOptions, activeConsole = ConsoleManager.$ ) {
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

        // TODO: `thread.hookConsole( activeConsole )` instead of `onMessage`, `onVerbose`, `onDebug`, `onError`.

        thread.onMessage( activeConsole.message.bind( activeConsole ) );
        thread.onVerbose( activeConsole.verbose.bind( activeConsole ) );
        thread.onDebug( activeConsole.debug.bind( activeConsole ) );
        thread.onError( activeConsole.error.bind( activeConsole ) );

        threads.set( options.thread as number, thread );
    }

    const pkg = zGetPackageByConfig( config );

    const thread = threads.get( options.thread as number );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    await threadWaitForDependencies( options, pkg, config, activeConsole );

    const buildPromise = thread.run();

    threadHandleResume( buildPromise, config );

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
