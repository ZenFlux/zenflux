/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import * as util from "util";

import fs from "fs";
import path from "path";
import process from "process";

import { CommandBase } from "@zenflux/cli/src/base/command-base";

import { zWorkspaceGetPackages, zWorkspaceGetWorkspaceDependencies } from "@zenflux/cli/src/core/workspace";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import { ConsoleMenuCheckbox } from "@zenflux/cli/src/modules/console/console-menu-checkbox";
import { console } from "@zenflux/cli/src/modules/console";

import { DEFAULT_Z_REGISTRY_URL } from "@zenflux/cli/src/definitions/zenflux";
import { DEFAULT_NPM_RC_PATH, DEFAULT_NPM_REMOTE_REGISTRY_URL } from "@zenflux/cli/src/modules/npm/definitions";

import type { TNewPackageOptions, TPackages } from "@zenflux/cli/src/modules/npm/package";

const localPublishRequirements = [ "publishConfig", "version" ];

export default class Publish extends CommandBase {
    private newPackageOptions: TNewPackageOptions = {
        registryUrl: DEFAULT_NPM_REMOTE_REGISTRY_URL,
        npmRcPath: DEFAULT_NPM_RC_PATH,
    };

    public async run(): Promise<void> {
        const workspacePackage = new Package( this.paths.workspace ),
            packages = zWorkspaceGetPackages( workspacePackage, this.newPackageOptions );

        if ( ! Object.keys( packages ).length ) {
            console.log( "No workspaces found" );
            return;
        }

        // Use local registry?
        if ( fs.existsSync( this.paths.npmRc ) &&
            await console.confirm( `Local registry found: ${ util.inspect( DEFAULT_Z_REGISTRY_URL ) }', Do you want to use local npm registry?` ) ) {

            // Check if local registry is running by fetching the registry url
            try {
                await fetch( DEFAULT_Z_REGISTRY_URL );
            } catch ( e ) {
                console.error( `Local registry is not running, please run: ${ util.inspect( "@z-cli @registry server" ) }` );

                return;
            }

            this.newPackageOptions.registryUrl = DEFAULT_Z_REGISTRY_URL;
            this.newPackageOptions.npmRcPath = this.paths.npmRc;
        }

        console.log( `Used NPM registry: ${ util.inspect( this.newPackageOptions.registryUrl ) }` );

        // Ensure that packages that meet the publishing requirements
        const publishAblePackages = await this.ensurePublishAblePackages( packages );

        if ( ! Object.keys( publishAblePackages ).length ) {
            return console.log( "No publishable packages found" );
        }

        console.log( util.inspect(
            Object.values( publishAblePackages ).map( p => p.getDisplayName() )
        ), "\n" );

        console.log( "Analyzing workspace dependencies\ny" );

        const updatedPackages = await this.ensurePackagesWorkspaceDependencies(
            publishAblePackages,
            packages
        );

        // Create separate copy of packages that should be published.
        const publishPackages = await this.preparePublishPackages( updatedPackages );

        if ( ! publishPackages ) {
            return;
        }

        // Publish packages
        await this.publishPackages( publishPackages );
    }

