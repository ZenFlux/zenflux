# @zenflux/cli

## 📍 Overview

The repository contains a CLI tool called `@z-cli` that offers functionalities related to building, publishing, and watching **monorepo** projects. It utilizes technologies like Babel, Rollup, TypeScript, and Verdaccio. The tool is designed to simplify the development process by providing a command-line interface with various commands for managing and building projects. It includes modules for handling npm registry operations. The tool's value proposition lies in its ability to automate repetitive tasks and streamline project workflows, ultimately enhancing developer productivity.

---

## 📦 Features

### Building Projects

The CLI tool provides a command for building projects. It utilizes technologies such as Babel, Rollup, ApiExtractor, and more to bundle and transpile code for distribution. Developers can use this feature to create distribution-ready packages.

- **CLI Commands**: `@build`, `@watch`
<br /><br />
- **Default Behavior**: `@z-cli @build`, `@z-cli @watch`
    - Current working directory is **workspace**: Builds all packages in the workspace
    - Current working directory is **package**: Builds the current package
<br /><br />
- **Flow**:
    - Selecting the package to build
    - Loads `zenflux.config.ts` for each package
    - Loads `tsconfig.{format}.json` for each package, where `{format}` is the format type, described in the `zenflux.config.ts` file
        - Builds the package for each format
            - Firing callback `onBuiltFormat` for each format, if provided (from `zenflux.config.ts`)<br /><br />
    - Runs `zApiExporter` for each package, if `inputDtsPath` and `outputDtsPath` are provided (from `zenflux.config.ts`)
    - Fires callback `onBuilt` if provided (from `zenflux.config.ts`) for build package
<br /><br />
- **Options**
  - **--workspace:**
      - Description: Run for a specific workspace
      - Examples:
          - `--workspace <package-name>`
          - `--workspace <package-name-a>, <package-name-b>`
<br /><br />
  - **--dev:**
      - Description: Run in development mode
      - Behaviors:
          - Shows all api-exporter diagnostics
          - No minification
          - Loads a different tsconfig file: `tsconfig.{format}.dev.json` or `tsconfig.dev.json`
          - Sets `process.env.NODE_ENV` to `development`


- **Configuration**;
    - `format`:
        - Array of formats to build, eg:```[ "es", "cjs", "umd" ]```
    - `extensions`:
        - Array of extensions to build, eg: ```[ ".ts", ".js" ]```
    - `inputPath`:
        - Path to the input file
    - `outputName`:
        - Name of the output package
    - `outputFileName`:
        - Name of the output file
    - `inputDtsPath` (**optional**):
        - Path to the input dts file
    - `outputDtsPath` (**optional**):
        - Path to the output dts file
    - `globals` (**optional**):
        - Object that will be used as globals, eg: `{ jquery: "jQuery" }`
    - `external` (**optional**):
        - Array of external packages, packages that should not be bundled, eg: `react-dom`
<br /><br />
     - Example
          ```ts
          import type { IZConfig } from "@zenflux/cli";
      
          const config: IZConfig = {
              format: [ "es", "cjs" ],
      
              extensions: [ ".ts" ],
      
              inputPath: "src/index.ts",
      
              outputName: "@my-mono-repo/demo-package",
              outputFileName: "zenflux-core",
      
              inputDtsPath: "dist/src/index.d.ts",
              outputDtsPath: "dist/demo-package.d.ts",
      
              globals: { 
                  jquery: "jQuery",
              },
              
              external: [
                  "react-dom",
              ],
          };
      
          export default config;
          ```
<br /><br />
- **Typescript configuration** - `tsconfig.json`
  - Fallback flow:
    - `--dev`
        - `tsconfig.{format}.dev.json`
        - `tsconfig.dev.json`
    - Regular
        - `tsconfig.{format}.json`
        - `tsconfig.json`

<br /><br />
### Publishing Packages

The tool supports publishing npm packages to a registry. It includes features for configuring and publishing packages, ensuring they are available for installation by other developers. Developers can manage and publish their packages with ease.

- **CLI Commands**: `@publish`
- **Default Behavior**: `@z-cli @publish`
    - Trying to publish all publishable packages in the workspace (select able by console menu
- **Flow**:
    - Determining if local npm will be used
    - Determining if the package is publishable
    - Asking the user for packages to publish
    - Replacing **workspace** dependencies with corresponding **local** dependencies
    - Showing the user the packages/files that will be published
    - Asking the user for confirmation, and publishing the packages
<br /><br />
### Registry Operations

The tool handles interactions with npm registries, creating a local npm registry for testing and development purposes
- **CLI Commands**: `@registry`
  <br /><br />
- **Default Behavior**: 
  - `@z-cli @registry @server`
      - Starts a local npm registry and create custom npm (`.npmrc`) configuration file that connects to the local registry
  - `@z-cli @registry @use`
      - Uses the custom npm configuration file to connect to the local registry
<br /><br />
- **Sub Commands**:
  - **@server:**
      - Description: Starts a local npm registry server
      - Usage: `@z-cli @registry @server`
<br /><br />
  - **@use:**
      - Description: Use npm with custom configuration, which will be forwarded to the local npm server
      - Examples:
          - `@z-cli @registry @use npm <command>`
          - `@z-cli @registry @use npm whoami`
          - `@z-cli @registry @use npm install`
<br /><br />
### Global arguments
- **--zvm-verbose:** Log [tsnode-vm](https://github.com/ZenFlux/zenflux/tree/main/packages/zenflux-tsnode-vm) verbose, shows modules resolution

- **--verbose:** Log verbose

- **--help:** Show help
