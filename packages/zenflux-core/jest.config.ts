// @ts-ignore
import tsconfig from "./tsconfig.paths.json";

import { Config } from "@jest/types";

import { pathsToModuleNameMapper } from "ts-jest";

const config: Config.InitialProjectOptions = {
    // Define regular expression patterns for test file names
    testRegex: "(/test/.*\\.spec\\.ts)$",

    modulePaths: [ tsconfig.compilerOptions.baseUrl ],
    moduleNameMapper: pathsToModuleNameMapper( tsconfig.compilerOptions.paths ),

    // Set up files to be executed before tests run
    setupFilesAfterEnv: [ "<rootDir>/test/__setup__.ts" ],

    // Avoid babel transformation.
    transform: {
        '^.+\\.(ts|tsx)?$': ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
    },
};

export default config;
