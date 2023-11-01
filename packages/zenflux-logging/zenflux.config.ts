import type { IZConfig } from "@zenflux/cli";

const config: IZConfig = {
    format: [ "es" ],
    extensions: [ ".ts" ],
    inputPath: "src/index.ts",
    outputName: "@zenflux/logging",
    outputFileName: "zenflux-logging",
    external: [
        "@zenflux/core",
    ],
};

export default config;
