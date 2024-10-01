import fs from "node:fs";
import inspector from "node:inspector";

import path from "node:path";
import process from "node:process";

import { fileURLToPath } from "node:url";

import { normalize } from "jest-config";

import { zFindRootPackageJsonPath } from "@zenflux/utils/src/workspace";

import { Package } from "@zenflux/cli/src/modules/npm/package";
import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { zWorkspaceGetPackages } from "@zenflux/cli/src/core/workspace";

import { runCLI } from "@jest/core";

import type { Config } from "@jest/types";
import type { DZJestProjectConfigInterface } from "@zenflux/jest/definitions";

if ( process.argv.includes( "--help" ) || process.argv.includes( "-h" ) ) {
    ConsoleManager.$.log( "Use jest --help" );
    process.exit( 0 );
}

const currentDirPath = path.dirname( fileURLToPath( import.meta.url ) );

const rootPkg = new Package( path.dirname( zFindRootPackageJsonPath() ) );

/**
 * Function `addSelectedProjects()` - Function is responsible for extracting selected projects from the command line.
 *
 * It checks if the `--selectedProjects` flag is present in `process.argv`, the array of command-line arguments
 * passed upon the startup of the Node.js process. If the flag is found, it retrieves the subsequent argument
 * which should contain a comma-separated string of project names.
 *
 * In case the argument is missing, it logs a usage message using the `ConsoleManager` and then terminates the
 * process with an exit code of 1.
 *
 * Otherwise, it processes the comma-separated list, trims any whitespace from project names, and
 * appends them to the provided `target` array.
 *
 * It also removes the flag and its associated value from
 * `process.argv`, ensuring they are no longer processed by any other part of the application.
 **/
function addSelectedProjects( target: string[] ) {
    if ( process.argv.includes( "--selectedProjects" ) ) {
        const selectedProjectsKey = process.argv.indexOf( "--selectedProjects" );
        const selectedProjects = process.argv[ selectedProjectsKey + 1 ];

        if ( ! selectedProjects ) {
            ConsoleManager.$.log( "Use @z-jest --selectedProjects <project1, project2>" );
            process.exit( 1 );
        }

        // Remove both key and value
        process.argv.splice( selectedProjectsKey, 2 );

        selectedProjects.split( "," ).forEach(
            ( p ) => target.push( p.trim() )
        );
    }
}

/**
 * Function `addProjectsByPath()` - This method is responsible for retrieving and processing project information
 * based ona specified path.
 *
 * It checks the command-line arguments for the presence of the "--runTestsByPath" flag and, if found,
 * determines the associated path. If the path is specified, it uses the `zWorkspaceGetPackages()` to fetch
 * all workspace packages and finds the one that matches the path.
 *
 * If a matching package is found, its name is added to the target array.
 *
 * If the path argument is missing, it logs a message with usage instructions through `ConsoleManager`
 * and exits the process with a status code of 1, effectively stopping further executions.
 **/
async function addProjectsByPath( target: string[] ) {
    if ( process.argv.includes( "--runTestsByPath" ) ) {
        const runTestsByPathKey = process.argv.indexOf( "--runTestsByPath" );
        const runTestsByPath = process.argv[ runTestsByPathKey + 1 ];

        if ( ! runTestsByPath ) {
            ConsoleManager.$.log( "Use @z-jest --runTestsByPath <path>" );
            process.exit( 1 );
        }

        const packages = await zWorkspaceGetPackages( rootPkg );

        const matched = Object.values( packages ).find( ( pkg ) => {
            return runTestsByPath.includes( pkg.getPath() );
        } );

        if ( matched ) {
            target.push( matched.json.name );
        }
    }
}

/**
 * Function `getProjectsConfig()` - Retrieve configurations for projects
 * The `getProjectsConfig` function retrieves project configurations by leveraging the `zWorkspaceGetPackages` method,
 * which fetches package information based on the specified root package. After obtaining the packages, the function
 * filters them to include only those matching the provided `filterProjects` criteria and those containing
 * the `jest.config.ts` file.
 *
 * For each filtered package, it dynamically imports the Jest configuration and returns
 * an array of objects containing the package details, configuration, and configuration path.
 **/
async function getProjectsConfig(): Promise<DZJestProjectConfigInterface[]> {
    const packages = await zWorkspaceGetPackages( rootPkg );

    return await Promise.all( Object.values( packages )
        .filter( ( pkg ) => {
            if ( selectedProjects.length > 0 ) {
                const match = selectedProjects.find( ( p ) => {
                    const regex = new RegExp( p );

                    return regex.test( pkg.json.name );
                } );

                if ( ! match ) {
                    return false;
                }
            }

            return fs.existsSync( pkg.getPath() + "/jest.config.ts" );
        } )
        .map( async ( pkg ) => {
            const configPath = pkg.getPath() + "/jest.config.ts";
            return import( configPath ).then( p => {
                return {
                    pkg,
                    config: p.default,
                    configPath,
                };
            } );
        } ) );
}

/**
 * Function `updateJestProjectsConfig` - Updates project configurations
 * The method iterates over each project in the `projects` array and modifies their Jest configuration settings.
 *
 * It ensures that each project's configuration has a defined `setupFiles` array by either creating a new empty array
 * if it does not exist or using the existing one.
 *
 * It then prepends a local setup file, located at "setup.js" in the current directory, to this array.
 *
 * In addition, the method sets the `displayName` of the project to the value returned by `getDisplayName()`
 * method of the project's `pkg` object if `displayName` is not already defined.
 *
 * Furthermore, it ensures that the `testRegex` property is set to the `normalized.testRegex` value if `testRegex`
 * is not already present in the project's configuration and returns the updated configuration.
 **/
