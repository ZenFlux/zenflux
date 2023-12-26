import type { IZConfig } from "@zenflux/cli";

const config: IZConfig = {
    format: [ "cjs" ],

    extensions: [ ".ts" ],

    inputPath: "src/index.ts",

    outputName: "@zenflux/react-cache",
    outputFileName: "zenflux-react-cache",

    external: [
        "react"
    ],
};

export default config;
