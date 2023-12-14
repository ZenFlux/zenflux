/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import util from "node:util";
import process from "node:process";

import { zTSConfigRead, zTSCreateDeclaration, zTSPreDiagnostics } from "@zenflux/cli/src/core/typescript";

import { CommandBuildBase } from "@zenflux/cli/src/base/command-build-base";

import { console } from "@zenflux/cli/src/modules/console";

import { zRollupBuild } from "@zenflux/cli/src/core/build";

import type { TZBuildOptions } from "@zenflux/cli/src/definitions/build";

// TODO:
//  - add --thread flag
//  - add DEFAULT_MIN_SINGLE_BUILD_CONFIGS configuration
const DEFAULT_MIN_SINGLE_BUILD_CONFIGS = 3;

export default class Build extends CommandBuildBase {

    public async run() {
        const configs = this.getConfigs(),
            configsPaths = this.getConfigsPaths();

        configsPaths.forEach( ( configPath ) => {
            const tsConfig = zTSConfigRead( null, path.dirname( configPath ) );

            zTSPreDiagnostics( tsConfig, {
                // TODO: Avoid usage of `process.argv` use CommandBase instead.
                haltOnError: process.argv.includes( "--haltOnDiagnosticError" ),
            } );
        } );

        for ( const config of configs ) {
            console.log( `Building - '${ config.path }'` );

            const rollupConfig = this.getRollupConfig( config );

            const options: TZBuildOptions = {
                config,
            };

            if ( configs.length > DEFAULT_MIN_SINGLE_BUILD_CONFIGS ) {
                options.thread = configs.indexOf( config );
            }

            await zRollupBuild( rollupConfig, options );

            config.onBuilt?.();
        }

        configsPaths.forEach( ( configPath ) => {
            console.log( `Creating declaration files for '${ configPath }'` );

            zTSCreateDeclaration( zTSConfigRead( null, path.dirname( configPath ) ) );
        } );

        configs.forEach( config => {
            console.log( `Trying to use api-extractor for '${ config.path }'` );

            this.tryUseApiExtractor( config );
        } );
    }

    public showHelp( name: string ) {
        super.showHelp( name );

        console.log( util.inspect( {
            "--haltOnDiagnosticError": {
                description: "Halt on typescript diagnostic error",
                behaviors: "Kill the process if typescript diagnostic error occurred"
            }
        } ) );
    }
}
