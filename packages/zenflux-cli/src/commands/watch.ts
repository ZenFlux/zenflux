/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * TODO: Use worker threads to run multiple builds in parallel.
 */
import util from "node:util";

import { watch } from "rollup";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { console } from "@zenflux/cli/src/modules/console";

import type { OutputOptions, RollupWatchOptions } from "rollup";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

const DEFAULT_ON_BUILT_DELAY = 2000;

export default class Watch extends CommandBuildBase {

    public async run() {
        const configs = this.getConfigs();

        const state: { [ key: string ]: "start" | "end" } = {};

        const timers: { [ key: string ]: NodeJS.Timeout } = {};

        const debounce = ( id: string, fn: () => void, delay: number = DEFAULT_ON_BUILT_DELAY ) => {
            clearTimeout( timers[ id ] );

            timers[ id ] = setTimeout( () => fn(), delay );
        };

        for ( const config of configs ) {
            const onBuiltFormat = config.onBuiltFormat || function ( _ ) {};

            for ( const rollupConfig of this.getRollupConfig( config.path ) ) {
                const output = rollupConfig.output as OutputOptions;

                if ( ! output ) {
                    console.error( `output not found: ${ JSON.stringify( rollupConfig ) }` );
                    return;
                }

                const watchOptions = { ...rollupConfig } as RollupWatchOptions;

                state[ config.path ] = "start";

                await this.watch( watchOptions, output, () => debounce( config.path, () =>{
                    onBuiltFormat( output.format as TZFormatType );

                    this.tryUseApiExtractor( config );

                    state[ config.path ] = "end";

                    // If all configs are done, call `onBuilt` callback.
                    if ( Object.values( state ).every( ( state ) => state === "end" ) ) {
                        config.onBuilt?.();
                    }
                }) );
            }
        }
    }

    private async watch( watchOptions: RollupWatchOptions, output: OutputOptions, onBuiltFormat: ( format: TZFormatType ) => void ) {
        const watcher = watch( watchOptions );

        let startTime = 0;

        return new Promise( ( resolve, reject ) => {
            watcher.on( "event", function ( evt ) {
                switch ( evt.code ) {
                    case "BUNDLE_START":
                        startTime = Date.now();
                        console.log( `Watching - Start ${ util.inspect( output.format ) } bundle to ${ util.inspect( output.file ) }` );
                        break;

                    case "BUNDLE_END":
                        console.log( `Watching - Done ${ util.inspect( output.format ) } bundle to ${ util.inspect( output.file ) }` +
                            "in " + util.inspect( ( Date.now() - startTime ) + "ms" ) );

                        onBuiltFormat( output.format as TZFormatType );

                        resolve( output );

                        break;

                    case "ERROR":
                        const error = new Error();

                        error.stack = evt.error.stack;
                        error.message = evt.error.message;
                        error.cause = output.file;

                        reject( error );

                        break;

                    default:
                        resolve( output );
                }
            } );
        } );
    }
}
