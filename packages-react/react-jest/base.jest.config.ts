import type { Config } from "@jest/types";

const config: Config.InitialProjectOptions = {
    transform: {
        "^.+\\.ts?$": "<rootDir>/../react-jest/transformers/ts-transform.js",
        ".*$": "<rootDir>/../react-jest/transformers/react-transform.js",
    },

    setupFiles: [
        "<rootDir>/../react-jest/setup-react-env.js",
    ],

    setupFilesAfterEnv: [
        "<rootDir>/../react-jest/setup-react-test-matchers.js",
        "<rootDir>/../react-jest/setup-react-test-flags.js",
        "<rootDir>/../react-jest/setup-react-test-console.js",
        "<rootDir>/../react-jest/setup-react-test-gates.js",
        "<rootDir>/../react-jest/setup-react-test-spyon.js",
    ],

    modulePaths: [
        "<rootDir>/../../node_modules",
    ],
};

export default config;
