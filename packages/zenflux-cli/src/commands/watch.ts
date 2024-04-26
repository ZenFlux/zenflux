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
import path from "node:path";

import chokidar from "chokidar";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { zDebounce } from "@zenflux/cli/src/utils/timers";

import {
    zTSConfigRead,
    zTSCreateDeclarationWorker,
    zTSCreateDiagnosticWorker,
} from "@zenflux/cli/src/core/typescript";

import { zRollupCreateBuildWorker } from "@zenflux/cli/src/core/build";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { rollupConsole, tsDeclarationConsole, tsDiagnosticConsole } from "@zenflux/cli/src/console/watch-console";

import type { RollupOptions } from "rollup";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

const DEFAULT_ON_CHANGE_DELAY = 2000;

const buildTimePerThread = new Map();

export default class Watch extends CommandBuildBase {
    public initialize() {
        // Set global console instance as rollupConsole.
        ConsoleManager.setInstance( rollupConsole );

        super.initialize();
    }

    public async run() {
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
            watcher.close();
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

                    rollupConsole.log( id, "Watcher", "Send", [ config.outputName ] );
                } )
                .onWorkerEnd( ( id ) => {
                    const time = buildTimePerThread.get( id );

                    rollupConsole.log( id, "Watcher", "Recv", config.outputName, `in {#0000ff-fg}${ Date.now() - time }{#ff0000-fg}ms{/}` );

                    buildTimePerThread.delete( id );

                    if ( buildTimePerThread.size === 0 ) {
                        rollupConsole.log( "M", "Watcher" , "Total",
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

    protected async onBuiltAll() {
        const configs = this.getConfigs();

        // Trigger TypeScript diagnostics for all configs.
        for ( const config of configs ) {
            await this.handleTSDiagnostics( config );
        }

        this.getUniqueConfigs( configs ).forEach( ( config ) => {
            this.handleTypeScript( config );
        } );
    }

    private async handleTSDiagnostics( config: IZConfigInternal ) {
        const id = this.getConfigs().indexOf( config );

        tsDiagnosticConsole.log( id, "Send", util.inspect( config.outputName ) );

        const promise = zTSCreateDiagnosticWorker( zTSConfigRead( null, path.dirname( config.path ) ), {
            useCache: false,
            thread: id
        }, tsDiagnosticConsole );

        return await ( promise as Promise<any> ).then( () => {
            tsDiagnosticConsole.log( id, "Recv", util.inspect( config.outputName ) );
        } );
    }

    private async handleTypeScript( config: IZConfigInternal ) {
        const id = this.getIdByConfig( config );

        tsDeclarationConsole.log( id, "Send", util.inspect( config.outputName ) );

        const result = zTSCreateDeclarationWorker( zTSConfigRead( null, path.dirname( config.path ) ), {
            thread: Number( id )
        }, tsDeclarationConsole );

        ( result as Promise<any> ).then( () => {
            tsDeclarationConsole.log( id, "Recv", util.inspect( config.outputName ) );

            this.tryUseApiExtractor( config, tsDeclarationConsole );
        } );
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
            thread: id,
            otherConfigs: this.getConfigs().filter( ( c ) => c !== config )
        }, rollupConsole );

        const buildCallback = async () => {
            callbacks.onWorkerStart( id );

            await build();

            callbacks.onWorkerEnd( id );
        };

        watcher.on( "ready", async () => {
            rollupConsole.verbose( () => [ id, "Watcher", "Ready", util.inspect( config.outputName ) ] );

            await buildCallback();

            watcher.on( "change", function ( path ) {
                rollupConsole.verbose( () => [
                    id,
                    "Watcher",
                    "Changes",
                    `${ util.inspect( config.outputName ) } at ${ util.inspect( path ) }`
                ] );

                zDebounce( `__WATCHER__${ id }__`, () => {
                    buildCallback();
                }, DEFAULT_ON_CHANGE_DELAY );
            } );
        } );

        return callbacksSetter;
    }

    private getUniqueConfigs( configs: IZConfigInternal[] ) {
        return configs.filter( ( config, index, self ) => {
            // Should filter duplicate config.paths.
            return index === self.findIndex( ( c ) => {
                return c.path === config.path;
            } );
        } );
    }

    private getIdByConfig( config: IZConfigInternal ) {
        return this.getUniqueConfigs( this.getConfigs() ).indexOf( config );
    }
}
