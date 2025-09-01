import { fixupPluginRules } from "@eslint/compat";

import TSLint from "typescript-eslint";

import ImportPlugin from "eslint-plugin-import";

import StylisticPlugin from "@stylistic/eslint-plugin"

const ZenFluxPlugin = ( await import( "./plugin.js" ) ).default;

/**
 * @param {string[]} files
 * @param {string[]} workspaces
 *
 * @returns {import("../types/default-config.d.ts").ESLintTSLintCompatible[]}
 */
export function zLintDefaultConfig( files, workspaces ) {
    return [
        {
            files,
            languageOptions: {
                // Specifies the parser to use for linting (TypeScript)
                parser: TSLint.parser,

                parserOptions: {
                    "ecmaVersion": "latest",
                    "sourceType": "module",
                    "ecmaFeatures": {
                        "jsx": true
                    },

                    "project": workspaces.map( ( p ) => `${ p }/tsconfig.eslint.json` ),
                },
            },

            // Specifies ESLint plugins used in this configuration
            plugins: {
                "@typescript-eslint": TSLint.plugin,
                "@stylistic": StylisticPlugin,
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

                "import/consistent-type-specifier-style": "error",

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
                // Configure indentation with JSX support
                "indent": "off",
                "@stylistic/indent": ["error", 4, {
                    "SwitchCase": 1,
                }]
            },
        },
    ];
}

/**
 * Generates a default set of file and directory patterns to be excluded,
 * with an option to add additional patterns.
 *
 * @param {string[]} addToExclude - An optional array of additional file patterns to exclude.
 * @return {string[]} An array containing the default and additional exclusion patterns.
 */
export function zLintDefaultExclude( addToExclude = [] ) {
    return [
        "**/*.js",
        "**/*.d.ts",

        // "**/zenflux.*.config.ts",

        "**/dist/**",
        "**/bin/**",
        "**/zenflux.config.ts",
        "**/node_modules/**",
        "**/.backups/**",

        ... addToExclude,
    ]
}

export default zLintDefaultConfig;
