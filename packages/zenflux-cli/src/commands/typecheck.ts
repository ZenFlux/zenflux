/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import process from "node:process";
import path from "node:path";

import { CommandConfigBase } from "@zenflux/cli/src/base/command-config-base";

import { zTSConfigRead, zTSPreDiagnostics, zTSCreateDiagnosticWorker } from "@zenflux/cli/src/core/typescript";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { tsDiagnosticConsole } from "@zenflux/cli/src/console/console-build";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

export default class Typecheck extends CommandConfigBase {

    public async runImpl() {
        const startTime = Date.now();
        const configs = this.getConfigs();

        if ( ! configs.length ) {
            ConsoleManager.$.log( "Typecheck", "config", "no available configs found" );
            return;
        }

        const isMultiplePackages = configs.length > 1;
        let passed = 0;
        let failed = 0;

        if ( isMultiplePackages ) {
            ConsoleManager.$.log( "Typecheck", "start", `checking ${ configs.length } packages in parallel` );

            // For typecheck, we need to handle dependencies differently
            // Run packages in dependency order to avoid waiting issues
            const results = await this.runTypecheckWithDependencyOrdering( configs );

            results.forEach( ( result ) => {
                if ( result ) {
                    passed++;
                } else {
                    failed++;
                }
            } );
        } else {
            ConsoleManager.$.log( "Typecheck", "start", "checking single package" );

            const result = await this.runTypecheckForConfig( configs[ 0 ], false );

            if ( result ) {
                passed++;
            } else {
                failed++;
            }
        }

        const totalTime = Date.now() - startTime;
        ConsoleManager.$.log( "Typecheck", "done",
            `Passed: ${ util.inspect( passed ) }, Failed: \x1b[31m${ failed }\x1b[0m, Took ${ util.inspect( totalTime ) }ms`
        );

        if ( failed > 0 ) {
            process.exit( 1 );
        }
    }

    private async runTypecheckWithDependencyOrdering( configs: IZConfigInternal[] ): Promise<boolean[]> {
        // For typecheck, we'll use a simpler approach: run all packages in parallel
        // but without the complex dependency waiting mechanism
        const promises = configs.map( async ( config ) => {
            return this.runTypecheckForConfig( config, false ); // Always use sync for typecheck
        } );

        return Promise.all( promises );
    }

    private async runTypecheckForConfig( config: IZConfigInternal, useWorker: boolean ): Promise<boolean> {
        const projectPath = path.dirname( config.path );
        const tsConfig = zTSConfigRead( null, projectPath );

        const options = {
            useCache: false,
            haltOnError: process.argv.includes( "--haltOnDiagnosticError" ),
        };

        try {
            if ( useWorker ) {
                const id = "TC" + this.getConfigs().indexOf( config );
                const otherConfigs = this.getConfigs().filter( ( c ) => c !== config );
                const otherTSConfigs = otherConfigs.map( ( c ) => zTSConfigRead( null, path.dirname( c.path ) ) );

                tsDiagnosticConsole.log( "send", "to " + id, util.inspect( config.outputName ) );

                await zTSCreateDiagnosticWorker( tsConfig, {
                    id,
                    otherTSConfigs,
                    config,
                    ... options
                }, tsDiagnosticConsole );

                tsDiagnosticConsole.log( "recv", "from " + id, util.inspect( config.outputName ) );
            } else {
                await zTSPreDiagnostics( tsConfig, options );
            }

            return true;
        } catch ( error ) {
            if ( options.haltOnError ) {
                throw error;
            }

            ConsoleManager.$.error( "Typecheck", "error", `Failed to typecheck ${ util.inspect( config.outputName ) }:`, error );
            return false;
        }
    }

    public showHelp( name: string ) {
        super.showHelp( name );

        ConsoleManager.$.log( util.inspect( {
            "--haltOnDiagnosticError": {
                description: "Halt on typescript diagnostic error",
                behaviors: "Kill the process if typescript diagnostic error occurred"
            }
        } ) );

        ConsoleManager.$.log( "Examples:" );
        ConsoleManager.$.log( "  " + name + "                    # Typecheck all packages in workspace" );
        ConsoleManager.$.log( "  " + name + " --workspace \"react-*\"  # Typecheck packages matching pattern" );
        ConsoleManager.$.log( "  " + name + " --workspace zenflux-cli # Typecheck specific package" );
    }
}