    private async preparePublishPackages( packages: TPackages ) {
        const result: TPackages = {};

        // Display publish files.
        console.log( "Files that will be published:" );

        for ( const [ , pkg ] of Object.entries( packages ) ) {
            console.log( pkg.getDisplayName() + " =>", await pkg.getPublishFiles() );
        }

        const prepublishPath = path.join( this.paths.etc, "prepublish" );

        // Make directory for files that about to be published
        fs.mkdirSync( prepublishPath, { recursive: true } );

        // Copy files to publish directory
        Object.values( packages ).forEach( ( pkg: Package ) => {
            const prepublishAgentpath = path.join( prepublishPath, pkg.json.name ),
                files = pkg.getPublishFilesCache();

            files.forEach( ( file: string ) => {
                const targetPath = path.join( prepublishAgentpath, file );

                fs.mkdirSync( path.dirname( targetPath ), { recursive: true } );

                fs.copyFileSync( path.join( pkg.getPath(), file ), targetPath );
            } );

            // Save package.json with updated dependencies
            pkg.saveAs( path.join( prepublishAgentpath, "package.json" ) );

            result[ pkg.json.name ] = new Package( prepublishAgentpath, this.newPackageOptions );
        } );

        // Display to user the prepublish directory path and ask if he wants to continue
        if ( ! await console.confirm( `Please review the contents of the 'Prepublish' directory, which can be found at ${ util.inspect( "file://" + prepublishPath ) }, are you ready to proceed?` ) ) {
            return null;
        }

        return result;
    }

    private async publishPackages( packages: TPackages ) {
        const promises = [];

        console.log( `Publishing package: ${ util.inspect( Object.values( packages ).map( pkg => pkg.getDisplayName() ) ) }` );

        for ( const pkg of Object.values( packages ) ) {
            promises.push(
                pkg.publish()
                    .then( () => {
                        console.log( util.inspect( pkg.getDisplayName() ) +  " Package published successfully" );
                    } )
                    .catch( e => {
                        console.error( "Error while publishing => " + ( e.stack ) );
                    } )

            );
        }

        await Promise.all( promises );
    }

    private async ensurePublishAblePackages( packages: TPackages ) {
        const result: TPackages = {},
            restrictedPackages: {
                pkg: Package,
                terms: { [ key: string ]: any }
            }[] = [];

        await Promise.all( Object.values( packages ).map( async ( pkg: Package ) => {
            const json = pkg.json,
                missingRequirements = localPublishRequirements.filter( key => ! json[ key as keyof typeof json ] );

            let isVersionExists = false;

            if ( missingRequirements.length === 0 ) {
                const registry = await pkg.loadRegistry();

                isVersionExists = registry.isExists() && registry.isVersionUsed( json.version as string );

                if ( ! isVersionExists ) {
                    result[ pkg.json.name ] = pkg;

                    return;
                }
            }

            restrictedPackages.push( {
                pkg,
                terms: {
                    missing: missingRequirements,

                    isVersionExists,
                }
            } );
        } ) );

        if ( restrictedPackages.length ) {
            console.log( "Packages that not meet the publish requirements:" );

            restrictedPackages
                .sort( ( a, b ) => a.pkg.json.name.localeCompare( b.pkg.json.name ) )
                .forEach( ( i ) => {
                    console.log( `  - ${ util.inspect( i.pkg.getDisplayName() ) }` );

                    const missing = i.terms.missing;

                    if ( Object.keys( missing ).length ) {
                        console.log( "    - Package missing:", util.inspect( missing, { breakLength: Infinity } ) );
                    } else if ( i.terms.isVersionExists ) {
                        console.log( `    - Package version: ${ util.inspect( i.pkg.json.version ) } already exists` );
                    }
                } );

            process.stdout.write( "\n" );
        }

        const resultValues = Object.values( result );

        if ( Object.keys( resultValues ).length ) {
            console.log( "Packages that meet the publish requirements:" );

            const selectedPackages = await ( new ConsoleMenuCheckbox(
                Object.values( resultValues ).map( ( pkg ) => {
                    return {
                        title: pkg.json.name,
                        checked: true,
                    };
                } )
            ) ).start();

            if ( selectedPackages ) {
                Object.keys( result ).forEach( ( key ) => {
                    // Remove not selected packages
                    if ( ! selectedPackages.find( i => i.title === key ) ) {
                        delete result[ key ];
                    }
                } );

                return result;
            }
        }

        return {};
    }

