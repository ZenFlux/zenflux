# @zenflux/tsnode-vm

## Description

This package provides a simple node VM for running Typescript code in a sandboxed environment, with favor of `tsconfig.json`
and tsconfig paths.

The aim of this package is to provide Typescript runtime based on node VM, with the ability to resolve modules, with out of box support
for Typescript projects.

## Installation
Via package manager, install `@zenflux/tsnode-vm`

## Usage
```javascript
#!/usr/bin/env node --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings --trace-exit
import path from "path";

import { fileURLToPath } from "url";

import { vm, Loaders, Resolvers } from "@zenflux/tsnode-vm";

const currentDir = path.dirname( fileURLToPath( import.meta.url ) );

// For better error stack trace, since we are using vm.
Error.stackTraceLimit = Infinity;

// Example assuming this file is: `{projectDir}/bin/cli.js`
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
```

## Arguments
- `--zvm-verbose` - Enable verbose logging, shows all the files loaded, and the resolved paths.


## Roadmap / Todo
- [ ] Automatic handling of cjs/esm based on `package.json`, `tsconfig.json`
- [ ] Tests
- [ ] Documentation
- [ ] More Examples
- [ ] Remove `tsconfig-paths` dependency
- [ ] Circular dependency detection
