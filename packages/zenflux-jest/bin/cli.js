#!/usr/bin/env -S node --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings --experimental-import-meta-resolve
import path from "node:path";

import { fileURLToPath } from "node:url";

import { Loaders, Resolvers, vm } from "@zenflux/typescript-vm";
import fs from "node:fs";

const currentFilePath = fileURLToPath( import.meta.url ),
    currentDirPath = path.dirname( currentFilePath ),
    isInNodeModules = currentDirPath.includes( "node_modules" ),
    currentWorkspacePackageJsonPath =
        path.resolve( currentDirPath, "../../", ( isInNodeModules ? "../../package.json" : "../package.json" ) );

function isZenWorkspace() {
    if ( fs.existsSync( currentWorkspacePackageJsonPath ) ) {
        const packageJson = JSON.parse( fs.readFileSync( currentWorkspacePackageJsonPath, "utf-8" ) );

        if ( packageJson.name === "@zenflux/zenflux" )
            return true;
    }
}

// For better error stack trace, since we are using vm.
Error.stackTraceLimit = Infinity;

const vmContext = {
    process,
    global,
    setTimeout,
};

/**
 * @type {typeof import("@zenflux/typescript-vm/src/config.js").externalConfig}
 */
const config = {
    projectPath: path.resolve( currentDirPath, "../" ),

    nodeModulesPath: process.env[ "npm_package_json" ] ?
        path.dirname( process.env[ "npm_package_json" ] ) : path.resolve(
            path.dirname( currentWorkspacePackageJsonPath ), "node_modules" ),

    tsConfigPath: path.resolve( currentDirPath, "../tsconfig.json" ),

    vmContext,

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

    await vm.auto( vm.config.paths.project + "/src/index.ts", loaders, resolvers ).catch( ( err ) => {
        throw err;
    } );
} );
