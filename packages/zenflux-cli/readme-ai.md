# @zenflux/cli

## 📍 Overview

The repository contains a CLI tool called "@zenflux/cli" that offers functionalities related to building, publishing, and watching projects. It utilizes technologies like Babel, Rollup, TypeScript, and Verdaccio. The tool is designed to simplify the development process by providing a command-line interface with various commands for managing and building projects. It includes modules for handling registry operations, console menus, and npm package management. The tool's value proposition lies in its ability to automate repetitive tasks and streamline project workflows, ultimately enhancing developer productivity.

---

## 📦 Features

### Building Projects

The CLI tool provides a command for building projects. It utilizes technologies such as Babel, Rollup, ApiExtractor, and more to bundle and transpile code for distribution. Developers can use this feature to create distribution-ready packages.

- **CLI Commands**: `@build`, `@watch`
- **Default Behavior**: `@z-cli @build`, `@z-cli @watch`
  - Current working directory is **workspace**: Builds all packages in the workspace
  - Current working directory is **package**: Builds the current package
- **Flow**:
  - Selecting the package to build
  - Loads `zenflux.config.ts` for each package
  - Loads `tsconfig.{format}.json` for each package, where `{format}` is the format type, described in the `zenflux.config.ts` file
    - Builds the package for each format
      - Firing callback `onBuiltFormat` for each format, if provided (from `zenflux.config.ts`)<br /><br />
  - Runs `zApiExporter` for each package, if `inputDtsPath` and `outputDtsPath` are provided (from `zenflux.config.ts`)
  - Fires callback `onBuilt` if provided (from `zenflux.config.ts`) for build package
- **Options**
    ```json
    {
      "--workspace": {
        "description": "Run for specific workspace",
        "examples": [
          "--workspace <package-name>",
          "--workspace <package-name-a>, <package-name-b>"
        ]
      },
      "--dev": {
        "description": "Run in development mode",
        "behaviors": [
          "Shows all api-exporter diagnostics",
          "No minification",
          "Loading different tsconfig file: tsconfig.{format}.dev.json",
          "Sets process.env.NODE_ENV to 'development'"
        ]
      }
    }
    ```
- **Configuration**;
  - `format`:
    - Array of formats to build, eg: `es` | `cjs` | `umd`
  - `extensions`:
    - Array of extensions to build, eg: ```[ ".ts", ".js" ]```
  - `inputPath`:
    - Path to the input file
  - `outputName`:
    - Name of the output package
  - `outputFileName`:
    - Name of the output file
  - `inputDtsPath`:
    - Path to the input dts file
  - `outputDtsPath`:
    - Path to the output dts file
  - `external`:
    - Array of external packages, packages that should not be bundled, eg: `react-dom`
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
    
          external: [
              "react-dom",
          ],
      };
    
      export default config;
      ```

### Publishing Packages

The tool supports publishing npm packages to a registry. It includes features for configuring and publishing packages, ensuring they are available for installation by other developers. Developers can manage and publish their packages with ease.

- **CLI Command**: `@publish`
- **Default Behavior**: `@z-cli @publish`
  - Trying to publish all publishable packages in the workspace (select able by console menu) 


### Registry Operations

The tool handles interactions with npm registries, providing features for checking package existence, fetching the latest version of a package, and more. This is crucial for managing dependencies and packages effectively.

**CLI Command**: `registry.ts`

### Configuration Management

Extensive configuration management is built into the tool, allowing developers to specify settings and options for various functionalities. This feature makes the tool highly customizable, adapting to specific project requirements.

**Configuration Files**: `tsconfig.json`, `tsconfig.dev.json`, `tsconfig.eslint.json`, `tsconfig.paths.json`

**Global Configuration**: The tool allows initialization and retrieval of global configuration and paths, promoting consistency and sharing of settings across the project.

**CLI Commands**: `config.ts`, `global.ts`

---


## 📂 Repository Structure

```sh
└── /
    ├── bin/
    │   ├── cli.js
    │   └── tsconfig.json
    ├── package.json
    ├── src/
    │   ├── base/
    │   │   ├── command-base.ts
    │   │   ├── command-config-base.ts
    │   │   └── command-rollup-base.ts
    │   ├── boot.ts
    │   ├── commands/
    │   │   ├── build.ts
    │   │   ├── publish.ts
    │   │   ├── registry.ts
    │   │   └── watch.ts
    │   ├── core/
    │   │   ├── api-extractor.ts
    │   │   ├── config.ts
    │   │   ├── global.ts
    │   │   ├── rollup.ts
    │   │   ├── tsconfig.ts
    │   │   └── workspace.ts
    │   ├── definitions/
    │   │   ├── config.ts
    │   │   ├── export.ts
    │   │   ├── internal.ts
    │   │   ├── rollup.ts
    │   │   └── zenflux.ts
    │   ├── index.ts
    │   ├── modules/
    │   │   ├── console/
    │   │   └── npm/
    │   └── utils/
    │       ├── common.ts
    │       └── path.ts
    ├── tsconfig.dev.json
    ├── tsconfig.eslint.json
    ├── tsconfig.json
    └── tsconfig.paths.json

