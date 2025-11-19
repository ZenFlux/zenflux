/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import * as util from "util";

import fs from "fs";
import path from "path";
import process from "process";
import semver from "semver";

import { ConsoleMenu } from "@zenflux/cli/src/modules/console";

import { zRegistryGetAllOnlineNpmRcs } from "@zenflux/cli/src/core/registry";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { CommandBase } from "@zenflux/cli/src/base/command-base";

import { zWorkspaceGetPackages, zWorkspaceGetWorkspaceDependencies } from "@zenflux/cli/src/core/workspace";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import { ConsoleMenuCheckbox } from "@zenflux/cli/src/modules/console/console-menu-checkbox";

import { DEFAULT_NPM_RC_PATH, DEFAULT_NPM_REMOTE_REGISTRY_URL } from "@zenflux/cli/src/modules/npm/definitions";

import type { TNewPackageOptions, TPackages } from "@zenflux/cli/src/modules/npm/package";

const localPublishRequirements = [ "publishConfig", "version" ];

type PublishPackageMeta = {
    needsVersionBump: boolean;
    statusLabel: string;
};

export default class Publish extends CommandBase {
    private newPackageOptions: TNewPackageOptions = {
        registryUrl: DEFAULT_NPM_REMOTE_REGISTRY_URL,
        npmRcPath: DEFAULT_NPM_RC_PATH,
    };

    private publishPackagesMeta: Map<string, PublishPackageMeta> = new Map();

    public async runImpl(): Promise<void> {
        const workspacePackage = new Package( this.paths.workspace ),
            packages = await zWorkspaceGetPackages( workspacePackage, this.newPackageOptions );

        if ( ! Object.keys( packages ).length ) {
            ConsoleManager.$.log( "No workspaces found" );
            return;
        }

        const activeRegistries = await zRegistryGetAllOnlineNpmRcs();

        // Use local registry?
        if ( activeRegistries.length &&
            await ConsoleManager.$.confirm( `There are ${ util.inspect( activeRegistries.length ) } active registries, do you want to use one of them?` ) ) {

            const menu = new ConsoleMenu( activeRegistries.map( r => ( {
                title: `id: ${ r.id }, url: ${ r.url }, path: ${ r.path }`,
            } ) ) );

            const selected = await menu.start();

            if ( ! selected ) {
                return ConsoleManager.$.log( "No registry selected" );
            }

            const selectedRegistry = activeRegistries[ selected.index ];

            this.newPackageOptions.registryUrl = selectedRegistry.url;
            this.newPackageOptions.npmRcPath = selectedRegistry.path;
        }

        ConsoleManager.$.log( `Used NPM registry: ${ util.inspect( this.newPackageOptions.registryUrl ) }` );

        // Ensure that packages that meet the publishing requirements
        const publishAblePackages = await this.ensurePublishAblePackages( packages );

        if ( ! Object.keys( publishAblePackages ).length ) {
            return ConsoleManager.$.log( "No publishable packages found" );
        }

        await this.autoIncrementPackageVersions( publishAblePackages );

        ConsoleManager.$.log( util.inspect(
            Object.values( publishAblePackages ).map( p => p.getDisplayName() )
        ), "\n" );

        ConsoleManager.$.log( "Analyzing workspace dependencies\ny" );

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
        ConsoleManager.$.log( "Files that will be published:" );

        for ( const [ , pkg ] of Object.entries( packages ) ) {
            ConsoleManager.$.log( pkg.getDisplayName() + " =>", await pkg.getPublishFiles() );
        }

        const prepublishPath = path.join( this.paths.workspaceEtc, "prepublish" );

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
        if ( ! await ConsoleManager.$.confirm( `Please review the contents of the 'Prepublish' directory, which can be found at ${ util.inspect( "file://" + prepublishPath ) }, are you ready to proceed?` ) ) {
            return null;
        }

        return result;
    }

    private async publishPackages( packages: TPackages ) {
        const promises = [];

        ConsoleManager.$.log( `Publishing package: ${ util.inspect( Object.values( packages ).map( pkg => pkg.getDisplayName() ) ) }` );

        for ( const pkg of Object.values( packages ) ) {
            promises.push( pkg.publish()
                    .then( () => ConsoleManager.$.log( util.inspect( pkg.getDisplayName() ) + " Package published successfully" ) )
                    .catch( e => ConsoleManager.$.error( "Error while publishing => " + ( e.stack ) ) )
            );
        }

        await Promise.all( promises );
    }

