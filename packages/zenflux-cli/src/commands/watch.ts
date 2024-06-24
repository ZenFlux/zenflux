/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * TODO
 * - Sometimes not all the projects are needed to be built, so we need to find a way to build only the projects that are effected by the change.
 * - Add `onConfigReload` restart the watcher with new config.
 *  - @see https://github.com/lukastaegert/rollup/bflob/eb2b51ca48a92ca90644c77550c4ad0c296b17e6/cli/run/watch-cli.ts#L45
 */
import util from "node:util";
import process from "node:process";

import chokidar from "chokidar";

import { zDebounce } from "@zenflux/cli/src/utils/timers";

import { zRollupCreateBuildWorker } from "@zenflux/cli/src/core/build";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { rollupConsole, tsDeclarationConsole, tsDiagnosticConsole } from "@zenflux/cli/src/console/console-watch";

import type { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

import type { RollupOptions } from "rollup";
import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

const DEFAULT_ON_CHANGE_DELAY = 2000;

const buildTimePerThread = new Map();

export default class Watch extends CommandBuildBase {
    protected getRollupConsole(): ConsoleThreadFormat {
        return rollupConsole;
    }

    protected getTSDiagnosticsConsole(): ConsoleThreadFormat {
        return tsDiagnosticConsole;
    }

    protected getTSDeclarationConsole(): ConsoleThreadFormat {
        return tsDeclarationConsole;
    }

    protected getTotalDiagnosticMessage( passed: number, failed: number, startTimestamp: number ) {
        return [
            `Passed: {#00ff00-fg}${ passed }{/}, Failed: {#ff0000-fg}${ failed }{/}`,
            `Toke {#0000ff-fg}${ Date.now() - startTimestamp }{#ff0000-fg}ms{/}`
        ];
    }

    public async runImpl() {
        const configs = this.getConfigs();

        const globalPaths = zGlobalPathsGet();

        // One watcher for whole workspace, since one change can effect multiple projects.
        const watcher = chokidar.watch( globalPaths.workspace, {
            ignored: [
                "**/node_modules/**",
                "**/dist/**",
                "**/*.log",
                ( s ) => s.split( "/" ).some( ( i ) => i.startsWith( "." ) ),
            ],
            persistent: true
        } );

        process.on( "exit", () => {
            rollupConsole.log( "watcher", "Closing" );
            watcher.close();
        } );

        watcher.on( "error", ( error ) => {
            rollupConsole.error( "watcher", "Error", error );
        } );

        let totalBuildTime = 0;

        // Create build request with thread per config.
        for ( const config of configs ) {
            const rollupConfig = this.getRollupConfig( config );

            // Each watch will have its own build thread.
            this.watch( rollupConfig, config, watcher, configs.indexOf( config ) )
                .onWorkerStart( ( id ) => {
                    if ( buildTimePerThread.size === 0 ) {
                        totalBuildTime = Date.now();
                        this.onBuilt( config );
                    }

                    buildTimePerThread.set( id, Date.now() );

                    rollupConsole.verbose( () => [ "watcher", "send", "to RO-" + id, util.inspect( config.outputName ) ] );
                } )
                .onWorkerEnd( ( id ) => {
                    const time = buildTimePerThread.get( id );

                    rollupConsole.log( "watcher", "recv", "from RO-" + id, util.inspect( config.outputName ), `in {#0000ff-fg}${ Date.now() - time }{#ff0000-fg}ms{/}` );

                    buildTimePerThread.delete( id );

                    if ( buildTimePerThread.size === 0 ) {
                        rollupConsole.log( "watcher", "Total",
                            "{colspan}" + configs.map( c => `{red-fg}'{/}{blue-fg}${ c.outputFileName }{/}{red-fg}'{/}` ).join( ", " ) +
                            ` toke {#0000ff-fg}${ Date.now() - totalBuildTime }{#ff0000-fg}ms{/}` );

                        this.onBuiltAll();
                    }
                } );
        }
    }

    protected async onBuilt( _config: IZConfigInternal ) {
        // TODO: Use it to gain performance.
    }

    private watch( rollupOptions: RollupOptions[], config: IZConfigInternal, watcher: ReturnType<typeof chokidar.watch>, id: number = 0 ) {
        const callbacks = {
            onWorkerStart: ( _id: number ) => {},
            onWorkerEnd: ( _id: number ) => {}
        };

        const callbacksSetter: {
            onWorkerStart: ( callback: ( id: number ) => void ) => typeof callbacksSetter,
            onWorkerEnd: ( callback: ( id: number ) => void ) => typeof callbacksSetter,
        } = {
            onWorkerStart: ( callback ) => {
                callbacks.onWorkerStart = callback;

                return callbacksSetter;
            },
            onWorkerEnd: ( callback ) => {
                callbacks.onWorkerEnd = callback;

                return callbacksSetter;
            }
        };

        const build = zRollupCreateBuildWorker.bind( null, rollupOptions, {
            silent: true,
            config,
            threadId: id,
            otherConfigs: this.getConfigs().filter( ( c ) => c !== config )
        }, rollupConsole );

        const buildCallback = async () => {
            callbacks.onWorkerStart( id );

            await build();

            callbacks.onWorkerEnd( id );
        };

        watcher.on( "ready", async () => {
            await buildCallback();

            watcher.on( "change", function ( path ) {
                rollupConsole.verbose( () => [
                    "watcher",
                    "Changes",
                    "in RO-" + id,
                    `${ util.inspect( config.outputName ) } at ${ util.inspect( path ) }`
                ] );

                zDebounce( `__WATCHER__${ id }__`, () => {
                    buildCallback();
                }, DEFAULT_ON_CHANGE_DELAY );
            } );
        } );

        return callbacksSetter;
    }
}
