import type { IZConfigs } from "@zenflux/cli";

const config: IZConfigs = {
    $defaults: {
        format: [ "cjs" ],

        extensions: [ ".ts" ],

        external: [
            "react",
            "@zenflux/react-x-env",
            "@zenflux/react-x-env/internals",
            "@zenflux/react-reconciler",
            "@zenflux/react-scheduler",
            "@zenflux/react-scheduler/mock",
        ],

        moduleForwarding: {
            "@zenflux/react-reconciler": {
                "@zenflux/react-scheduler": "@zenflux/react-scheduler/mock",
            },
            "@zenflux/react-noop-renderer": {
                "@zenflux/react-scheduler": "@zenflux/react-scheduler/mock",
            }
        },

        enableCustomLoader: true,
        enableCjsAsyncWrap: true,
    },

    "@zenflux/react-noop-renderer": {
        inputPath: "src/index.ts",
        outputFileName: "zenflux-react-noop-renderer",
    },

    "@zenflux/react-noop-renderer/persistent": {
        inputPath: "src/index.persistent.ts",
        outputFileName: "zenflux-react-noop-renderer.persistent",
    }

};

export default config;
