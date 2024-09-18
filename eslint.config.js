import { zLintGetConfig } from "@zenflux/eslint";

/** @type {import('eslint').Linter.FlatConfig[]} */
export const tests = [
    {
        ignores: [
            "**/eslint.config.*",
            "**/*jest.config.ts",
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
    },
];

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
    ...( await zLintGetConfig() ),
    ...tests,
];


export default config;
