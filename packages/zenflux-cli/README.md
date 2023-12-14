# @zenflux/cli

## 📍 Overview

The repository contains a CLI tool called `@z-cli` that offers functionalities related to building, publishing, and watching **monorepo** workspaces. It utilizes technologies like Babel, Rollup, TypeScript, and Verdaccio. The tool is designed to simplify the development process by providing a command-line interface with various commands for managing and building projects. It includes modules for handling npm registry operations. The tool's value proposition lies in its ability to automate repetitive tasks and streamline project workflows, ultimately enhancing developer productivity.

---

## 🛠️ Installation
Via package manager, `bun install @zenflux/cli`

---

## 📦 Features

### Building Projects

The CLI tool provides a command for building projects. It utilizes technologies such as SWC, Rollup, ApiExtractor, and more to bundle and transpile code for distribution. Developers can use this feature to create distribution-ready packages.

- **CLI Commands**: `@build`, `@watch`
<br /><br />
- **Default Behavior**: `@z-cli @build`, `@z-cli @watch`
    - Current working directory is **workspace**: Builds all packages in the workspace
    - Current working directory is **package**: Builds the current package
<br /><br />

- **Options**
- **--config:**
    - Description: Specify a custom config file
    - Examples:
        - `--config <config-file-name>`
        - `--config zenflux.test.config.ts`
          <br /><br />
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
<br /><br />
  - **--haltOnDiagnosticError:**
    - Description: Halt on typescript diagnostic error
    - Behaviors:
        - Kill the process if typescript diagnostic error occurred
    <br /><br />

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
<br />

  - **Multi Configuration**
<br /><br />
    Each key in the configs object represents a package in your workspace.
    The key should match the name of the package.
    The `$defaults` key is optional and can be used to define default configurations that apply to all packages.
    These defaults can be overridden by package-specific configurations.
    Each package-specific configuration is an object that follows the `IZConfigInMulti` interface. This includes properties like:
<br /><br />
  - `inputPath`
  - `outputFileName`
  - `format`
  - `extensions`
    <br /><br />
  - This format allows you to manage configurations for multiple packages in a centralized manner, making it easier to maintain and update configurations as your workspace grows.
    - Example
      ```ts
      import type { IZConfigs } from "@zenflux/cli";

      const configs: IZConfigs = {
          $defaults: {
              format: [ "es", "cjs" ],
              extensions: [ ".ts" ],
          },
          "@zenflux/react-scheduler": {
              inputPath: "src/index.ts",
              outputFileName: "zenflux-react-scheduler",
              inputDtsPath: "dist/src/index.d.ts",
              outputDtsPath: "dist/zenflux-react-scheduler.d.ts",
          },
          "@zenflux/react-scheduler/mock": {
              inputPath: "src/index.mock.ts",
              outputFileName: "zenflux-react-scheduler.mock",
              inputDtsPath: "dist/src/index.mock.d.ts",
              outputDtsPath: "dist/zenflux-react-scheduler.mock.d.ts",
          }
      };

      export default configs;
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
- **@build**
    - Selecting the package to build - The run method starts by retrieving the configurations using the getConfigs method and the configuration paths using the getConfigsPaths method.
    - Loads `zenflux.config.ts` for each package - It creates a `TZBuildOptions` object with the current configuration. If the number of configurations is greater than `DEFAULT_MIN_SINGLE_BUILD_CONFIGS`, it assigns the index of the current configuration to the thread property of the `TZBuildOptions` object.
    - For each configuration path, it reads the TypeScript configuration using the `zTSConfigRead` method and performs pre-diagnostics using the `zTSPreDiagnostics` method.
    - Loads `tsconfig.{format}.json` for each package, where `{format}` is the format type, described in the `zenflux.config.ts` file
        - Builds the package for each format
            - Firing callback `onBuiltFormat` for each format, if provided (from `zenflux.config.ts`)
              <br /><br />
    - It then calls the zRollupBuild method with the Rollup configuration and the `TZBuildOptions` object. This method is responsible for the actual build process.
    - After building all configurations, for each configuration path, it logs the start of the declaration files creation process and creates the declaration files using the `zTSCreateDeclaration` method.
    - After the build process, it calls the onBuilt method of the current configuration if it exists (from `zenflux.config.ts`).
    - Rollup `d.ts` files to single `d.ts` file - Runs `zApiExporter` for each package, if `inputDtsPath` and `outputDtsPath` are provided (from `zenflux.config.ts`)
      <br /><br />

- **@watch**
  - **Initialization**: The `@watch` command starts by retrieving the configurations for each package in your workspace. These configurations are defined in the `zenflux.config.ts` file of each package.
  - **Watcher Creation**: It sets up a file watcher using the `chokidar.watch` method. This watcher monitors the files in your workspace for any changes.
  - **Configuration Loop**: For each package configuration, it creates a separate build process. This means that each package in your workspace has its own independent build process that runs whenever a file in that package changes.
  - **Rollup Configuration**: For each package, it creates a Rollup configuration. This configuration defines how the package should be bundled.
  - **Watcher Setup**: It sets up a watcher for each package. When the watcher detects a change in a package, it triggers the build process for that package. To avoid triggering multiple builds for rapid successive changes, the build process is debounced using the `debounce` function.
  - **Change Detection**: Whenever a file in a package changes, the watcher triggers the build process for that package. The build process is triggered after a delay to ensure that multiple rapid changes do not trigger multiple builds.
  - **Post-Build**: After each build process, it performs TypeScript pre-diagnostics for all configurations. This helps to catch and report any TypeScript errors that might have been introduced during the changes.
  - **TypeScript Pre-Diagnostics**: After each build process, it performs TypeScript pre-diagnostics for all configurations. This helps to catch and report any TypeScript errors that might have been introduced during the changes.
  - **Watch Method**: The `watch` method is used to set up a watcher for a specific package. It triggers a build process whenever a change is detected in the package. The build process is debounced to avoid triggering multiple builds for rapid successive changes.
  - **Debounce Function**: The `debounce` function ensures that the build process is not triggered more than once within a specified delay. This is useful to avoid triggering multiple builds for rapid successive changes. The debounce function works by delaying the execution of the build process until a certain amount of time has passed without any new changes being detected. This ensures that if multiple changes are made in quick succession, the build process will only be triggered once, after the last change.
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

---

## 🎯 Roadmap / Todo
- [ ] Publish should handle all input questions with cli arguments - Run without input blocking
- [ ] Workspace publish/build configuration, should conditionally test & build packages
- [ ] Make native support for npm workspaces
