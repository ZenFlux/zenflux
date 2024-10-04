#!/usr/bin/env -S node --no-warnings --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings --experimental-import-meta-resolve
import { fileURLToPath } from "node:url";

import nodePath from "node:path";
import nodeFs from "node:fs";

import { Loaders, Resolvers, vm } from "@zenflux/typescript-vm";

import process from "node:process";
import { zFindRootPackageJsonPath } from "@zenflux/utils/src/workspace";
import * as util from "util";
import { ErrorWithMeta } from "@zenflux/utils/src/error";

// Constants
const CORE_PROJECT_NAME = "@zenflux/zenflux";
const PACKAGE_JSON = "package.json";
const TS_CONFIG_JSON = "tsconfig.json";
const NODE_MODULES = "node_modules";
const REQUIRED = "<REQUIRED>";

Error.stackTraceLimit = Infinity;

const currentFilePath = fileURLToPath( import.meta.url );

function findClosestPackageJsonPathInCWD( cwd ) {
    const packageJsonPath = nodePath.resolve( cwd, PACKAGE_JSON );
    if ( nodeFs.existsSync( packageJsonPath ) ) {
        return packageJsonPath;
    }

    return findClosestPackageJsonPathInCWD( nodePath.resolve( cwd, ".." ) );
}

// Paths
const currentPackageJsonPath = findClosestPackageJsonPathInCWD( process.cwd() ),
    rootPackageJsonPath = zFindRootPackageJsonPath(),
    currentPackagePath = nodePath.dirname( currentPackageJsonPath ),
    rootPackagePath = nodePath.dirname( rootPackageJsonPath );

// Check if node_modules is in root package or current package
const nodeModulesPath = nodeFs.existsSync( nodePath.resolve( rootPackagePath, NODE_MODULES ) ) ?
    nodePath.resolve( rootPackagePath, NODE_MODULES ) :
    nodePath.resolve( currentPackagePath, NODE_MODULES );


function readJsonFile( filePath ) {
    const data = nodeFs.readFileSync( filePath, "utf8" );
    return JSON.parse( data );
}

function isZenWorkspace( jsonFilePath ) {
    if ( nodeFs.existsSync( jsonFilePath ) ) {
        const packageJson = readJsonFile( jsonFilePath );
        return packageJson.name === CORE_PROJECT_NAME;
    }

    return false;
}


// External config type
const defaults = {
    projectPath: currentPackagePath,

    nodeModulesPath: nodeModulesPath,

    tsConfigPath: nodePath.resolve(
        currentPackagePath,
        isZenWorkspace( rootPackageJsonPath ) ? "" : "../",
        TS_CONFIG_JSON
    ),

    extensions: [ ".ts", ".json" ],

    // TODO - Add support for configuration of the following:
    vmContext: global,

    useSwc: true,
    useTsNode: false,
};

if ( ! process.env.Z_RUN_TARGET ) {
    const runnerName = nodePath.basename( process.argv[ 1 ] );

    console.error( `Usage: Z_RUN_TARGET="path/to/target" ${ runnerName }` );
    console.log( `Environment variables:\n` );
    console.log( `Z_RUN_TARGET="path/to/target"` );
    console.log( `Z_RUN_TSCONFIG_PATH="path/to/tsconfig.json"` );
    console.log( `Z_RUN_EXTENSIONS=".ts,.json"` );
    console.log();
    console.log( "Defaults:" );
    console.log( `Z_RUN_TARGET=${ REQUIRED }` );
    console.log( `Z_RUN_TSCONFIG_PATH="${ nodePath.resolve( projectPaths.dir, TS_CONFIG_JSON ) }"` );
    console.log( `Z_RUN_EXTENSIONS=".ts,.json"` );
    process.exit( 0 );
}

let {
    Z_RUN_TARGET: targetPath,
    Z_RUN_TSCONFIG_PATH: tsConfigPath,
    Z_RUN_EXTENSIONS: extensions,
} = process.env;

if ( ! nodeFs.existsSync( targetPath ) ) {
    console.error( `Error: Target ${ targetPath } not found` );
    process.exit( 1 );
}

if ( ! nodePath.isAbsolute( targetPath ) ) {
    targetPath = nodePath.resolve( process.cwd(), targetPath );
}

// External config type
const config = { ...defaults };

if ( tsConfigPath ) {
    config.tsConfigPath = tsConfigPath;
}

if ( extensions ) {
    config.extensions = extensions.split( "," ).map( ( ext ) => ext.trim() );
}

if ( nodeModulesPath === nodePath.resolve( rootPackagePath, NODE_MODULES ) ) {
    config.workspacePath = rootPackagePath;
}

global.__ZENFLUX_RUNNER__ = {
    paths: {
        cli: currentFilePath,
    }
};

// TODO: Use config to configure bun or wait for "vm:module" compatibility
if ( typeof Bun !== "undefined" ) {
    await import( targetPath );
} else {
    vm.defineConfig( config );

    vm.tap( async ( vm ) => {
        const resolvers = new Resolvers( vm ),
            loaders = new Loaders( vm );

        process.on( "exit", ( code ) => {
            if ( process.argv.includes( "--z-runner-verbose" ) ) {
                console.log( "Process exits now... metadata: " + util.inspect( {
                    argv: process.argv,
                    cwd: process.cwd(),
                    config: vm.config,
                    targetPath: targetPath,
                    code,
                }, { depth: null } ) );
            }
        } );

        await vm.auto( targetPath, loaders, resolvers ).catch( ( err ) => {
            if ( err.message ) {
                const deepStack = err.meta?.deepStack || [];

                deepStack.push( import.meta.url );

                err = new ErrorWithMeta( `Error in @zenflux/runner, While running ${ targetPath } script`, {
                    ... err.meta || {},
                    config: vm.config.paths,
                    deepStack
                }, err );
            }

            throw err;
        } );
    } );
}


