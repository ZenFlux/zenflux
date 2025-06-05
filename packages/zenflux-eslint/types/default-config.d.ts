import type { TSESLint } from "@typescript-eslint/utils";
import { Linter } from "eslint";

export type ESLintTSLintCompatible = Omit<TSESLint.FlatConfig.Config, "languageOptions"> & {
    languageOptions?: {
        parser?: any;
        [ key: string ]: any;
    };
    plugins?: any;
};

export function zLintDefaultConfig( files: string[], workspaces: string[] ): ESLintTSLintCompatible[];

export function zLintDefaultExclude( addToExclude: string[] ): string[];
