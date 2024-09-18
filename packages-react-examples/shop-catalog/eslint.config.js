import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import { zLintGetConfig } from '@zenflux/eslint';

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
    ...( await zLintGetConfig( {
        workspaces: [ "." ],
        files: [ 'src/**/*.{ts,tsx}' ],
        excludeProjectsWithConfig: false,
    } ) ),

    {
        ignores: [ 'dist' ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        files: [ './src/**/*.{ts,tsx}' ],
        plugins: {
            "react": reactPlugin,
            'react-refresh': reactRefreshPlugin,
            'react-hooks': hooksPlugin,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs[ 'jsx-runtime' ].rules,
            ...hooksPlugin.configs.recommended.rules,
            ...{ 'react-refresh/only-export-components': [ 'warn', { allowConstantExport: true }, ], },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
];

export default config;
