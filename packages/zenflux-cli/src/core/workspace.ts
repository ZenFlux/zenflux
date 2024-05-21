/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import util from "node:util";

import { getMatchingPathsRecursive } from "@zenflux/typescript-vm/utils";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import type { TNewPackageOptions, TPackageDependencies, TPackages } from "@zenflux/cli/src/modules/npm/package";

export type TWorkspace = {
    workspace: string;
    packages: string[]
};

const zWorkspaceFindRootPackageJsonCache: {
    [ packagePath: string ]: string
} = {};

export function zWorkspaceFindRootPackageJson( options: {
    silent?: boolean
    useCache?: boolean
} = {} ) {
    const { silent = false, useCache = true } = options;

    let currentPath = process.env[ "npm_package_json" ] ?
        path.dirname( process.env[ "npm_package_json" ] ) : process.cwd();

    if ( useCache && zWorkspaceFindRootPackageJsonCache[ currentPath ] ) {
        return zWorkspaceFindRootPackageJsonCache[ currentPath ];
    }

    do {
        const packageJsonPath = path.join( currentPath, "package.json" );

        // Check if package.json exists & has workspaces key
        if ( fs.existsSync( packageJsonPath ) ) {
            const packageJson = JSON.parse( fs.readFileSync( packageJsonPath, "utf8" ) );

            if ( packageJson.workspaces ) {

                if ( useCache ) {
                    zWorkspaceFindRootPackageJsonCache[ currentPath ] = packageJsonPath;
                }

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

export function zWorkspaceExtractPackages( regex: string, rootPkg: Package, packages: TPackages ) {
    const result: TPackages = {};

    const regexPattern = new RegExp( regex );

    Object.keys( packages ).forEach( ( key ) => {
        const packageName = packages[ key ] ? key : `${ rootPkg.json.name.split( "/" )[ 0 ] }/${ key }`;

        if ( regexPattern.test( packageName ) ) {
            if ( packages[ packageName ] ) {
                result[ packageName ] = packages[ packageName ];
            }
        }
    } );

    return result;
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

const zWorkspaceFindPackagesCache: {
    [ packagePath: string ]: {
        [ packageName: string ]: Package
    }
} = {};

export function zWorkspaceFindPackages(
    names: string[],
    workspacePath = path.dirname( zWorkspaceFindRootPackageJson( { silent: true } ) ),
    options: {
        silent?: boolean
        useCache?: boolean
    } = {},
) {
    const result: TPackages = {};

    const { silent = false, useCache = true } = options;

    if ( useCache && zWorkspaceFindPackagesCache[ workspacePath ] ) {
        const fromCache = Object.entries( zWorkspaceFindPackagesCache[ workspacePath ] );

        if ( fromCache.length === names.length && fromCache.every( ( [ key ] ) => names.includes( key ) ) ) {
            return zWorkspaceFindPackagesCache[ workspacePath ];
        }

        Object.entries( zWorkspaceFindPackagesCache[ workspacePath ] ).forEach( ( [ key, value ] ) => {
            if ( names.includes( key ) ) {
                result[ key ] = value;
            }
        } );

        if ( names.every( ( name ) => result[ name ] ) ) {
            return result;
        }
    }

    // Exclude names that already found
    names = names.filter( ( name ) => ! result[ name ] );

    const rootPkg = new Package( workspacePath ),
        packages = zWorkspaceGetPackages( rootPkg );

    names.forEach( ( name ) => {
        const currentPackages = zWorkspaceExtractPackages( name, rootPkg, packages );

        if ( ! currentPackages ) {
            if ( ! silent ) {
                throw new Error( `Workspace package(s) '${ name }' not found` );
            }

            return;
        }

        Object.values( currentPackages ).forEach( ( pkg ) => {
            result[ pkg.json.name ] = pkg;
        } );
    } );

    Object.assign( zWorkspaceFindPackagesCache[ workspacePath ] ??= {}, result );

    return result;
}

const zWorkspaceGetPackagesCache: {
    [ packagePath: string ]: TPackages
} = {};

export function zWorkspaceGetPackages( rootPkg: Package | "auto", newPackageOptions?: TNewPackageOptions, options = { useCache: true } ): TPackages {
    if ( rootPkg === "auto" ) {
        rootPkg = new Package( path.dirname( zWorkspaceFindRootPackageJson() ) );
    }

    if ( options.useCache && zWorkspaceGetPackagesCache[ rootPkg.getPath() ] ) {
        return zWorkspaceGetPackagesCache[ rootPkg.getPath() ];
    }

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

const zWorkspaceGetPackagesPathsCache: {
    [ packagePath: string ]: TWorkspace[]
} = {};

export function zWorkspaceGetPackagesPaths( rootPkg: Package, options = { useCache: true } ): TWorkspace[] {
    // Check if package contains `workspaces` property
    if ( ! rootPkg.json.workspaces?.length ) {
        return [];
    }

    if ( options.useCache && zWorkspaceGetPackagesPathsCache[ rootPkg.getPath() ] ) {
        return zWorkspaceGetPackagesPathsCache[ rootPkg.getPath() ];
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

    ConsoleManager.$.debug(
        () => [
            "workspace",
            zWorkspaceGetPackagesPaths.name,
            `workspaces from package: ${ util.inspect( rootPkg.getPath() ) }`,
            util.inspect(
            {
                workspaces: rootPkg.json.workspaces,
                paths: Object.values( result.map( ( i ) => i.packages ).flat() ),
            }
        ) ]
    );

    zWorkspaceGetPackagesPathsCache[ rootPkg.getPath() ] = result;

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
