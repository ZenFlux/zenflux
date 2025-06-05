/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";

import { zFindRootPackageJsonPath } from "@zenflux/utils/src/workspace";
import { zGetMatchingPathsRecursive } from "@zenflux/utils/src/path";

globalThis.__Z_ESLINT_CONFIG__ = globalThis.__Z_ESLINT_CONFIG__ ?? {
    zRootPackagePath: zFindRootPackageJsonPath(),
    zPackagePath: path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), "./package.json" ),
    zCache: {
        zWorkspaces: {}
    }
};

globalThis.__Z_ESLINT_CONFIG__.zCache.zWorkspaces [ globalThis.__Z_ESLINT_CONFIG__.zRootPackagePath ] = zLintGetWorkspaces();

const { zLintDefaultConfig, zLintDefaultExclude } = ( await import( "./default-config.js" ) );

/**
 * Sets the root package path.
 *
 * @param {string} zRootPackagePath - The path to the workspace `package.json`.
 * @return {void}
 */
export function zLintSetRootPackagePath( zRootPackagePath ) {
    globalThis.__Z_ESLINT_CONFIG__.zRootPackagePath = zRootPackagePath;
}

/**
 * Retrieves the workspaces from the provided workspace path.
 *
 * @param {string} [rootPkgPath] - The path to the root package.
 * @return {Array<string>} - An array containing the retrieved workspaces.
 */
export function zLintGetWorkspaces( rootPkgPath = __Z_ESLINT_CONFIG__.zRootPackagePath ) {
    // If in cache, use it.
    if ( globalThis.__Z_ESLINT_CONFIG__.zCache.zWorkspaces[ rootPkgPath ] ) {
        return globalThis.__Z_ESLINT_CONFIG__.zCache.zWorkspaces[ rootPkgPath ];
    }

    const result = Object.values(
        JSON.parse( fs.readFileSync( rootPkgPath ).toString() ).workspaces
    );

    globalThis.__Z_ESLINT_CONFIG__.zCache.zWorkspaces[ rootPkgPath ] = result;

    return result;
}

/**
 * Generates base configuration for ZenFlux ESLint.
 *
 * @param {import("@zenflux/eslint").ZESLintDefaultOptions} [options]
 *
 * @returns {import("eslint").Linter.Config[]}
 */
export function zLintGetBaseConfig( options ) {
    /**
     * Retrieves a list of file paths from given workspace directories.
     *
     * @param {Array<string>} workspaces - An array of workspace directory paths.
     * @return {Array<string>} A flattened array of file paths, expanding the file patterns for each workspace.
     */
    function getWorkspaceFiles( workspaces ) {
        return workspaces.flatMap( workspace => options?.files ?? [ "**/*.{ts,tsx}" ].map(
            file => `${ ( workspace.startsWith( "." ) ?
                workspace.substring( 1 ) :
                workspace + "/" )
            }${ file }`
        ) );
    }

    const workspaces = options?.workspaces ?? zLintGetWorkspaces(),
        shouldExcludeFiles = options?.excludeFiles ?? false;

    const files = shouldExcludeFiles ? [] : getWorkspaceFiles( workspaces );

    return zLintDefaultConfig( files, workspaces );
}

/**
 * Generates configuration for ZenFlux ESLint.
 *
 * @param {import("@zenflux/eslint").ZESLintDefaultOptions} [options]
 *
 * @returns {Promise<import("eslint").Linter.Config[]>}
 */
export async function zLintGetConfig( options ) {
    const workspaces = options?.workspaces ?? zLintGetWorkspaces(),
        baseConfig = zLintGetBaseConfig( {
            ...options,
            workspaces,
        } );


    const shouldExcludeChildren =  options?.excludeProjectsWithConfig ?? true,
        childrenConfigPaths = shouldExcludeChildren ? await zLintGetProjectsPathsWithConfig( workspaces ) : [];

    baseConfig.push( {
        ignores: zLintDefaultExclude( childrenConfigPaths )
    } );

    return baseConfig;
}

/**
 * Finds and returns the paths to projects within the provided workspaces that have ESLint configuration files.
 *
 * @param {Array<string>} workspaces - An array of workspace paths that may contain project directories. Supports wildcard '*' character in paths.
 * @return {Promise<Array<string>>} A promise that resolves to an array of project paths containing ESLint configuration files.
 */
export async function zLintGetProjectsPathsWithConfig( workspaces ) {
    const projectsESLintPath = [];

    await Promise.all( workspaces.map( async ( workspace ) => {
        const regexPattern = new RegExp(
            workspace.replace( "*", ".*" ) + "/(.eslintrc|.eslintrc.js|.eslintrc.json|.eslintrc.yaml|.eslintrc.yml|eslint.config.js)"
        );
        const paths = await zGetMatchingPathsRecursive(
            path.dirname( __Z_ESLINT_CONFIG__.zRootPackagePath ),
            regexPattern,
            3, {
                ignoreStartsWith: [ ".", "#" ]
            }
        );

        paths.forEach( ( p ) => projectsESLintPath.push( path.dirname( p ) ) );
    } ) );

    return projectsESLintPath;
}

export * from './default-config.js'
