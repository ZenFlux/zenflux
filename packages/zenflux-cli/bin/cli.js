#!/usr/bin/env node --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings
import path from "node:path";

import { fileURLToPath } from "node:url";

import { Loaders, Resolvers, vm } from "@zenflux/typescript-vm";

import { workerData } from "node:worker_threads";

const currentFile = fileURLToPath( import.meta.url );
const currentDir = path.dirname( currentFile );

// For better error stack trace, since we are using vm.
Error.stackTraceLimit = Infinity;

global.__ZENFLUX_CLI__ = {
    paths: {
        cli: currentFile,
    }
};

const vmContext = {
    global,

    fetch,
    setTimeout,
    clearTimeout,
};

Object.defineProperty( vmContext, "console", {
    get() {
        throw new Error( "global 'console' is restricted use local module" );
    }
} );

vm.defineConfig( {
    projectPath: path.resolve( currentDir, "../" ),

    workspacePath: path.resolve( currentDir, "../../../" ),

    nodeModulesPath: path.resolve( currentDir, "../../../node_modules" ),

    tsConfigPath: path.resolve( currentDir, "./tsconfig.json" ),

    vmContext,

    extensions: [ ".ts", ".json" ],

    useSwc: true,

    useTsNode: false,
} );

vm.tap( async ( vm ) => {
    const resolvers = new Resolvers( vm ),
        loaders = new Loaders( vm );

    await vm.auto( workerData?.zCliWorkPath || vm.config.paths.project + "/src/boot.ts", loaders, resolvers ).catch( ( err ) => {
        throw err;
    } );
} );
