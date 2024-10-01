import { Config } from "@jest/types";

const config: Config.InitialProjectOptions = {
    testRegex: "(/test/.*\\.spec\\.ts)$",

    setupFilesAfterEnv: [ "<rootDir>/test/__setup__.ts" ],
};

export default config;

