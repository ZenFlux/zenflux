/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import util from "node:util";

import { console } from "@zenflux/cli/src/modules/console";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import { getMatchingPathsRecursive } from "@zenflux/cli/src/utils/path";

import type { TNewPackageOptions, TPackageDependencies, TPackages } from "@zenflux/cli/src/modules/npm/package";

export type TWorkspace = {
    workspace: string;
    packages: string[]
};

export function zWorkspaceFindRootPackageJson( silent = false ) {
    let currentPath = process.env[ "npm_package_json" ] ? path.dirname( process.env[ "npm_package_json" ] ) : process.cwd();

    do {
        const packageJsonPath = path.join( currentPath, "package.json" );

        // Check if package.json exists & has workspaces key
        if ( fs.existsSync( packageJsonPath ) ) {
            const packageJson = JSON.parse( fs.readFileSync( packageJsonPath, "utf8" ) );

            if ( packageJson.workspaces ) {
                return packageJsonPath;
            }
        }

        currentPath = path.resolve( currentPath, ".." );
    } while ( currentPath !== "/" );

    if ( ! silent ) {
        throw new Error( "Workspace root package.json not found" );
    }

    return "";
}

export function zWorkspaceExtractPackage( name: string, rootPkg: Package, packages: TPackages ) {
    name = name.trim();
    // eg: root package name is "@zenflux/zenflux".
    // if searching for "cli" package, it will return "@zenflux/zenflux-cli".
    // if searching for "zenflux/cli" package, it will return "@zenflux/zenflux-cli".
    const packageName = packages[ name ] ? name : `${ rootPkg.json.name.split( "/" )[ 0 ] }/${ name }`;

    if ( packages[ packageName ] ) {
        return packages[ packageName ];
    }
}

export function zWorkspaceFindPackages( names: string[], workspacePath = path.dirname( zWorkspaceFindRootPackageJson( true ) ), silent = false ) {
    const rootPkg = new Package( workspacePath ),
        packages = zWorkspaceGetPackages( rootPkg ),
        result: TPackages = {};

    names.forEach( ( name ) => {
        const currentPackage = zWorkspaceExtractPackage( name, rootPkg, packages );

        if ( ! currentPackage ) {
            if ( ! silent ) {
                throw new Error( `Workspace package '${ name }' not found` );
            }

            return;
        }

        if ( packages[ currentPackage.json.name ] ) {
            result[ currentPackage.json.name ] = packages[ currentPackage.json.name ];
        }
    } );

    return result;
}

export function zWorkspaceGetPackages( rootPkg: Package, newPackageOptions?: TNewPackageOptions ): TPackages {
    const packages: TPackages = {};

    zWorkspaceGetPackagesPaths( rootPkg ).forEach( ( workspace: TWorkspace ) => {
        workspace.packages.forEach( ( packagePath: string ) => {
            const pkg = new Package( packagePath, newPackageOptions );

            // Copy values from package.json to package object
            packages[ pkg.json.name ] = pkg;
        } );
    } );

    return packages;
}

export function zWorkspaceGetPackagesPaths( rootPkg: Package ): TWorkspace[] {
    // Check if package contains `workspaces` property
    if ( ! rootPkg.json.workspaces?.length ) {
        return [];
    }

    const result = ( rootPkg.json.workspaces ).map( ( workspace: string ) => {
        const workspaces = getMatchingPathsRecursive( rootPkg.getPath(), new RegExp( workspace ) );

        // Filter packages that contains package.json
        const packages = workspaces.filter( ( workspace: string ) => {
            const files = fs.readdirSync( workspace );

            return files.find( ( file: string ) => file.endsWith( "package.json" ) );
        } );

        return {
            workspace,
            packages,
        };
    } );

    console.verbose( () => [ `${ zWorkspaceGetPackagesPaths.name }() -> workspaces from package: ${ util.inspect( rootPkg.getPath() ) }`, util.inspect(
        {
            workspaces: rootPkg.json.workspaces,
            paths: Object.values( result.map( ( i ) => i.packages ).flat() ),
        }
    ) ] );

    return result;
}

/**
 * Get packages dependencies that are part of the workspace
 */
export function zWorkspaceGetWorkspaceDependencies( packages: TPackages ) {
    const packagesDependencies: {
        [ packageName: string ]: {
            pkg: Package,
            dependencies: TPackageDependencies,
        }
    } = {};

    // Filter dependencies that include "workspace:" prefix
    Object.values( packages ).forEach( ( pkg ) => {
        const workspaceDependencies: TPackageDependencies = {};

        Object.values( pkg.getDependencies() ).forEach( dependencies => {
            Object.entries( dependencies ).forEach( ( [ key, value ] ) => {
                if ( value.startsWith( "workspace:" ) ) {
                    workspaceDependencies[ key ] = value;
                }
            } );
        } );

        packagesDependencies[ pkg.json.name ] = { pkg, dependencies: workspaceDependencies };
    } );

    return packagesDependencies;
}
