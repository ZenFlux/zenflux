/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { rollup } from "rollup";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { console } from "@zenflux/cli/src/modules/console";

import type { OutputOptions, RollupOptions } from "rollup";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

export default class Build extends CommandBuildBase {

    public async run() {
        const configs = this.getConfigs();

        const promises: Promise<void>[] = [];

        // TODO: Create promise per config.
        for ( const config of configs ) {
            console.log( `Building - '${ config.path }'` );

            const rollupConfig = this.getRollupConfig( config.path );

            rollupConfig.map( ( rollupOptions ) => {
                promises.push( this.build( rollupOptions ).then(
                    () => config.onBuiltFormat?.( ( rollupOptions.output as OutputOptions ).format as TZFormatType ),
                ) );
            } );

            await Promise.all( promises );

            this.tryUseApiExtractor( config );

            config.onBuilt?.();
        }
    }

    private async build( config: RollupOptions ) {
        const output = config.output as OutputOptions;

        if ( ! output ) {
            throw new Error( "Rollup output not found." );
        }

        const bundle = await rollup( config ),
            startTime = Date.now();

        console.log( `Writing - '${ output.format }' bundle to '${ output.file }'` );

        await bundle.write( output );

        console.log( `Writing - Done '${ output.format }' bundle to '${ output.file }' in ${ Date.now() - startTime }ms` );
    }
}
