/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { console } from "@zenflux/cli/src/modules/console";

import { zRollupBuild } from "@zenflux/cli/src/core/build";

import type { OutputOptions } from "rollup";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

export default class Build extends CommandBuildBase {

    public async run() {
        const configs = this.getConfigs();

        const promises: Promise<void>[] = [];

        for ( const config of configs ) {
            console.log( `Building - '${ config.path }'` );

            const rollupConfig = this.getRollupConfig( config );

            rollupConfig.map( ( rollupOptions ) => {
                promises.push( zRollupBuild( rollupOptions, config ).then(
                    () => config.onBuiltFormat?.( ( rollupOptions.output as OutputOptions ).format as TZFormatType ),
                ) );
            } );

            await Promise.all( promises );

            this.tryUseApiExtractor( config );

            config.onBuilt?.();
        }
    }
}
