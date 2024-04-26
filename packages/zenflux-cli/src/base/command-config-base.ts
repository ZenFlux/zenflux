/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";

import { zConfigLoad } from "@zenflux/cli/src/core/config";
import { zWorkspaceFindPackages, zWorkspaceGetPackagesPaths } from "@zenflux/cli/src/core/workspace";
import { zGlobalGetConfigPath } from "@zenflux/cli/src/core/global";

import { CommandBase } from "@zenflux/cli/src/base/command-base";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

export abstract class CommandConfigBase extends CommandBase {
    private configs: IZConfigInternal[] = [];

    protected isWorkspaceSpecified = false;

    public initialize() {
        const workspaceArgIndex = this.args.indexOf( "--workspace" );

        // Determine if the workspace is specified
        if ( workspaceArgIndex > -1 ) {
            this.isWorkspaceSpecified = true;

            const result = zWorkspaceFindPackages(
                this.args[ workspaceArgIndex + 1 ]
                    .split( "," )
                    .map( i => i.trim() ),
                this.initPathsArgs.workspacePath,
            );

            this.initPathsArgs.projectsPaths = Object.values( result ).map( i => i.getPath() );

            return;
        }

        // Determine if the current working directory is a workspace
        if ( this.initPathsArgs.workspacePath === this.initPathsArgs.cwd ) {
            this.initPathsArgs.projectsPaths = zWorkspaceGetPackagesPaths(
                new Package( this.initPathsArgs.workspacePath )
            ).flatMap( i => i.packages );

            return;
        }

        // Default runs on the current working directory
    }

    public async loadConfigs() {
        if ( this.args.includes( "--help" ) ) {
            return;
        }

        const configArgIndex = this.args.indexOf( "--config" );

        let configFileName: string | undefined;
        if ( configArgIndex > -1 ) {
            configFileName = this.args[ configArgIndex + 1 ];
        }

        const promises = this.paths.projects.map( async ( projectPath: string ) => {
            const path = zGlobalGetConfigPath( projectPath, configFileName );

            const config = await zConfigLoad( path, this.paths.projects.length > 1 );

            if ( config ) {
                this.configs.push( ... config );
            }
        } );

        await Promise.all( promises );

        return this.configs;
    }

    protected getConfigs() {
        return this.configs;
    }

    protected getConfigsPaths() {
        const result: { [ key: string ]: boolean } = {};

        for ( const config of this.configs ) {
            result[ config.path ] = true;
        }

        return Object.keys( result );
    }

    protected showHelp( name: string ) {
        super.showHelp( name );

        ConsoleManager.$.log( util.inspect( {
            "--config": {
                description: "Specify a custom config file",
                // aliases: [ "-c" ],
                examples: [
                    "--config <config-file-name>",
                    "--config zenflux.test.config.ts",
                ]
            },
            "--workspace": {
                description: "Run for specific workspace",
                examples: [
                    "--workspace <company@package-name>",
                    "--workspace <package-name>",
                    "--workspace <package-name-a>, <package-name-b>",
                    "--workspace \"prefix-*\", \"react-*\""
                ]
            }
        } ) );
    }
}