```

---


## ⚙️ Development summary

<details closed><summary>Root</summary>

| File                           | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---                            | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [tsconfig.dev.json]({file})    | The code defines the configuration for the development environment of a project. It extends the base tsconfig.json file and sets compiler options for generating declaration maps and source maps. It also specifies the source root directory as "./src/". Additionally, it includes a ts-node configuration that enables registering tsconfig-paths for module resolution.                                                                                                                          |
| [tsconfig.eslint.json]({file}) | The code represents the directory tree structure of a project. It includes various directories and files such as bin, src, package.json, and tsconfig.json. Within the src directory, there are subdirectories for base, commands, core, definitions, modules, and utils. Each subdirectory contains relevant TypeScript files with specific functionalities. The tsconfig.eslint.json file extends the configuration of tsconfig.json, enabling ESLint integration with the project.                 |
| [package.json]({file})         | The code represents the directory structure and package.json file of a CLI tool called "@zenflux/cli". The tool has various functionalities related to building, publishing, and watching projects. It uses technologies like Babel, Rollup, TypeScript, and Verdaccio. The package.json file contains dependencies, devDependencies, and other configuration settings for the tool.                                                                                                                  |
| [tsconfig.json]({file})        | The code is a TypeScript configuration file (tsconfig.json) that defines the compiler options for a project. It sets the ECMAScript version to transpile to (ESNext), the module system to use (ESNext), and the module resolution strategy (Node.js style). It also enables the generation of declaration files, allows synthetic default imports, enables compatibility with CommonJS or AMD modules, and enforces strict type checking rules.                                                      |
| [tsconfig.paths.json]({file})  | The code defines the compiler options and paths for the TypeScript compiler. The "outDir" option specifies the output directory for compiled files, while the "baseUrl" option sets the base URL for module resolution. The "paths" property maps module names starting with "@z-cli/" to corresponding source files in the "src/" directory. The "include" property specifies which files should be included for compilation, while the "exclude" property specifies which files should be excluded. |

</details>

<details closed><summary>Bin</summary>

| File                    | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---                     | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [tsconfig.json]({file}) | The code above represents a directory tree structure with various files and folders. The specific code snippet is from the `tsconfig.json` file located in the `bin` folder. It extends the configuration from the main `tsconfig.json` file and includes additional compiler options for diagnostics and resolving JSON modules.                                                                                                                                                                                                                                                                             |
| [cli.js]({file})        | The code provided is a CLI script that runs a Node.js application using the `@zenflux/tsnode-vm` module to enable executing JavaScript code in a sandboxed virtual machine environment. It sets up the necessary configurations for the virtual machine, including project path, node modules path, TypeScript configuration path, and a custom VM context. The script then defines and runs a function within the virtual machine environment using `vm.auto()`, which loads and executes a specified file from the project's `src` directory. Any errors that occur during execution are caught and logged. |

</details>

<details closed><summary>Src</summary>

| File               | Summary                                                                                                                                                                                                                            |
| ---                | ---                                                                                                                                                                                                                                |
| [boot.ts]({file})  | The code imports and executes the "boot" function from the "@z-cli/index" module, located in the "src/boot.ts" file. This code is responsible for initializing the application and executing any necessary setup or configuration. |
| [index.ts]({file}) | Exception:                                                                                                                                                                                                                         |

</details>

<details closed><summary>Core</summary>

| File                       | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---                        | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [workspace.ts]({file})     | The code provided represents a TypeScript module that contains functions related to managing workspaces in a project.-`zWorkspaceFindRootPackageJson` function is responsible for finding the root package.json file in the workspace.-`zWorkspaceFindPackage` function is used to find a specific package within the workspace.-`zWorkspaceGetPackages` function retrieves all the packages within the workspace.-`zWorkspaceGetPackagesPaths` function returns an array of objects representing the workspace paths and the packages within each workspace.-`zWorkspaceGetWorkspaceDependencies` retrieves the dependencies that are part of the workspace.                                                                        |
| [api-extractor.ts]({file}) | Exception:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [global.ts]({file})        | The code defines global variables and functions for initializing and retrieving configuration and paths in a Zenflux CLI application. The `zGlobalInitConfig` function initializes the global config, while `zGlobalInitPaths` sets the global paths. The `zGlobalGetConfig` and `zGlobalPathsGet` functions retrieve the global config and paths respectively. The code also defines a global variable `__ZENFLUX_CLI__` that holds the config and paths data.                                                                                                                                                                                                                                                                      |
| [config.ts]({file})        | The code in `src/core/config.ts` defines a function called `zConfigLoad`. This function is responsible for loading a configuration file and initializing global configurations. It imports various modules and components from different directories and files within the project. It checks if the specified configuration file exists, loads it, and performs some validation checks. If successful, it initializes global configurations and returns the loaded configuration object.                                                                                                                                                                                                                                             |
| [tsconfig.ts]({file})      | Exception:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [rollup.ts]({file})        | The code represents a module named "rollup.ts" which contains several functions related to configuring and generating Rollup configurations.The "zRollupGetPlugins" function returns an array of Rollup plugins based on the provided arguments. It includes plugins for resolving dependencies, TypeScript, Babel, JSON, and optional Terser for minification.The "zRollupGetOutput" function generates an OutputOptions object based on the provided arguments. It configures the output format, file path, and other options for the Rollup output.The "zRollupGetConfig" function generates a Rollup configuration object based on the provided arguments. It assembles the input, output, and plugin configurations for Rollup. |

</details>

<details closed><summary>Utils</summary>

| File                | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---                 | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| [path.ts]({file})   | The code in utils/path.ts defines a function called "getMatchingPathsRecursive". This function takes in three parameters: directoryPath (a string representing the path to a directory), filterPattern (a regular expression used to filter file paths), and maxAllowedDepth (an optional number representing the maximum allowed depth for the recursive search). The function uses the fs and path modules to recursively search the specified directory and its subdirectories for file paths that match the filterPattern. It ignores any file or directory names that start with a period (".") and only includes directories that match the filterPattern. The function returns an array of matching file paths. |
| [common.ts]({file}) | The code defines a TypeScript type called `TForceEnumKeys`. It is used to create a new type that maps each property of a given object type `T` to a boolean value, indicating whether that property is required or not. This allows for the enforcement of required properties in TypeScript.                                                                                                                                                                                                                                                                                                                                                                                                                          |

</details>

<details closed><summary>Commands</summary>

| File                  | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---                   | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [publish.ts]({file})  | Exception:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [watch.ts]({file})    | The code represents a "watch" class for a CLI tool. It extends a base class called "CommandRollupBase" and is used to watch for changes in files and recompile them. It imports a few dependencies including "rollup" and defines a "run" method that sets up a watcher for each Rollup configuration provided. When a change event occurs, it logs relevant information such as the start and end of bundle building, and any encountered errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [registry.ts]({file}) | The code defines a class called `Registry` that extends `CommandBase`. It contains a `run` method that handles different commands based on user input. When the command is "server", it ensures the existence of a Verdaccio configuration file and starts a local npm registry server. It also checks for the presence of an htpasswd file and adds a new user with default credentials if it doesn't exist.When the command is "use", it executes an npm command with a custom.npmrc file that points to the local registry.For any other command, it displays a help message with usage instructions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [build.ts]({file})    | The `build.ts` file is a TypeScript module that exports a `Build` class. This class extends the `CommandRollupBase` class from the `@z-cli/base` package. It contains a `run` method that builds rollup bundles based on the provided configuration. The `run` method accepts a configuration object containing `rollupConfig` and `onBuilt` properties. `rollupConfig` is an array of rollup configurations. Each configuration includes an `output` object that specifies the format and file path for the bundle. During the build process, the method logs the progress and timing of each bundle creation. After building the bundles, it checks if there is a TypeScript definition file path provided and generates the dts file using `zApiExporter` function from the `@z-cli/core` package. It also invokes the `onBuilt` callback function when all bundles are built.The module imports various dependencies from different packages such as `fs`, `path`, `rollup`, `@z-cli/base`, `@z-cli/modules/console`, `@z-cli/core/api-extractor`, and `@z-cli/definitions/zenflux`.Overall, the `build.ts` file serves as a script for building bundles using rollup, with additional functionality for generating TypeScript definition files. |

</details>

<details closed><summary>Npm</summary>

| File                     | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---                      | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [registry.ts]({file})    | The code defines a class called `Registry` which handles interactions with a registry for packages. It has properties for the registry endpoint, the response from the API, the response status, and the data returned from the API. The `Registry` class has a constructor that takes a package name and a registry URL, and it initializes the endpoint and fetches the response. The class also has methods for waiting for the response, checking if the package exists, getting the latest version of the package, and checking if a specific version of the package is used. |
| [definitions.ts]({file}) | Exception:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [package.ts]({file})     | The code represents a package class that provides functionalities related to managing and publishing npm packages. It includes methods for loading the package registry, saving the package configuration, publishing the package, getting the package dependencies, and retrieving the list of files to be published. The class also implements methods for getting the package path, displaying the package name, and caching the list of files to be published.                                                                                                                 |

</details>

<details closed><summary>Console</summary>

| File                               | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---                                | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [console-menu.ts]({file})          | The code represents a ConsoleMenu class that allows the creation of interactive console menus. It provides functionality for navigating through menu items, selecting an item, and handling keypress events. The class uses the `readline` module to interact with the console and supports custom key handlers. The menu items are defined by the `IConsoleMenuItem` interface and can have properties like `title`, `separator`, `selected`, and `disabled`. The class also provides methods for customization such as adding custom key handlers and defining the display of menu items. |
| [index.ts]({file})                 | Exception:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [console-menu-hotkey.ts]({file})   | The code is a TypeScript file that defines a class called `ConsoleMenuHotkey`, which extends another class called `ConsoleMenu`. The purpose of this class is to create a custom console menu with hotkey functionality. It imports types and a class from another module called `ConsoleMenu`, and also defines its own interface called `MenuItemHotKey`. The class has methods to handle hotkey selection and display of menu items.                                                                                                                                                     |
| [console-menu-checkbox.ts]({file}) | Exception:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

</details>

<details closed><summary>Definitions</summary>

| File                  | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---                   | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [zenflux.ts]({file})  | The code defines various default values and constants for a project called Zenflux. It includes default file names, folder names, and URLs for the Zenflux project, as well as a type definition for the supported format types.                                                                                                                                                                                                                                                                                                                                                                                                                |
| [export.ts]({file})   | The code is exporting two modules from the "@z-cli/definitions" package: "rollup" and "config". These modules can be imported and used in other parts of the codebase.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| [config.ts]({file})   | This code defines interfaces used in the `config.ts` file of the `definitions` directory. The `IConfigArgs` interface represents the arguments used in the `zRollupGetConfig` function. It includes properties such as `extensions`, `external`, `format`, `globals`, `inputPath`, `outputFileName`, and `outputName`.The `IZConfig` interface extends `IConfigArgs` and adds additional properties such as `format` (an array of `TZFormatType`), `inputDtsPath`, `outputDtsPath`, `onBuiltFormat`, and `onBuilt`.These interfaces are used to define the structure and types of objects that are used in the code for configuration purposes. |
| [internal.ts]({file}) | The code includes a directory tree structure and a specific file named "internal.ts" located in the "src/definitions" directory. The file exports two modules, "@z-cli/definitions/rollup" and "@z-cli/definitions/config".                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [rollup.ts]({file})   | The code defines types and interfaces related to Rollup configuration. It includes the following:-`TZBabelHelperType`: A union type representing different options for a Babel helper.-`IPluginArgs`: An interface representing arguments for a Rollup plugin, including options for Babel, file extensions, and module format.-`IOutputArgs`: An interface representing arguments for Rollup output, including file extension, module format, and output name.                                                                                                                                                                                 |

</details>

<details closed><summary>Base</summary>

| File                             | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---                              | ---                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [command-rollup-base.ts]({file}) | The code in "command-rollup-base.ts" defines an abstract class called CommandRollupBase. This class extends another class called CommandConfigBase. It imports dependencies such as "rollup" and other modules. The class has a private property called "rollupConfig" which is an array of RollupOptions. The class has a method called "loadConfig()" that loads the configuration and updates the rollupConfig property. It has a method called "getRollupConfig()" that returns the rollupConfig property. It also has a private method called "getConfigForEachFormat()" that iterates over the formats in the config and creates a new rollup Config for each format using the zRollupGetConfig function. |
| [command-config-base.ts]({file}) | The code is part of a directory structure for a command-line interface (CLI) project. The `CommandConfigBase` class extends `CommandBase` and provides functionality for loading and accessing configuration data.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [command-base.ts]({file})        | The code defines a TypeScript class called `CommandBase` that serves as a base class for implementing commands in a CLI application. The class imports several modules and contains a constructor that initializes the paths and environment based on command-line arguments. It also includes an abstract `run` method that subclasses must implement. The `CommandBase` class provides a way to define commands with specific functionalities in the CLI application.                                                                                                                                                                                                                                         |

</details>

---

## 🚀 Getting Started

***Dependencies***

Please ensure you have the following dependencies installed on your system:

`- ℹ️ Dependency 1`

`- ℹ️ Dependency 2`

`- ℹ️ ...`

### 🔧 Installation

1. Clone the  repository:
```sh
git clone ../
```

2. Change to the project directory:
```sh
cd 
```

3. Install the dependencies:
```sh
npm install
```

### 🤖 Running 

```sh
npm run build && node dist/main.js
```

### 🧪 Tests
```sh
npm test
```

---


## 🛣 Project Roadmap

> - [X] `ℹ️  Task 1: Implement X`
> - [ ] `ℹ️  Task 2: Implement Y`
> - [ ] `ℹ️ ...`


---

## 🤝 Contributing

Contributions are welcome! Here are several ways you can contribute:

- **[Submit Pull Requests](https://github.com/local//blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.
- **[Join the Discussions](https://github.com/local//discussions)**: Share your insights, provide feedback, or ask questions.
- **[Report Issues](https://github.com/local//issues)**: Submit bugs found or log feature requests for LOCAL.

#### *Contributing Guidelines*

<details closed>
<summary>Click to expand</summary>

1. **Fork the Repository**: Start by forking the project repository to your GitHub account.
2. **Clone Locally**: Clone the forked repository to your local machine using a Git client.
   ```sh
   git clone <your-forked-repo-url>
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear and concise message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to GitHub**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.

Once your PR is reviewed and approved, it will be merged into the main branch.

</details>

---

## 📄 License


This project is protected under the [SELECT-A-LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

## 👏 Acknowledgments

- List any resources, contributors, inspiration, etc. here.

[**Return**](#Top)

---

