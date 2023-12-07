import type { IZConfigs } from "@zenflux/cli";

export const configs: IZConfigs = {
    $defaults: {
        format: [ "es", "cjs" ],

        extensions: [ ".ts" ],

        external: [
            "react",
        ],
    },
    "@zenflux/react-x-env": {
        inputPath: "src/index.ts",
        outputFileName: "react-x-env",
    },
    "@zenflux/react-x-env.internals": {
        inputPath: "src/react-internals.ts",
        outputFileName: "react-x-env.internals",
    },
};

export default configs;