    private async ensurePublishAblePackages( packages: TPackages ) {
        const eligiblePackages: TPackages = {},
            restrictedPackages: {
                pkg: Package,
                terms: { [ key: string ]: any }
            }[] = [];

        this.publishPackagesMeta.clear();

        await Promise.all( Object.values( packages ).map( async ( pkg: Package ) => {
            const json = pkg.json,
                missingRequirements = localPublishRequirements.filter( key => ! json[ key as keyof typeof json ] );

            if ( missingRequirements.length ) {
                restrictedPackages.push( {
                    pkg,
                    terms: {
                        missing: missingRequirements,
                        isVersionExists: false,
                    }
                } );

                return;
            }

            const registry = await pkg.loadRegistry(),
                isVersionExists = registry.isExists() && registry.isVersionUsed( json.version as string ),
                statusLabel = registry.isExists() ?
                    ( isVersionExists ? "version already published – will auto increment" : "ready" ) :
                    "not published yet";

            eligiblePackages[ pkg.json.name ] = pkg;

            this.publishPackagesMeta.set( pkg.json.name, {
                needsVersionBump: Boolean( isVersionExists ),
                statusLabel,
            } );
        } ) );

        if ( restrictedPackages.length ) {
            ConsoleManager.$.log( "Packages that not meet the publish requirements:" );

            restrictedPackages
                .sort( ( a, b ) => a.pkg.json.name.localeCompare( b.pkg.json.name ) )
                .forEach( ( i ) => {
                    ConsoleManager.$.log( `  - ${ util.inspect( i.pkg.getDisplayName() ) }` );

                    const missing = i.terms.missing;

                    if ( Object.keys( missing ).length ) {
                        ConsoleManager.$.log( "    - Package missing:", util.inspect( missing, { breakLength: Infinity } ) );
                    } else if ( i.terms.isVersionExists ) {
                        ConsoleManager.$.log( `    - Package version: ${ util.inspect( i.pkg.json.version ) } already exists` );
                    }
                } );

            process.stdout.write( "\n" );
        }

        const eligibleList = Object.values( eligiblePackages )
            .sort( ( a, b ) => a.json.name.localeCompare( b.json.name ) );

        if ( ! eligibleList.length ) {
            return {};
        }

        ConsoleManager.$.log( "Packages that meet the publish requirements:" );

        const selectedPackages = await ( new ConsoleMenuCheckbox(
            eligibleList.map( ( pkg ) => {
                const meta = this.publishPackagesMeta.get( pkg.json.name );

                return {
                    title: `${ pkg.getDisplayName() } (${ meta?.statusLabel ?? "ready" })`,
                    value: pkg.json.name,
                    checked: true,
                };
            } ),
            {
                headMessage: "Select the packages you want to publish",
            }
        ) ).start();

        if ( selectedPackages?.length ) {
            const result: TPackages = {};

            selectedPackages.forEach( ( item ) => {
                const pkgName = item?.value;

                if ( pkgName && eligiblePackages[ pkgName ] ) {
                    result[ pkgName ] = eligiblePackages[ pkgName ];
                }
            } );

            return result;
        }

        ConsoleManager.$.log( "No packages selected" );

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

            ConsoleManager.$.log( `  - ${ dependencyName }@${ dependencyValue }` );

            // Print details about the dependency
            ConsoleManager.$.log( `    - Package in registry (npm): ${ isRegistryExists ? "exists" : "not exists" }` );
            ConsoleManager.$.log( `    - Latest version (npm): ${ latestVersion ?? "not exists" }` );
            ConsoleManager.$.log( `    - Local version: ${ localVersion ?? "not exists" }` );

            let selectedVersion: string | null = null;

            // If only local version exists, ask if it should be used as the version for the package.
            if (
                localVersion &&
                await ConsoleManager.$.confirm( `    - > Do you want to use local version: '${ localVersion }' for ${ util.inspect( dependencyName ) } ?` )
            ) {
                selectedVersion = localVersion;
            }

            if ( null === selectedVersion ) {
                selectedVersion = await ConsoleManager.$.prompt( `    - > Please type the version you want use for ${ util.inspect( dependencyName ) }` );

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
            ConsoleManager.$.log( util.inspect( pkg.getDisplayName() ) );

            const dependenciesEntries = Object.entries( dependencies || {} );

            if ( ! dependenciesEntries.length ) {
                ConsoleManager.$.log( "  - No workspace dependencies" );
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
        ConsoleManager.$.log( "Updated packages and their workspace dependencies:" );

        Object.entries( updatedPackagesAndTheirDependencies ).forEach( ( [ packageName, dependencies ] ) => {
            ConsoleManager.$.log( util.inspect( packageName ) );

            Object.entries( dependencies ).forEach( ( [ dependencyName, dependencyValue ] ) => {
                ConsoleManager.$.log( `  -  '${ dependencyName }@${ dependencyValue.oldVersion }' => '${ dependencyName }@${ dependencyValue.newVersion }'` );
            } );
        } );

        return result;
    }

    private async autoIncrementPackageVersions( packages: TPackages ) {
        let bumpedPackages = 0;

        for ( const pkg of Object.values( packages ) ) {
            const currentVersion = pkg.json.version;

            if ( ! currentVersion ) {
                ConsoleManager.$.warn( `Skipping version bump for ${ pkg.json.name } because it has no version defined.` );
                continue;
            }

            const meta = this.publishPackagesMeta.get( pkg.json.name );

            if ( ! meta?.needsVersionBump ) {
                continue;
            }

            const registry = await pkg.loadRegistry();
            const remoteLatest = registry.isExists() ? registry.getLastVersion() : null;

            const baseVersion = remoteLatest && semver.gt( remoteLatest, currentVersion ) ? remoteLatest : currentVersion;
            let nextVersion = semver.inc( baseVersion, "patch" );

            if ( ! nextVersion ) {
                throw new Error( `Failed to increment version for ${ pkg.json.name } starting from ${ baseVersion }` );
            }

            while ( registry.isExists() && registry.isVersionUsed( nextVersion ) ) {
                const candidate = semver.inc( nextVersion, "patch" );

                if ( ! candidate ) {
                    throw new Error( `Unable to find available version for ${ pkg.json.name }` );
                }

                nextVersion = candidate;
            }

            pkg.json.version = nextVersion;
            pkg.saveAs( path.join( pkg.getPath(), "package.json" ) );

            ConsoleManager.$.log( `${ pkg.json.name }: auto incremented ${ currentVersion } -> ${ nextVersion }` );
            bumpedPackages++;
        }

        if ( ! bumpedPackages ) {
            ConsoleManager.$.log( "Selected packages already use unpublished versions – skipping automatic version bumps." );
        }
    }
}
