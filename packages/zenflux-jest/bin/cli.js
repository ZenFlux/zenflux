#!/usr/bin/env node --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings --trace-exit
import path from "node:path";

import { fileURLToPath } from "node:url";

import { Loaders, Resolvers, vm } from "@zenflux/typescript-vm";

const currentDir = path.dirname( fileURLToPath( import.meta.url ) );

// For better error stack trace, since we are using vm.
Error.stackTraceLimit = Infinity;

const vmContext = {
    process,
    global,
    setTimeout,
};

vm.defineConfig( {
    projectPath: path.resolve( currentDir, "../" ),

    nodeModulesPath: path.resolve( currentDir, "../../../node_modules" ),

    workspacePath: path.resolve( currentDir, "../../../" ),

    tsConfigPath: path.resolve( currentDir, "../tsconfig.json" ),

    vmContext,

    extensions: [ ".ts", ".json" ],

    useSwc: true,

    useTsNode: false,
} );

vm.tap( async ( vm ) => {
    const resolvers = new Resolvers( vm ),
        loaders = new Loaders( vm );

    await vm.auto( vm.config.paths.project + "/src/index.ts", loaders, resolvers ).catch( ( err ) => {
        throw err;
    } );
} );