function updateJestProjectsConfig( projects: DZJestProjectConfigInterface[] ): ( Config.ProjectConfig | Config.InitialOptions )[] {
    return projects.map( ( p => {
        if ( ! p.config.setupFiles ) {
            p.config.setupFiles = [];
        }

        // Insert local setup files before the project setup files
        p.config.setupFiles.unshift( path.join( currentDirPath, "setup.js" ) );

        if ( ! p.config.displayName ) {
            p.config.displayName = p.pkg.getDisplayName();
        }

        if ( ! p.config.testRegex && p.normalized?.testRegex ) {
            p.config.testRegex = p.normalized.testRegex;
        }

        return p.config;
    } ) );
}

/**
 * Function `addCurrentPackageIfAny()` - Function attempts to add the current package to the target
 * list if no other packages are specified in the list.
 *
 * This function first checks if the `target` array is empty.
 *
 * If it is, it proceeds to get all the workspace packages by calling the `zWorkspaceGetPackages` function.
 *
 * Then, it tries to read and parse the current `package.json` file to extract the package's name.
 *
 * If the parsing is successful and the package name exists in the list of workspace packages,
 * it adds this package name to the `target` list.
 *
 * This functionality ensures that when no specific packages are given, the system can utilize the package
 * from the current context if it is part of the workspace.
 **/
async function addCurrentPackageIfAny( target: string [] ) {
// If `selectedProjects` is empty, then try lookup running from specific package.
    if ( ! target.length ) {
        // Get all workspaces(packages).
        const workspaces = await zWorkspaceGetPackages( rootPkg );

        let packageJSON: { name: string; };
        // Try load current `package.json`
        try {
            packageJSON = JSON.parse( fs.readFileSync( process.env[ "npm_package_json" ], "utf-8" ) );
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch ( e ) {
            // Silence
        }

        // Check if `packageJSON.name` is in workspaces.
        if ( packageJSON && packageJSON.name && workspaces[ packageJSON.name ] ) {
            target.push( packageJSON.name );
        }
    }
}
const selectedProjects: string[] = [];

addSelectedProjects( selectedProjects );

await addProjectsByPath( selectedProjects );

await addCurrentPackageIfAny( selectedProjects );

// Initial config
const rootConfig: Config.InitialOptions = {
    testRegex: "(/test/.*\\.test\\.(js|cjs))$",

    verbose: true,

    // Detect debug mode...
    cache: ! inspector.url(),
    testTimeout: inspector.url() ? 30000 : 5000,

    rootDir: rootPkg.getPath(),
};

const initialArgv: Config.Argv = {
    $0: process.argv[ 1 ],
    _: [],
};

const nonValueArgs = [
    "--runTestsByPath"
];

let skipFlag = false;

for ( const arg of process.argv.slice( 2 ) ) {
    if ( skipFlag || nonValueArgs.includes( arg ) ) {
        skipFlag = false;
        continue;
    }

    let nextArg = process.argv.indexOf( arg ) + 1;

    // Transform `process.argv` to `jestConfig` format generically like yargs
    if ( arg.startsWith( "--" ) ) {
        // If next arg is not a flag and it's a value
        if ( process.argv[ nextArg ] && ! process.argv[ nextArg ].startsWith( "-" ) ) {
            initialArgv[ arg.slice( 2 ) ] = process.argv[ nextArg ];

            // Skip next arg
            skipFlag = true;

            continue;
        }

        const [ key, value ] = arg.slice( 2 ).split( "=" );

        initialArgv[ key ] = value || true;
    } else if ( arg.startsWith( "-" ) ) {
        const [ key, value ] = arg.slice( 1 ).split( "=" );
        initialArgv[ key ] = value;
    } else {
        initialArgv._.push( arg );
    }
}

const originalWarn = ConsoleManager.$.warn;

let didCatch = false;

const projects = await Promise.all( await getProjectsConfig() );

// Pre validate
const normalizers = projects.map( async ( project, index ) => {
    const configPath = project.configPath;

    project.config.rootDir = project.pkg.getPath();

    // Since jest does not give simple flexibility without adding custom code,
    ConsoleManager.$.warn = ( ... args ) => {
        args.push( "\n" + "cause: file://" + configPath + "\n" );
        ConsoleManager.$.error( ... args );
    };

    const promise = normalize(
        rootConfig,
        initialArgv,
        configPath, // Jest not favoring this path
        index,
    );

    promise.catch( ( error ) => {
        didCatch = true;
        ConsoleManager.$.error( error.message, "\n" +
            "cause: file://" + configPath + "\n"
        );
    } );

    await promise.then( ( normalized ) => {
        project.normalized = normalized.options;
    } );
} );

await Promise.all( normalizers ).catch( () => {
    didCatch = true;
} );

ConsoleManager.$.warn = originalWarn;

let jestProjects = updateJestProjectsConfig( projects );

// Hacking jest behavior, since they don't provide "real" flexibility and programmatic usage, but only `runCLI`
if ( jestProjects.length === 1 ) {
    jestProjects.length = 2;
}

if ( "string" === typeof initialArgv.reporters ) {
    initialArgv.reporters = [ initialArgv.reporters ];
}

// This will allow to run test by exact name in case gate pragma is not specified, see `setup-react-test-gates`
if ( initialArgv.testNamePattern?.length && ! initialArgv.testNamePattern.includes( "[" ) ) {
    const patternStart = initialArgv.testNamePattern.split( " ", 1 ) [ 0 ];

    initialArgv.testNamePattern = patternStart + "( \\[.*\\])?" +
        initialArgv.testNamePattern.substring( patternStart.length );
}

if ( ! didCatch ) {
    /**
     * initialArgv overrides jestProjects
     */
    await runCLI( initialArgv, jestProjects );
}

