# @zenflux/typescript-vm

## 📍 Overview

This package provides a simple node VM for running Typescript code in a sandboxed environment, with favor of `tsconfig.json`
and tsconfig paths.

The aim of this package is to provide Typescript runtime based on node VM, with the ability to resolve modules, with out of box support
for Typescript projects.

---

## 🛠️ Installation
Via package manager, `bun install @zenflux/typescript-vm`

---

## 💻 Usage
```javascript
#!/usr/bin/env node --unhandled-rejections=strict --experimental-vm-modules --trace-uncaught --no-warnings --trace-exit
import path from "path";

import { fileURLToPath } from "url";

import { vm, Loaders, Resolvers } from "@zenflux/typescript-vm";

const currentDir = path.dirname( fileURLToPath( import.meta.url ) );

// For better error stack trace, since we are using vm.
Error.stackTraceLimit = Infinity;

// Example assuming this file is: `{projectDir}/bin/cli.js`
vm.defineConfig( {
    projectPath: path.resolve( currentDir, "../" ),

    nodeModulesPath: path.resolve( currentDir, "../../../node_modules" ),

    tsConfigPath: path.resolve( currentDir, "./tsconfig.json" ),

    // Enable support for workspace `workspace:` paths from `package.json`
    workspacePath: path.resolve( currentDir, "../../../" ),

    vmContext: {
        global,

        fetch,
        setTimeout,
        clearTimeout,
    },

    extensions: [ ".ts", ".json" ],
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

---

## 🕹️ Arguments
- `--zvm-verbose` - Enable verbose logging, shows all the files loaded, and the resolved paths.

---

## 
## ⚙️ Development summary

| File                             | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [loaders.js](src/loaders.js)     | The `Loaders` class in the `loaders.js` file is responsible for loading and caching different types of modules in a Node.js environment. It provides methods for loading modules of type "node", "json", and "esm". It also has functionality for caching modules to improve performance. The class uses the `vm` (virtual machine) module from Node.js to create synthetic modules for evaluation. The module paths and types are used to generate unique IDs for caching.                                                                                                                                     |
| [resolvers.js](src/resolvers.js) | The code defines a class called "Resolvers" that handles the resolution of module paths. It includes methods for resolving paths relative to the referencing module, paths for node modules, paths defined in TypeScript (tsconfig) paths, and paths using ES modules (ESM). It uses various libraries and methods such as node:path, node:fs, node:util, tsconfig-paths, and node:module. The class has a caching mechanism to improve performance and allows for the use of middleware functions for customization.                                                                                           |
| [index.js](src/index.js)         | The code defines a module that can be used as a configuration manager and executes JavaScript code inside a sandboxed environment. It takes advantage of TypeScript and provides functionality for loading modules, resolving module dependencies, and executing code. It also ensures that certain flags are enabled and checks for the existence of required paths. The code exports a `vm` object that can be used to define configuration, tap into the execution flow, and access various components of the module, such as the configuration, the sandbox, and the ability to automatically load modules. |
| [utils.js](src/utils.js)         | This code file contains various utility functions. It includes functions for checking if a path is in common format, resolving absolute or relative paths, creating resolvable promises, generating checksums for data, and outputting verbose information. It also imports and uses modules like "node:path", "node:util", and "node:crypto" for these functionalities.                                                                                                                                                                                                                                        |
| [providers](src/providers)       | Folder contains a providers, some of them with load methods some with resolvers, and some both, they used to resolve and load files                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
---

## 🎯 Roadmap / Todo
- [ ] Automatic handling of cjs/esm based on `package.json`, `tsconfig.json`
- [ ] Tests
- [ ] Documentation
- [ ] More Examples
- [ ] Remove `tsconfig-paths` dependency
- [ ] Circular dependency detection
- [ ] Configurable tsnode/swc loader
- [ ] Add cli with arguments for configuration
