import { zLintGetConfig } from "@zenflux/eslint";
import util from "node:util";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
    {
        ignores: [
            "**/eslint.config.*",
            "**/*jest.config.ts",
            "**/vite.config.*",
            "**/*.cjs"
        ],
    },
    ...( await zLintGetConfig() ),
];

if ( process.argv.includes( "--print-config" ) ) {
    console.log( util.inspect( config, { depth: null } ) );
    process.exit( 0 )
}

export default config;

