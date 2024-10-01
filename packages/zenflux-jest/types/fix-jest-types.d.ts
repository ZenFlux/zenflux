import type {Config} from '@jest/types';
import {AggregatedResult} from '@jest/test-result';

declare module "@jest/core" {
    /**
     * @note Fix `runCLI` according it real params
     * @see https://github.com/jestjs/jest/blob/4e56991693da7cd4c3730dc3579a1dd1403ee630/packages/jest-core/src/cli/index.ts#L52
     * @see https://github.com/jestjs/jest/blob/4e56991693da7cd4c3730dc3579a1dd1403ee630/packages/jest-config/src/index.ts#L34
     */
    export function runCLI(
        argv: Config.Argv,
        projects: Array<string | Config.InitialOptions | Config.ProjectConfig>,
    ): Promise<{
        results: AggregatedResult;
        globalConfig: Config.GlobalConfig;
    }>;
}
