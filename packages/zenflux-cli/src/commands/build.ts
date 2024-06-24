/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import process from "node:process";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { zRollupCreateBuildWorker } from "@zenflux/cli/src/core/build";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { TZBuildOptions } from "@zenflux/cli/src/definitions/build";

export default class Build extends CommandBuildBase {

    public async runImpl() {
        const startTime = Date.now(),
            configs = this.getConfigs();

        if ( ! configs.length ) {
            ConsoleManager.$.log( "Build", "config", "no available configs found" );
            return;
        }

        const promises: Promise<any>[] = [];

        for ( const config of configs ) {
            const rollupConfig = this.getRollupConfig( config );

            const options: TZBuildOptions = { config };

            let promise;

            promise = zRollupCreateBuildWorker( rollupConfig, {
                ... options,
                threadId: configs.indexOf( config ),
                otherConfigs: configs.filter( ( c ) => c !== config ),
            }, this.getRollupConsole() );

            promise.then( () => config.onBuilt?.() );

            promises.push( promise );
        }

        await Promise.all( promises );

        ConsoleManager.$.log( "Build", "done", `in (${ Date.now() - startTime }ms)` );

        this.onBuiltAll().finally( () => {
            // TODO: Create worker manager to terminate workers.
            process.exit( 0 );
        } );
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
