import type { IZConfigs } from "@zenflux/cli";

const configs: IZConfigs = {
    $defaults: {
        format: [ "es", "cjs" ],

        extensions: [ ".ts", ".tsx" ],

        external: [
            "react",
            "@zenflux/react-scheduler"
        ],

        enableCustomLoader: true,
    },

    "@zenflux/react-reconciler": {
        inputPath: "src/index.ts",
        outputFileName: "zenflux-react-reconciler",

        inputDtsPath: "dist/react-reconciler/src/index.d.ts",
        outputDtsPath: "dist/zenflux-react-reconciler.d.ts",
    },

    "@zenflux/react-reconciler-constants": {
        inputPath: "src/constants.ts",
        outputFileName: "zenflux-react-reconciler.constants",

        inputDtsPath: "dist/react-reconciler/src/constants.d.ts",
        outputDtsPath: "dist/zenflux-react-reconciler.constants.d.ts",
    }
};

export default configs;
