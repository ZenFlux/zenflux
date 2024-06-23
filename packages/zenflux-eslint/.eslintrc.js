/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import path from "node:path";

import * as TSLintParser from "@typescript-eslint/parser";

import TypeScriptPlugin from "@typescript-eslint/eslint-plugin";

import ImportPlugin from "eslint-plugin-import";

import { fixupPluginRules } from "@eslint/compat";

import { fileURLToPath } from "node:url";

import { zFindRootPackageJsonPath } from "@zenflux/utils/src/workspace";

const workingPath = path.dirname( fileURLToPath( import.meta.url ) );

globalThis.__Z_ESLINT_CONFIG__ = globalThis.__Z_ESLINT_CONFIG__ ?? {
    zRootPackagePath: zFindRootPackageJsonPath(),
    zPackagePath: path.resolve( workingPath, "./package.json" ),
};

const ZenFluxPlugin = ( await import( "@zenflux/eslint/plugin.js" ) ).default;

/**
 * Sets the root package path.
 *
 * @param {string} zRootPackagePath - The path to the workspace `package.json`.
 *
 * @return {void}
 */
export function zLintSetRootPackagePath( zRootPackagePath ) {
    globalThis.__Z_ESLINT_CONFIG__.zRootPackagePath = zRootPackagePath;
}

/**
 * Retrieves the workspaces from the provided workspace path.
 *
 * @param {string} [rootPkgPath=__Z_ESLINT_CONFIG__.zRootPackagePath] - The path to the root package.
 *
 * @return {Array} - An array containing the retrieved workspaces.
 */
export function zLintGetWorkspaces( rootPkgPath = __Z_ESLINT_CONFIG__.zRootPackagePath ) {
    return Object.values(
        JSON.parse( fs.readFileSync( rootPkgPath ) ).workspaces
    );
}

/**
 * Returns the default configuration for eslint.
 *
 * @param {Array<String>} [workspaces=zLintGetWorkspaces()] - The list of workspaces to include in the configuration.
 *
 * @return {import('eslint').Linter.FlatConfig[]} The default configuration for zLint.
 */
export function zLintGetDefaultConfig( workspaces = zLintGetWorkspaces() ) {
    return [
        {
            files: workspaces.map( ( p ) => `${ p.startsWith( "." ) ? p.substring( 1 ) : p + "/" }**/*.{ts,tsx}` ),

            languageOptions: {
                // Specifies the parser to use for linting (TypeScript)
                "parser": TSLintParser,

                parserOptions: {
                    "ecmaVersion": "latest",
                    "sourceType": "module",

                    "project": workspaces.map( ( p ) => `${ p }/tsconfig.eslint.json` ),
                },
            },

            // Specifies ESLint plugins used in this configuration
            plugins: {
                "@typescript-eslint": TypeScriptPlugin,
                "import": fixupPluginRules( ImportPlugin ),
                "@zenflux": ZenFluxPlugin,
            },

            // Configuration settings for import plugin and TypeScript
            settings: {
                "import/parsers": {
                    // Specify file extensions for TypeScript
                    "@typescript-eslint/parser": [ ".ts", ".tsx" ],

                    // Issue with `eslint-plugin-import` - https://github.com/import-js/eslint-plugin-import/issues/2556
                    espree: [ ".js", ".cjs", ".mjs", ".jsx" ],
                },
                "import/resolver": {
                    "typescript": {
                        // Always try to use types when resolving
                        "alwaysTryTypes": true,

                        "project": workspaces.map( ( p ) => `${ p }/tsconfig.eslint.json` ),
                    },
                    // Use Node.js module resolution strategy
                    "node": true,
                }
            },

            // Rules configuration for ESLint
            rules: {
                // Merge recommended and TypeScript rules
                ...ImportPlugin.configs.recommended.rules,
                ...ImportPlugin.configs.typescript.rules,

                // Disable the no-unused-vars rule
                "no-unused-vars": "off",
                // Disable unused expressions rule for TypeScript
                "@typescript-eslint/no-unused-expressions": "off",
                // Enable TypeScript specific unused variable rule
                "@typescript-eslint/no-unused-vars": [
                    "error",
                    {
                        vars: "all",
                        args: "after-used",
                        ignoreRestSiblings: true,
                        argsIgnorePattern: "^_",
                        varsIgnorePattern: "^_",
                    },
                ],
                // Enforce explicit member accessibility
                "@typescript-eslint/explicit-member-accessibility": "error",

                "import/default": "off",
                // Custom rules
                "@zenflux/no-relative-imports": "error",

                "no-restricted-imports": [
                    "error",
                    {
                        "patterns": [ {
                            "group": [
                                "./*",
                                "../*",
                                "!*../package.json"
                            ],
                            "message": "Please use path aliases import e.g. import { foo } from '@/foo';",
                        } ],
                    },
                ],

                // https://typescript-eslint.io/blog/consistent-type-imports-and-exports-why-and-how
                // It also helps to avoid circular dependencies
                "@typescript-eslint/consistent-type-exports": "error",
                "@typescript-eslint/consistent-type-imports": "error",
                "@typescript-eslint/no-import-type-side-effects": "error",

                "import/consistent-type-specifier-style" : "error",

                // Disable named-as-default rule for import
                "import/no-named-as-default": "off",
                // Disable named-as-default-member rule for import
                "import/no-named-as-default-member": "off",
                // Detect circular dependencies
                "import/no-cycle": "error",
                // Enforce imports to be at the beginning of the file
                "import/first": "error",
                // Prevent duplicate imports
                "import/no-duplicates": "error",
                // Ensure imported modules can be resolved
                "import/no-unresolved": "error",
                // Enforce newline after imports
                "import/newline-after-import": "error",
                // Specify import order rules
                "import/order": [
                    "error",
                    {
                        // Define the order of import groups
                        "groups": [
                            "builtin",
                            "external",
                            "index",
                            "sibling",
                            "parent",
                            "internal",
                            "object",
                            "type",
                            "unknown",
                        ],
                        // Add newlines between import groups
                        "newlines-between": "always-and-inside-groups",
                        // Allow multiple imports from the same module
                        "distinctGroup": false,

                        // "alphabetize": {
                        //     // "order": "asc",
                        //     // "caseInsensitive": true,
                        //     "orderImportKind": "asc"
                        // },
                        "warnOnUnassignedImports": true,
                    },
                ],
                // Enforce Unix line endings
                "linebreak-style": [
                    "error",
                    "unix",
                ],
                // Enforce double quotes
                "quotes": [
                    "error",
                    "double",
                ],
                // Enforce semicolons at the end of statements
                "semi": [
                    "error",
                    "always",
                ],
                // Enforce a newline at the end of the file
                "eol-last": [
                    "error",
                    "always",
                ],
                // Disallow trailing spaces
                "no-trailing-spaces": [ "error" ],
                // Enforce a maximum of one empty line
                "no-multiple-empty-lines": [
                    "error",
                    {
                        max: 1,
                    },
                ],
            },
        },
        {
            ignores: [
                "**/*.js",
                "**/*.d.ts",

                // "**/zenflux.*.config.ts",

                "**/dist/**",
                "**/bin/**",
                "**/zenflux.config.ts",
                "**/node_modules/**",
                "**/.backups/**",
            ],
        }
    ];
}

