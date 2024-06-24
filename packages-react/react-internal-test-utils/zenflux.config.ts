import type { IZConfig } from "@zenflux/cli";

const config: IZConfig = {
    format: [ "es", "cjs" ],

    extensions: [ ".ts" ],

    inputPath: "src/index.ts",

    outputName: "@zenflux/react-internal-test-utils",
    outputFileName: "zenflux-react-internal-test-utils",

    external: [
        "react",
        "@jest/expect",
        "@jest/expect-utils",
        "jest-diff",
        "@zenflux/react-x-env",
        "@zenflux/react-reconciler",
        "@zenflux/react-scheduler",
        "@zenflux/react-scheduler/mock",
    ],

    enableCustomLoader: true,
};

export default config;
