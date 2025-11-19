/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
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

    /**
     * Initializes the workspace and project paths based on the command line arguments.
     */
    protected async initialize() {
        const workspaceArgIndex = this.args.indexOf( "--workspace" );
        const filterArgIndex = this.args.indexOf( "--filter" );

        ConsoleManager.$.log( "config", "initialize", `Args: ${ util.inspect( this.args ) }, filterArgIndex: ${ filterArgIndex }, workspaceArgIndex: ${ workspaceArgIndex }` );

        const projectsPaths: string[] = [];
        let filterWasApplied = false;

        // Determine if the workspace is specified
        if ( workspaceArgIndex > -1 ) {
            this.isWorkspaceSpecified = true;

            const result = await zWorkspaceFindPackages(
                this.args[ workspaceArgIndex + 1 ]
                    .split( "," )
                    .map( i => i.trim().replace( /"/g, "" ) ),
                this.initPathsArgs.workspacePath,
            );

            if ( ! Object.keys( result ).length ) {
                ConsoleManager.$.error( "build", "workspace", `package(s) not found: ${ util.inspect( this.args[ workspaceArgIndex + 1 ] ) }` );
            } else {
                ConsoleManager.$.verbose( () => [
                    "config",
                    this.initialize.name,

                    `found packages in workspace by regex: ${ util.inspect( this.args[ workspaceArgIndex + 1 ] ) }`,

                    Object.entries( result ).reduce( ( acc, [ packageName, pkg ] ) => {
                        acc[ packageName ] = pkg.getPath();
                        return acc;
                    }, {} as { [ key: string ]: string } )
                ] );

                projectsPaths.push( ... Object.values( result ).map( i => i.getPath() ) );
            }
        }

        if ( filterArgIndex > -1 && filterArgIndex + 1 < this.args.length ) {
            filterWasApplied = true;
            this.isWorkspaceSpecified = true;

            const filterValue = this.args[ filterArgIndex + 1 ];
            
            ConsoleManager.$.log( "config", "filter", `Applying filter: ${ util.inspect( filterValue ) }` );

            const filterPaths = filterValue
                .split( "," )
                .map( i => {
                    let cleanPath = i.trim().replace( /"/g, "" );
                    // Remove trailing globs for simple prefix matching
                    cleanPath = cleanPath.replace( /\*+$/, "" );
                    // Ensure we use resolved absolute path for filtering, normalized
                    const resolvedPath = path.resolve( this.initPathsArgs.cwd, cleanPath );
                    const normalized = path.normalize( resolvedPath );
                    return normalized;
                } );

            ConsoleManager.$.log( "config", "filter", `Resolved filter paths: ${ util.inspect( filterPaths ) }` );

            const rootPkg = new Package( this.initPathsArgs.workspacePath );
            const workspacePaths = await zWorkspaceGetPackagesPaths( rootPkg );
            const allPackagePaths = workspacePaths.flatMap( i => i.packages ).map( p => {
                const normalized = path.normalize( p );
                return normalized;
            } );

            ConsoleManager.$.log( "config", "filter", `Total packages found: ${ allPackagePaths.length }` );

            const matchedPaths: string[] = [];
            
            for ( const pkgPath of allPackagePaths ) {
                for ( const filterPath of filterPaths ) {
                    // Ensure strict directory matching to prevent partial string matches (e.g., 'packages' matching 'packages-react')
                    const filterPathWithSep = filterPath.endsWith( path.sep ) 
                        ? filterPath 
                        : filterPath + path.sep;
                    
                    const isMatch = pkgPath.startsWith( filterPathWithSep );
                    
                    if ( isMatch ) {
                        ConsoleManager.$.log( "config", "filter", `✓ Matched: ${ pkgPath } (starts with ${ filterPathWithSep })` );
                        matchedPaths.push( pkgPath );
                        break;
                    }
                }
            }

            if ( ! matchedPaths.length ) {
                ConsoleManager.$.error( "config", "filter", `No packages found matching filter: ${ util.inspect( filterValue ) }` );
                // When filter is applied but no matches found, set empty array to prevent fallthrough
                this.initPathsArgs.projectsPaths = [];
                return;
            } else {
                ConsoleManager.$.log( "config", "filter", `Found ${ matchedPaths.length } packages matching filter: ${ util.inspect( matchedPaths ) }` );
                projectsPaths.push( ... matchedPaths );
            }
        }

        if ( projectsPaths.length > 0 ) {
            // Deduplicate
            const uniquePaths = [ ... new Set( projectsPaths ) ];
            ConsoleManager.$.log( "config", "initialize", `Setting projectsPaths to: ${ util.inspect( uniquePaths ) }` );
            this.initPathsArgs.projectsPaths = uniquePaths;
            return;
        }

        // Only fall through to default behavior if no filter was applied
        if ( ! filterWasApplied ) {
            // Determine if the current working directory is a workspace
            if ( this.initPathsArgs.workspacePath === this.initPathsArgs.cwd ) {
                const workspacePaths = await zWorkspaceGetPackagesPaths(
                    new Package( this.initPathsArgs.cwd )
                );

                this.initPathsArgs.projectsPaths = workspacePaths.flatMap( i => i.packages );

                return;
            }
        }

        // If filter was applied but no matches, projectsPaths is already set to empty array above
        // Else... runs on the current working directory
    }

    public showHelp( name: string ) {
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
            },
            "--filter": {
                description: "Filter packages by path",
                examples: [
                    "--filter packages/zenflux-core",
                    "--filter packages/",
                ]
            }
        } ) );
    }

    public async run() {
        if ( ! await super.run( false ) ) {
            return;
        }

        await this.loadConfigs();

        await this.runImpl();
    }

    public async loadConfigs() {
        const configArgIndex = this.args.indexOf( "--config" );

        let configFileName: string | undefined;
        if ( configArgIndex > -1 ) {
            configFileName = this.args[ configArgIndex + 1 ];
        }

        ConsoleManager.$.log( "config", "loadConfigs", `Loading configs for ${ this.paths.projects.length } projects: ${ util.inspect( this.paths.projects ) }` );

        const promises = this.paths.projects.map( async ( projectPath: string ) => {
            const path = zGlobalGetConfigPath( projectPath, configFileName );

            // Silent is true, because we might have packages that don't have a config file.
            // Eg: --filter packages/ -> will include packages/zenflux-cli which doesn't have a config file.
            const config = await zConfigLoad( path, true );

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
}
