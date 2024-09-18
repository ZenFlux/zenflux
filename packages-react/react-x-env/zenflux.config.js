"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = void 0;
exports.configs = {
    $defaults: {
        format: ["es", "cjs"],
        extensions: [".ts"],
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
    "@zenflux/react-x-env.hooks": {
        inputPath: "src/react-hooks.ts",
        outputFileName: "react-x-env.hooks",
    },
    "@zenflux/react-x-env.act": {
        inputPath: "src/react-act.ts",
        outputFileName: "react-x-env.act",
    },
};
exports.default = exports.configs;
