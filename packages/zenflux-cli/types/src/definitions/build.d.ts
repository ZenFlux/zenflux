import type { IZConfigInternal } from ".//src/definitions/config";
export type TZBuildOptions = {
    silent?: boolean;
    config: IZConfigInternal;
};
export type TZBuildWorkerOptions = TZBuildOptions & {
    threadId: string;
    otherConfigs: IZConfigInternal[];
};
//# sourceMappingURL=build.d.ts.map