/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import process from "node:process";

import util from "node:util";

import { CommandConfigBase } from "@zenflux/cli/src/base/command-config-base";

import { zRollupGetConfig } from "@zenflux/cli/src/core/rollup";
import { zApiExporter } from "@zenflux/cli/src/core/api-extractor";

import { console } from "@zenflux/cli/src/modules/console";

import type { RollupOptions } from "rollup";

import type { IZConfig } from "@zenflux/cli/src/definitions/config";

export abstract class CommandBuildBase extends CommandConfigBase {
    private rollupConfig: {
        [ key: string ]: RollupOptions[]
    } = {};

    public constructor( protected args: string[], protected options: any = {} ) {
        super( args, options );

        // TODO: Avoid using `process.env.NODE_ENV` use CommandBase instead
        if ( args.includes( "--dev" ) ) {
            process.env.NODE_ENV = "development";
        }
    }

    public async loadConfigs() {
        const result = super.loadConfigs();

        await result.then( () => {
            this.getConfigs().forEach( config => {
                this.rollupConfig[ config.path ] = this.getConfigForEachFormat( config );
            } );
        } );

        return result;
    }

    protected tryUseApiExtractor( config: IZConfig ) {
        const projectPath = path.dirname( config.path );

        // Check if we need to generate dts file.
        if ( config.inputDtsPath ) {
            zApiExporter(
                projectPath,
                config.inputDtsPath as string,
                config.outputDtsPath as string,
            )?.succeeded && console.log( `Writing - done '${ path.isAbsolute( config.outputDtsPath as string ) ? config.outputDtsPath : path.join( projectPath, config.outputDtsPath as string ) }'` );
        }
    }

    protected getRollupConfig( pathKey: string ) {
        return this.rollupConfig[ pathKey ];
    }

    private getConfigForEachFormat( config: IZConfig ) {
        return config.format.map( format => zRollupGetConfig( {
            ... config,
            format
        }, path.dirname( config.path ) ) );
    }

    public showHelp( name: string ) {
        super.showHelp( name );

        // Describe what the `--dev` option does for the command
        console.log( util.inspect( {
            "--dev": {
                description: "Run in development mode",
                behaviors: [
                    "Shows all api-exporter diagnostics",
                    "No minification",
                    "Loading different tsconfig file: tsconfig.{format}.dev.json",
                    "Sets process.env.NODE_ENV to 'development'"
                ]
            }
        } ) );
    }
}
