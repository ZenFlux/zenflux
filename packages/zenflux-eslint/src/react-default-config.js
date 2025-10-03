import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";

import { zLintDefaultConfig } from "./default-config.js";

/**
 * @param {string[]} files
 * @param {string[]} workspaces
 * @returns {import("../types/default-config.d.ts").ESLintTSLintCompatible[]}
 */
export function zLintReactDefaultConfig( files, workspaces ) {
    const base = zLintDefaultConfig( files, workspaces ),
        { files: baseFiles } = base[ 0 ];

    return [
        ...base,
        {
            files: baseFiles,
            plugins: {
                "react-refresh": reactRefreshPlugin,
            },
            rules: {
                "react-refresh/only-export-components": [
                    "warn",
                    { allowConstantExport: true },
                ],
            }
        },
        {
            files: baseFiles,
            plugins: {
                react: reactPlugin,
            },
            rules: {
                ...reactPlugin.configs.recommended.rules,
                ...reactPlugin.configs[ "jsx-runtime" ].rules,
            },
            settings: {
                react: {
                    version: "detect",
                },
            },
        },
        {
            files: baseFiles,
            plugins: {
                "react-hooks": hooksPlugin,
            },
            rules: {
                "react-hooks/rules-of-hooks": "error",
                "react-hooks/exhaustive-deps": "warn",
            },
        },
        {
            ignores: [ "dist", "eslint.config.js" ],
        },
    ];
}

export default zLintReactDefaultConfig;


