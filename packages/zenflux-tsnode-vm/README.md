# @zenflux/tsnode-vm

## Description

This package provides a simple node VM for running Typescript code in a sandboxed environment, with favor of `tsconfig.json`
and tsconfig paths.

The aim of this package is to provide Typescript runtime based on node VM, with the ability to resolve modules, with out of box support
for any Typescript project.

## Installation
Via package manager, install `@zenflux/tsnode-vm`

## Known supported
- Works with bundlers like `esbuild`, `webpack`, `rollup`
- Works with bun

## Setup

```javascript
#!/usr/bin/env node --experimental-vm-modules --trace-uncaught --no-warnings
// bin/cli.js
import path from "path";

import { fileURLToPath } from "url";

import { vm, Loaders, Resolvers } from "@zenflux/tsnode-vm";
import { inspect, isCommonPathFormat } from "@zenflux/tsnode-vm/utils";

// In my case, I am using this file as a CLI, so the location of this file is `{workspace}{package}bin/cli.js`
const currentDir = path.dirname( fileURLToPath( import.meta.url ) );

// For better error stack trace, since we are using vm
Error.stackTraceLimit = Infinity;

vm.defineConfig( {
    // In my case `{workspace}{package}`
    projectPath: path.resolve( currentDir, "../" ),

    // In my case `{workspace}/node_modules`
    nodeModulesPath: path.resolve( currentDir, "../../../node_modules" ),

    // In my case `{workspace}{package}/bin/tsconfig.json`
    tsConfigPath: path.resolve( currentDir, "tsconfig.json" ),

    // Show which tsconfig file being used.
    tsConfigVerbose: ( output ) => console.log( `[tsconfig] reading: ${ inspect( output ) }` ),

    // Global variables that will be available in the vm
    vmContext: {
        global,

        fetch,

        console: Object.create( console ),
    }
} );

vm.tap( async ( vm ) => {
    const resolvers = new Resolvers( vm ),
        loaders = new Loaders( vm );

    const moduleOptions = {
        moduleLinkerCallback: loadModule,
        // You may want to create a custom module loader for your own use case
        moduleImportDynamically: loadModule,
    };

    async function loadModule( modulePath, referencingModule ) {
        console.log( `[loadModule] loading: ${ inspect( modulePath ) }, status: ${ inspect( referencingModule.status ) } referer: ${ inspect( referencingModule.identifier ) }` );

        const result = await resolvers.try( modulePath, referencingModule, )
            .middleware( ( request ) =>
                console.log( `[middleware] requesting: ${ inspect( request.modulePath ) } type: ${ inspect( request.type ) } trying with path: ${ inspect( request.resolvedPath ) }` ) )
            .resolve( ( result ) =>
                console.log( `[resolved] requested: ${ inspect( result.modulePath ) } type: ${ inspect( result.type ) } with path: ${ inspect( result.resolvedPath ) }` )
            );

        switch ( result.type ) {
            case "nodeModule":
                return loaders.loadNodeModule( result.modulePath );

            case "relative":
            case 'tsPaths':
                if ( path.extname( result.resolvedPath ) === ".json" ) {
                    return loaders.loadJsonModule( result.resolvedPath );
                }

                return loaders.loadEsmModule( result.resolvedPath, moduleOptions );
        }

        throw new Error( `Module not found: ${ inspect( modulePath ) }` );
    }

    await loaders.loadEsmModule( vm.config.paths.project + "/src/boot.ts", moduleOptions );
} );
```

## Roadmap / Todo
- [ ] Automatic handling of cjs/esm based on `package.json`, `tsconfig.json`
- [ ] Tests
- [ ] Documentation
- [ ] More Examples
- [ ] Remove `tsconfig-paths` dependency
