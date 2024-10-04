import type { TSESLint } from "@typescript-eslint/utils";
import { Linter } from "eslint";

export type ESLintTSLintCompatible = Omit<TSESLint.FlatConfig.Config, "languageOptions"> & {
    languageOptions?: ( TSESLint.FlatConfig.Config["languageOptions"] | Linter.Config["languageOptions"] ) & {
        parser?: any,
    }
    plugins?: any;
}

export function zLintDefaultConfig( files: string[], workspaces: string[] ): ESLintTSLintCompatible;

export function zLintDefaultExclude( addToExclude: string[] ): string[]
