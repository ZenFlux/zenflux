/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { zRollupBuild, zRollupCreateBuildWorker } from "@zenflux/cli/src/core/build";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { TZBuildOptions } from "@zenflux/cli/src/definitions/build";

const DEFAULT_MIN_SINGLE_BUILD_CONFIGS = 1;

export default class Build extends CommandBuildBase {

    public async run() {
        const startTime = Date.now(),
            configs = this.getConfigs(),
            configsPaths = this.getConfigsPaths(),
            isMultiThreaded = configsPaths.length > DEFAULT_MIN_SINGLE_BUILD_CONFIGS;

        const promises: Promise<any>[] = [];

        for ( const config of configs ) {
            const rollupConfig = this.getRollupConfig( config );

            const options: TZBuildOptions = { config };

            let promise;

            if ( isMultiThreaded ) {
                promise = zRollupCreateBuildWorker( rollupConfig, {
                    ... options,
                    threadId: configs.indexOf( config ),
                    otherConfigs: configs.filter( ( c ) => c !== config ),
                }, this.getRollupConsole() );
            } else {
                promise = zRollupBuild( rollupConfig, options );
            }

            promise.then( () => config.onBuilt?.() );

            promises.push( promise );
        }

        await Promise.all( promises );

        ConsoleManager.$.log( "Build", "done", `in (${ Date.now() - startTime }ms)` );

        this.onBuiltAll();
    }

    public showHelp( name: string ) {
        super.showHelp( name );

        ConsoleManager.$.log( util.inspect( {
            "--haltOnDiagnosticError": {
                description: "Halt on typescript diagnostic error",
                behaviors: "Kill the process if typescript diagnostic error occurred"
            }
        } ) );
    }
}
