import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

export type TZBuildOptions = {
    silent?: boolean;
    config: IZConfigInternal,
}

export type TZBuildWorkerOptions = TZBuildOptions & {
    thread: number,
    otherConfigs: IZConfigInternal[],
}
