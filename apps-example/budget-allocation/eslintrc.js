import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

import { zLintDefaultConfig } from '@zenflux/eslint';

const defaultConfig = zLintDefaultConfig( [ "." ] ),
    { files } = defaultConfig[ 0 ];

const config = [
    ...defaultConfig,
    {
        files,
        plugins: {
            'react-refresh': reactRefreshPlugin,
        },
        rules: {
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        }
    },
    {
        files,
        plugins: {
            react: reactPlugin,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs[ 'jsx-runtime' ].rules,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        files,
        plugins: {
            'react-hooks': hooksPlugin,
        },
        rules: hooksPlugin.configs.recommended.rules,
    },
    {
        ignores: [ 'dist', 'eslint.config.js' ],
    },
];

export default config;
