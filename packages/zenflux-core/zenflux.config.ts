import type { IZConfig } from "@zenflux/cli";

const config: IZConfig = {
    format: [ "es", "cjs" ],

    extensions: [ ".ts" ],

    inputPath: "src/index.ts",

    outputName: "@zenflux/core",
    outputFileName: "zenflux-core",

    inputDtsPath: "dist/src/index.d.ts",
    outputDtsPath: "dist/zenflux-core.d.ts",
    importsDtsReplace: ["/src/", "/dist/src/"]
};

export default config;
