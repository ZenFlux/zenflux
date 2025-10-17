#!/usr/bin/env -S node --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings --experimental-import-meta-resolve
import path from "node:path";
import fs from "node:fs";

import { fileURLToPath } from "node:url";

import { Loaders, Resolvers, vm } from "@zenflux/typescript-vm";

import { workerData } from "node:worker_threads";
import process from "node:process";
import { ErrorWithMeta } from "@zenflux/utils/src/error";

const currentFilePath = fileURLToPath( import.meta.url || `file://${__filename}` ),
    currentDirPath = path.dirname( currentFilePath ),
    currentWorkspacePackageJsonPath = path.resolve( currentDirPath, "../../../package.json" );

function isZenWorkspace() {
    if ( fs.existsSync( currentWorkspacePackageJsonPath ) ) {
        const packageJson = JSON.parse( fs.readFileSync( currentWorkspacePackageJsonPath, "utf-8" ) );

        if ( packageJson.name === "@zenflux/zenflux" )
            return true;
    }
}

// For better error stack trace, since we are using vm.
Error.stackTraceLimit = Infinity;

global.__ZENFLUX_CLI__ = {
    paths: {
        cli: currentFilePath,
    }
};

const vmContext = {
    global,

    fetch,
    setTimeout,
    setInterval,
    setImmediate,
    clearTimeout,
    clearInterval
};

Object.defineProperty( vmContext, "console", {
    get() {
        throw new Error( "global 'console' is restricted use local module" );
    }
} );

/**
 * @type {typeof import("@zenflux/typescript-vm/src/config.js").externalConfig}
 */
const config = {
    projectPath: path.resolve( currentDirPath, "../" ),

    nodeModulesPath: process.env[ "npm_package_json" ] ?
        path.dirname( process.env[ "npm_package_json" ] ) : path.resolve( currentDirPath, "../../../node_modules" ),

    tsConfigPath: path.resolve( currentDirPath, "./tsconfig.json" ),

    vmContext,

    vmModuleEvaluateOptions: {
        breakOnSigint: true,
    },

    extensions: [ ".ts", ".json" ],

    useSwc: true,

    useTsNode: false,
};

if ( isZenWorkspace() ) {
    config.workspacePath = path.dirname( currentWorkspacePackageJsonPath );
}

vm.defineConfig( config );

vm.tap( async ( vm ) => {
    const resolvers = new Resolvers( vm ),
        loaders = new Loaders( vm );

    await vm.auto( workerData?.zCliWorkPath || vm.config.paths.project + "/src/boot.ts", loaders, resolvers ).catch( ( err ) => {
        if ( err.message ) {
            const deepStack = err.meta?.deepStack || [];

            deepStack.push( import.meta.url || `file://${__filename}` );

            // Show the original error message if it's more specific than a generic message
            const isGenericError = err.message.includes('Error in @zenflux/cli') || 
                                 err.message.includes('While running boot script');
            
            const errorMessage = isGenericError ? 
                `Error in @zenflux/cli, While running boot script` :
                `Error in @zenflux/cli: ${err.message}`;

            err = new ErrorWithMeta( errorMessage, {
                ... err.meta || {},
                config: vm.config.paths,
                deepStack,
                originalError: err.message
            }, err );
        }

        throw err;
    } );
} );
