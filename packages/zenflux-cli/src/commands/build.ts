/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { console } from "@zenflux/cli/src/modules/console";

import { zRollupBuild } from "@zenflux/cli/src/core/build";

export default class Build extends CommandBuildBase {

    public async run() {
        const configs = this.getConfigs();

        for ( const config of configs ) {
            console.log( `Building - '${ config.path }'` );

            const rollupConfig = this.getRollupConfig( config );

            await zRollupBuild( rollupConfig, { config } );

            this.tryUseApiExtractor( config );

            config.onBuilt?.();
        }
    }
}
