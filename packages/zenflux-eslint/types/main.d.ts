import type { Linter } from "eslint";

export interface ZESLintConfigCache {
    zWorkspaces: {
        [ rootPackagePath: string ]: {
            workspaces: string[];
        };
    };
    zChildrenESLintConfigs: {
        [ workspacePath: string ]: {
            configs: object[];
        };
    }
}

export interface ZESLintConfig {
    zRootPackagePath: string;
    zPackagePath: string;
    zCache: ZESLintConfigCache;
}

/**
 * An interface for ESLint default options.
 *
 * Properties:
 * - `workspaces`: An array of workspace paths to include. Default: `zLintGetWorkspaces()`.
 * - `excludeFiles`: Flag to determine if files should be excluded. Default: `false`.
 * - `files`: An array of file paths to include. Default: `{"**\/*.{ts,tsx}"}`
 * - `excludeProjectsWithConfig`: A flag indicating whether projects with ESLint configurations should be excluded from default config.
 */
export interface ZESLintDefaultOptions {
    /**
     * An array of workspace paths to include.
     * @default {zLintGetWorkspaces()}
     */
    workspaces?: string[];

    /**
     * Flag to determine if files should be excluded.
     * @defaut {false}
     */
    excludeFiles?: boolean;

    /**
     * A flag indicating whether projects with ESLint configurations should be excluded.
     *
     * @type {boolean}
     * @default {true}
     */
    excludeProjectsWithConfig?: boolean;

    /**
     * An array of file paths to include
     * @default {"**&#47;*.{ts,tsx}"}
     */
    files?: string[];
}

// Adding the interface to the globalThis namespace
declare global {
    var __Z_ESLINT_CONFIG__: ZESLintConfig;
}


export function zLintSetRootPackagePath( zRootPackagePath: string ): void;

export function zLintGetWorkspaces( rootPkgPath?: string ): string[];

export function zLintGetBaseConfig( options: ZESLintDefaultOptions ): Linter.Config[];

/**
 * Loads ESLint configurations from the provided paths.
 *
 * @param {string[]} esLintConfigPaths - Array of paths to ESLint configuration files.
 * @return {Promise<Array<object>>} - A promise that resolves to an array of loaded configurations.
 */
export function loadPackageESLintConfigs( esLintConfigPaths: string[] ): Promise<object[]>;

/**
 * Retrieves ESLint configuration for child projects in the provided workspaces.
 *
 * @param {string[]} [workspaces] - Array of workspace directories to search for ESLint configurations.
 * @return {Promise<Array<object>>} - A promise that resolves to an array of child project configurations.
 */
export function zLintGetChildrenConfig( workspaces?: string[] ): Promise<object[]>;


export function zLintGetConfig( options: ZESLintDefaultOptions ): Promise<Linter.Config[]>;
