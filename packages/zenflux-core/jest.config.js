"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var tsconfig_paths_json_1 = require("./tsconfig.paths.json");
var ts_jest_1 = require("ts-jest");
var config = {
    // Define regular expression patterns for test file names
    testRegex: "(/test/.*\\.spec\\.ts)$",
    modulePaths: [tsconfig_paths_json_1.default.compilerOptions.baseUrl],
    moduleNameMapper: (0, ts_jest_1.pathsToModuleNameMapper)(tsconfig_paths_json_1.default.compilerOptions.paths),
    // Set up files to be executed before tests run
    setupFilesAfterEnv: ["<rootDir>/test/__setup__.ts"],
    // Avoid babel transformation.
    transform: {
        '^.+\\.(ts|tsx)?$': ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
    },
};
exports.default = config;
