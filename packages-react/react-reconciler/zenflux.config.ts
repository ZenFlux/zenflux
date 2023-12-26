import * as process from "node:process";

import type { IZConfigs } from "@zenflux/cli";

const configs: IZConfigs = {
    $defaults: {
        format: [ "es", "cjs" ],

        extensions: [ ".ts", ".tsx" ],

        external: [
            "react",
            "@zenflux/react-x-env",
            "@zenflux/react-x-env/internals",
            "@zenflux/react-scheduler"
        ],
    },

    "@zenflux/react-reconciler": {
        inputPath: "src/index.ts",
        outputFileName: "zenflux-react-reconciler",

        inputDtsPath: /*process.env.NODE_ENV === "development" ? "dist/packages-react/zenflux-react-reconciler/src/index.d.ts" :*/ "dist/src/index.d.ts",
        outputDtsPath: "dist/zenflux-react-reconciler.d.ts",
    },

    "@zenflux/react-reconciler-constants": {
        inputPath: "src/constants.ts",
        outputFileName: "zenflux-react-reconciler.constants",

        inputDtsPath: /*process.env.NODE_ENV === "development" ? "dist/packages-react/zenflux-react-reconciler/src/constants.d.ts" :*/ "dist/src/constants.d.ts",
        outputDtsPath: "dist/zenflux-react-reconciler.constants.d.ts",
    }
};

export default configs;