    private async ensurePackagesWorkspaceDependencies( packages: TPackages, allPackages: TPackages ) {
        async function updateDependency( pkg: Package, dependencyName: string, dependencyValue: string ) {
            const updatedPackagesAndTheirDependencies: {
                    [ packageName: string ]: {
                        [ dependencyName: string ]: {
                            oldVersion: string;
                            newVersion: string;
                        }
                    }
                } = {},
                dependencyPackage = allPackages[ dependencyName ],
                npmRegistry = await dependencyPackage.loadRegistry(),
                isRegistryExists = npmRegistry.isExists(),
                latestVersion = isRegistryExists ? npmRegistry.getLastVersion() : null,
                localVersion = dependencyPackage?.json.version;

            console.log( `  - ${ dependencyName }@${ dependencyValue }` );

            // Print details about the dependency
            console.log( `    - Package in registry (npm): ${ isRegistryExists ? "exists" : "not exists" }` );
            console.log( `    - Latest version (npm): ${ latestVersion ?? "not exists" }` );
            console.log( `    - Local version: ${ localVersion ?? "not exists" }` );

            let selectedVersion: string | null = null;

            // If only local version exists, ask if it should be used as the version for the package.
            if (
                localVersion &&
                await console.confirm( `    - > Do you want to use local version: '${ localVersion }' for ${ util.inspect( dependencyName ) } ?` )
            ) {
                selectedVersion = localVersion;
            }

            if ( null === selectedVersion ) {
                selectedVersion = await console.prompt( `    - > Please type the version you want use for ${ util.inspect( dependencyName ) }` );

                if ( ! selectedVersion.length ) {
                    throw new Error( `Invalid version: ${ util.inspect( selectedVersion ) }` );
                }
            }

            // Update dependency version for current package.
            Object.values( pkg.getDependencies() ).forEach( value => {
                if ( value[ dependencyName ] ) {
                    if ( ! updatedPackagesAndTheirDependencies[ pkg.json.name ] ) {
                        updatedPackagesAndTheirDependencies[ pkg.json.name ] = {};
                    }

                    updatedPackagesAndTheirDependencies[ pkg.json.name ][ dependencyName ] = {
                        oldVersion: value[ dependencyName ],
                        newVersion: selectedVersion as string,
                    };

                    value[ dependencyName ] = selectedVersion as string;
                }
            } );

            return updatedPackagesAndTheirDependencies;
        }

        const result: TPackages = { ... packages },
            // Get packages dependencies that are part of the workspace
            packagesDependencies = zWorkspaceGetWorkspaceDependencies( packages ),
            updatedPackagesAndTheirDependencies: {
                [ packageName: string ]: {
                    [ dependencyName: string ]: {
                        oldVersion: string;
                        newVersion: string;
                    }
                }
            } = {};

        // Print packages and their dependencies
        for ( const [ , { pkg, dependencies } ] of Object.entries( packagesDependencies ) ) {
            console.log( util.inspect( pkg.getDisplayName() ) );

            const dependenciesEntries = Object.entries( dependencies || {} );

            if ( ! dependenciesEntries.length ) {
                console.log( "  - No workspace dependencies" );
                process.stdout.write( "\n" );
                continue;
            }

            for ( const [ dependencyName, dependencyValue ] of dependenciesEntries ) {
                Object.assign(
                    updatedPackagesAndTheirDependencies,
                    await updateDependency( pkg, dependencyName, dependencyValue )
                );
            }
        }

        // Print updated packages and their dependencies
        console.log( "Updated packages and their workspace dependencies:" );

        Object.entries( updatedPackagesAndTheirDependencies ).forEach( ( [ packageName, dependencies ] ) => {
            console.log( util.inspect( packageName ) );

            Object.entries( dependencies ).forEach( ( [ dependencyName, dependencyValue ] ) => {
                console.log( `  -  '${ dependencyName }@${ dependencyValue.oldVersion }' => '${ dependencyName }@${ dependencyValue.newVersion }'` );
            } );
        } );

        return result;
    }
}
