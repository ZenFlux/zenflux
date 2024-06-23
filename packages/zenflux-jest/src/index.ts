
import fs from "node:fs";
import inspector from "node:inspector";
import util from "node:util";

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

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const rootPkg = new Package( path.dirname( zFindRootPackageJsonPath() ) );

const filterProjects: string[] = [];

if ( process.argv.includes( "--help" ) || process.argv.includes( "-h" ) ) {
    ConsoleManager.$.log( "Use jest --help" );
    process.exit( 0 );
}

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
        ( p ) => filterProjects.push( p.trim() )
    );
}

if ( process.argv.includes( "--runTestsByPath" ) ) {
    const runTestsByPathKey = process.argv.indexOf( "--runTestsByPath" );
    const runTestsByPath = process.argv[ runTestsByPathKey + 1 ];

    if ( ! runTestsByPath ) {
        ConsoleManager.$.log( "Use @z-jest --runTestsByPath <path>" );
        process.exit( 1 );
    }

    const packages = zWorkspaceGetPackages( rootPkg );

    const matched = Object.values( packages ).find( ( pkg ) => {
        return runTestsByPath.includes( pkg.getPath() );
    } );

    if ( matched ) {
        filterProjects.push( matched.json.name );
    }

}

async function getProjectsConfig(): Promise<{
    pkg: Package;
    config: Config.ProjectConfig | Config.InitialOptions;
    configPath: string;
    normalized?: Config.ProjectConfig,
}[]> {
    const packages = await zWorkspaceGetPackages( rootPkg );

    return await Promise.all( Object.values( packages )
        .filter( ( pkg ) => {
            if ( filterProjects.length > 0 ) {
                const match = filterProjects.find( ( p ) => {
                    const regex = new RegExp( p );

                    return regex.test( pkg.json.name );
                } );

                if ( ! match ) {
                    return false;
                }
            }

            const jestConfigExist = fs.existsSync( pkg.getPath() + "/jest.config.ts" );

            if ( ! jestConfigExist ) {
                throw new Error( `${ util.inspect( "jest.config.ts" ) } not found in ` + util.inspect( pkg.getPath() ) );
            }

            return true;
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

// Initial config
const rootConfig: Partial<Config.Argv> = {
    testRegex: "(/test/.*\\.test\\.(js|cjs))$",

    verbose: true,

    // Detect debug mode...
    cache: ! inspector.url(),
    testTimeout: inspector.url() ? 30000 : 5000,
};

const eachProjectConfig: Partial<Config.ProjectConfig> = {};

const initialArgv: Config.Argv = {
    ... rootConfig,
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

    project.config = {
        ... eachProjectConfig,
        ... project.config,
    } as any;

    // Since jest does not give simple flexibility without adding custom code,
    ConsoleManager.$.warn = ( ... args ) => {
        args.push( "\n" + "cause: file://" + configPath + "\n" );
        ConsoleManager.$.error( ... args );
    };

    const promise = normalize(
        project.config as Config.InitialOptions,
        initialArgv,
        configPath, // Jest not favoring this path
        index,
        true
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

let jestProjects = projects.map( ( p => {
        if ( ! p.config.setupFiles ) {
            p.config.setupFiles = [];
        }

        // Insert local setup files before the project setup files
        p.config.setupFiles.unshift( path.join( __dirname, "setup.js" ) );

        if ( ! p.config.displayName ) {
            p.config.displayName = p.pkg.getDisplayName();
        }

        return p.config;
    }
) ) as any;

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

