/* eslint.config.js */
import { zLintGetConfig } from '@zenflux/eslint';

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
    ...( await zLintGetConfig( {
        workspaces: [ "." ],
        files: [ 'src/**/*.{ts,tsx}' ],
        excludeProjectsWithConfig: false,
    } ) ),
];

export default config;
