"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config = {
    format: ["es", "cjs"],
    extensions: [".ts"],
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
exports.default = config;
