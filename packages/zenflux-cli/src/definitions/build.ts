import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

export type TZBuildOptions = {
    silent?: boolean;
    thread?: number,
    config: IZConfigInternal
}
