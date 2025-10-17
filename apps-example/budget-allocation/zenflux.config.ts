import type { IZConfig } from "@zenflux/cli";

const config: IZConfig = {
    format: [ "es" ],
    extensions: [ ".ts", ".tsx" ],
    inputPath: "src/main.tsx",
    outputName: "@zenflux/app-budget-allocation",
    outputFileName: "budget-allocation",
};

export default config;
