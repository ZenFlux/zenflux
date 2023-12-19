import BaseConfig from "@zenflux/react-jest/base.jest.config"

import type { Config } from "@jest/types";

const config: Config.InitialProjectOptions = {
    ... BaseConfig,
};

export default config;
