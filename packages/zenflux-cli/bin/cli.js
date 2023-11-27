#!/usr/bin/env node --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings --trace-exit
import path from "path";

import { fileURLToPath } from "url";

import { Loaders, Resolvers, vm } from "@zenflux/tsnode-vm";

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

    nodeModulesPath: path.resolve( currentDir, "../../../node_modules" ),

    tsConfigPath: path.resolve( currentDir, "./tsconfig.json" ),

    vmContext,

    tsPathsExtensions: [ ".ts", ".json" ],
} );

vm.tap( async ( vm ) => {
    const resolvers = new Resolvers( vm ),
        loaders = new Loaders( vm );

    await vm.auto( vm.config.paths.project + "/src/boot.ts", loaders, resolvers ).catch( ( err, f ) => {
        // Find better way to handle this.
        console.error( `Error:`, err );
        process.exit( 1 );
    } );
} );
