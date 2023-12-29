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

import {
    zTSConfigRead,
    zTSCreateDeclarationWorker,
    zTSCreateDiagnosticWorker,
} from "@zenflux/cli/src/core/typescript";

import { zRollupCreateBuildWorker } from "@zenflux/cli/src/core/build";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { console } from "@zenflux/cli/src/modules/console";

import type { RollupOptions } from "rollup";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

const DEFAULT_ON_CHANGE_DELAY = 2000;

const timers: {
    [ key: string ]: NodeJS.Timeout
} = {};

const debounce = ( id: string, fn: () => void, delay: number ) => {
    clearTimeout( timers[ id ] );

    timers[ id ] = setTimeout( () => fn(), delay );
};

const buildTimePerThread = new Map();

export default class Watch extends CommandBuildBase {
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

        let totalBuildTime = 0,
            builtOnce = false;

        console.log("Starting watcher ..." );

        // Create build request with thread per config.
        for ( const config of configs ) {
            const rollupConfig = this.getRollupConfig( config );

            // Each watch will have its own build thread.
            this.watch( rollupConfig, config, watcher, configs.indexOf( config ) )
                .onWorkerStart( ( id ) => {
                    if ( buildTimePerThread.size === 0 ) {
                        if ( builtOnce ) {
                            console.clear();
                        }

                        totalBuildTime = Date.now();
                        builtOnce = true;
                    }

                    buildTimePerThread.set( id, Date.now() );

                    console.log( `Watcher\t${ id }\tSend\t${ util.inspect( config.outputName ) }` );
                } )
                .onWorkerEnd( ( id ) => {
                    const time = buildTimePerThread.get( id );

                    console.log( `Watcher\t${ id }\tRecv\t${ util.inspect( config.outputName ) }` +
                        " in " + util.inspect( ( Date.now() - time ) + "ms" ) );

                    buildTimePerThread.delete( id );

                    if ( buildTimePerThread.size === 0 ) {
                        console.log( `Watcher\tT\tTotal\t${ util.inspect( configs.map( c => c.outputFileName ), { breakLength: Infinity } ) } toke: ${ util.inspect( ( Date.now() - totalBuildTime ) + "ms" ) }` );

                        this.onBuiltAll( configs );
                    }
                } );
        }
    }

    protected async onBuiltAll( configs: IZConfigInternal[] ) {
        const uniqueConfigs = configs.filter( ( config, index, self ) => {
            // Should filter duplicate config.paths.
            return index === self.findIndex( ( c ) => {
                return c.path === config.path;
            } );
        } );

        const passedConfigs: Record<number, IZConfigInternal> = {};

        await Promise.all( uniqueConfigs.map( async ( config ) => {
            const id = uniqueConfigs.indexOf( config );

            console.log( `Diagnostic\t${ id }\tSend\t${ util.inspect( config.outputName ) }` );

            const promise = zTSCreateDiagnosticWorker( zTSConfigRead( null, path.dirname( config.path ) ), {
                useCache: false,
                thread: id
            } );

            await ( promise as Promise<any> ).then( ( result ) => {
                if ( result ) {
                    passedConfigs[ id ] = config;
                }
                console.log( `Diagnostic\t${ id }\tRecv\t${ util.inspect( config.outputName ) }` );
            } );
        } ) );

        Object.entries( passedConfigs ).forEach( ( [ id, config ] ) => {
            console.log( `Declaration\t${ id }\tSend\t${ util.inspect( config.outputName ) }` );

            const result = zTSCreateDeclarationWorker( zTSConfigRead( null, path.dirname( config.path ) ), {
                thread: Number( id )
            } );

            ( result as Promise<any> ).then( () => {
                console.log( `Declaration\t${ id }\tRecv\t${ util.inspect( config.outputName ) }` );

                this.tryUseApiExtractor( config );
            } );
        } );
    }

    private watch( rollupOptions: RollupOptions[], config: IZConfigInternal, watcher: ReturnType<typeof chokidar.watch>, id: number = 0 ) {
        const callbacks = {
            onWorkerStart:( _id: number ) => {},
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
        } );

        const buildCallback = async () => {
            callbacks.onWorkerStart( id );

            await build();

            callbacks.onWorkerEnd( id );
        };

        watcher.on( "ready", async () => {
            console.verbose( () => `Watcher\t${ id }\tReady\t${ util.inspect( config.outputName ) }` );

            await buildCallback();

            watcher.on( "change", function ( path ) {
                console.verbose( () => `Watcher\t${ id }\tChanges\t${ util.inspect( config.outputName ) } at ${ util.inspect( path ) }` );

                debounce( `__WATCHER__${ id }__`, () => {
                    buildCallback();
                }, DEFAULT_ON_CHANGE_DELAY );
            } );
        } );

        return callbacksSetter;
    }
}
