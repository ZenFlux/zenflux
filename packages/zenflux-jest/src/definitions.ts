import type { Config } from "@jest/types";

import type { Package } from "@zenflux/cli/src/modules/npm/package";

export interface DZJestProjectConfigInterface {
    pkg: Package;
    config: Config.ProjectConfig | Config.InitialOptions;
    configPath: string;
    normalized?: Config.ProjectConfig,
}

