import TypeScriptPlugin from "@typescript-eslint/eslint-plugin";

import ImportPlugin from "eslint-plugin-import";

import * as TSLintParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.FlatConfig[]} */
export const defaults = [
    {
        files: [
            "packages/*/**/*.{ts,tsx}",
        ],

        languageOptions: {
            // Specifies the parser to use for linting (TypeScript)
            parser: TSLintParser,

            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",

                project: [
                    "packages/*/tsconfig.eslint.json",
                ]
            },
        },

        // Specifies ESLint plugins used in this configuration
        plugins: {
            "@typescript-eslint": TypeScriptPlugin,
            "import": ImportPlugin,
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

                    "project": [
                        "packages/*/tsconfig.eslint.json",
                    ]
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

            // https://typescript-eslint.io/blog/consistent-type-imports-and-exports-why-and-how
            // It also helps to avoid circular dependencies
            "@typescript-eslint/consistent-type-exports": "error",
            "@typescript-eslint/consistent-type-imports": "error",

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
                    // Define custom import groupings
                    "pathGroups": [
                        {
                            "pattern": "@internal/**",
                            "group": "internal",
                            "position": "after",
                        },
                        {
                            "pattern": "@zenflux/**",
                            "group": "parent",
                            "position": "after",
                        },
                    ],
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
            // Custom rule: no-restricted-imports
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
            // "import/default" rule
            "import/default": "off",
        },
    },
    {
        ignores: [
            "**/*.js",
            "**/*.d.ts",

            "**/dist/**",
            "**/bin/**",
            "**/node_modules/**",
        ],
    }
];

/** @type {import('eslint').Linter.FlatConfig[]} */
export const tests = [
    {
        ignores: [
            "**/eslint.config.*",
            "**/jest.config.ts",
        ],
    },
    {
        files: [
            "packages/*/test/**/*.{ts,tsx}",
        ],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    "patterns": [ {
                        group: [
                            "@",
                        ],
                        message: "Please use relative imports",
                    } ]
                }
            ],
        },
    }
];

