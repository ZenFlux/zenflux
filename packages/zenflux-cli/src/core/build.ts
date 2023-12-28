/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import path from "node:path";
import process from "node:process";

import { rollup } from "rollup";

import { zRollupGetPlugins } from "@zenflux/cli/src/core/rollup";

import { console } from "@zenflux/cli/src/modules/console";

import type { OutputOptions, RollupBuild, RollupCache, RollupOptions } from "rollup";

import type { Thread, ThreadHost } from "@zenflux/cli/src/modules/threading/thread";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";
import type { TZBuildOptions } from "@zenflux/cli/src/definitions/build";

const threads = new Map<number, Thread>();

const builders = new Map<string, RollupBuild>();

function rollupCompareCaches( prevCache: RollupCache, currentCache: RollupCache ) {
    // Check if the number of modules is the same
    if ( prevCache.modules.length !== currentCache.modules.length ) {
        return false;
    }

    function getZenFluxSwcPluginChecksum( cache: RollupCache ) {
        return Object.values( cache.plugins![ "z-rollup-swc-plugin" ] ?? [] ).reduce( ( acc, record ) => {
            return acc + ( record[ 1 ]?.lastModified || Math.random() );
        }, 0 );
    }

    return getZenFluxSwcPluginChecksum( prevCache ) === getZenFluxSwcPluginChecksum( currentCache );
}

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

    const builderKey = `${ output.format }-${ output.file ?? output.entryFileNames }`;

    const prevBuild = builders.get( builderKey ),
        currentBuild = await rollup( config );

    if ( ! prevBuild ) {
        builders.set( builderKey, currentBuild );
    } else if ( ! rollupCompareCaches( prevBuild.cache!, currentBuild.cache! ) ) {
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

export async function zRollupBuildInWorker(
    rollupOptions: RollupOptions[] | RollupOptions,
    options: TZBuildOptions,
    host: ThreadHost,
) {
    rollupOptions = ! Array.isArray( rollupOptions ) ? [ rollupOptions ] : rollupOptions;

    const buildOptions = options as TZBuildOptions,
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

    return Promise.all( linkedRollupOptions.map( async ( singleRollupOptions ) => {
        const output = singleRollupOptions.output as OutputOptions;

        console.log( `Thread\t${ host.id }\tBuild\t${ util.inspect( config.outputName ) } format ${ util.inspect( output.format ) } bundle to ${ util.inspect( output.file ?? output.entryFileNames ) }` );

        await rollupBuildInternal( singleRollupOptions, options );

        console.verbose( () => `Thread\t${ host.id }\tReady\t${ util.inspect( config.outputName ) } format ${ util.inspect( output.format ) } bundle of ${ util.inspect( output.file ?? output.entryFileNames ) }` );
    } ) );
}

async function zRollupCreateBuildWorker( rollupOptions: RollupOptions[], options: TZBuildOptions ) {
    // Plugins cannot be transferred to worker threads, since they are "live" objects/function etc...
    rollupOptions.forEach( ( o ) => {
        delete o.plugins;
    } );

    if ( ! threads.has( options.thread as number ) ) {
        const { Thread } = ( await import( "@zenflux/cli/src/modules/threading/thread" ) );

        // Create a new thread.
        const thread = new Thread(
            "Build",
            options.thread!,
            options.config.outputName,
            zRollupBuildInWorker, [
                rollupOptions,
                options
            ],
        );

        threads.set( options.thread as number, thread );
    }

    const thread = threads.get( options.thread as number );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    return thread.run();
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
