import type { IZConfigs } from "@zenflux/cli";

const configs: IZConfigs = {
    $defaults: {
        format: [ "es", "cjs" ],
        extensions: [ ".ts" ],
    },
    "@zenflux/react-scheduler": {
        inputPath: "src/index.ts",
        outputFileName: "zenflux-react-scheduler",
        inputDtsPath: "dist/src/index.d.ts",
        outputDtsPath: "dist/zenflux-react-scheduler.d.ts",
    },
    "@zenflux/react-scheduler/mock": {
        inputPath: "src/index.mock.ts",
        outputFileName: "zenflux-react-scheduler.mock",
        inputDtsPath: "dist/src/index.mock.d.ts",
        outputDtsPath: "dist/zenflux-react-scheduler.mock.d.ts",
    }
};

export default configs;

