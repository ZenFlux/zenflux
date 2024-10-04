/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * @TODO: Avoid using useless imports from thread, use dynamic imports instead.
 */
import path from "node:path";

import process from "node:process";

import util from "node:util";

import { zCreateResolvablePromise } from "@zenflux/utils/src/promise";

import { rollup } from "rollup";

import { ensureInWorker } from "@zenflux/worker/utils";

import { ConsoleThreadReceive } from "@zenflux/cli/src/console/console-thread-receive";

import { ConsoleThreadSend } from "@zenflux/cli/src/console/console-thread-send";

import { zRollupGetPlugins } from "@zenflux/cli/src/core/rollup";

import { zRollupSwcCompareCaches } from "@zenflux/cli/src/core/rollup-plugins/rollup-swc/rollup-swc-plugin";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { zTSGetPackageByConfig } from "@zenflux/cli/src/utils/typescript";

import type { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

import type { TZBuildOptions, TZBuildWorkerOptions } from "@zenflux/cli/src/definitions/build";
import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

import type { Package } from "@zenflux/cli/src/modules/npm/package";

import type { ThreadHost } from "@zenflux/worker/definitions";

import type { Worker } from "@zenflux/worker";

import type { InternalModuleFormat, OutputOptions, RollupBuild, RollupOptions } from "rollup";

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
        const methods = {
            "info": ConsoleManager.$.info,
            "warn": ConsoleManager.$.warn,
            "error": ConsoleManager.$.error,
            "debug": ( ... args: any[] ) => ConsoleManager.$.debug( () => args ),
            "log": ConsoleManager.$.log,
        } as const;

        if ( logLevel === "warn" && options.config.omitWarningCodes?.includes( message.code || "undefined" ) ) {
            return;
        }

        methods[ logLevel ]( ... [ "build", "rollupBuildInternal", "", util.inspect( {
            message,
            projectPath: options.config.path,
        } ) ] );
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

        const convertFormatToInternalFormat = ( format: typeof output.format ): InternalModuleFormat => {
            switch ( format ) {
                case "cjs":
                case "commonjs":
                    return "cjs";

                case "system":
                case "systemjs":
                    return "system";

                case "es":
                case "esm":
                case "module":
                default:
                    return "es";
            }
        };

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

export async function zRollupCreateBuildWorker( rollupOptions: RollupOptions[], options: TZBuildWorkerOptions, activeConsole: ConsoleThreadFormat ) {
    // Plugins cannot be transferred to worker threads, since they are "live" objects/function etc...
    rollupOptions.forEach( ( o ) => {
        delete o.plugins;
    } );

    const { config } = options;

    if ( ! threads.has( options.threadId as number ) ) {
        const { zCreateWorker } = ( await import( "@zenflux/worker" ) );

        const worker = zCreateWorker( {
            name: "Build",
            id: options.threadId,
            display: config.outputName,

            workFunction: zRollupBuildInWorker,
            workArgs: [
                rollupOptions,
                options.config,
            ],
        } );

        ConsoleThreadReceive.connect( worker, activeConsole );

        threads.set( options.threadId as number, worker );
    }

    const thread = threads.get( options.threadId as number );

    // TODO: Find better way to handle this. some error cause thread to 'exit'. eg: rollup errors or swc...
    if ( ! thread?.isAlive() ) {
        threads.delete( options.threadId as number );

        return zRollupCreateBuildWorker( rollupOptions, options, activeConsole );
    }

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    await zBuildThreadWaitForDependencies( options, zTSGetPackageByConfig( config ), config, activeConsole );

    const buildPromise = thread.run().catch( ( error ) => {
        const isDebug = ConsoleManager.isFlagEnabled( "debug" ) || ConsoleManager.isFlagEnabled( "inspectorDebug" );

        if ( error.watchFiles && ! isDebug ) {
            delete error.watchFiles;
        }

        if ( error.name === "Error" ) {
            error = Object.assign( new Error( error.message ), error );
        }

        activeConsole.error( "build", "in RO-" + options.threadId, "", util.inspect( { $: error }, { depth: 4 } ) );
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
