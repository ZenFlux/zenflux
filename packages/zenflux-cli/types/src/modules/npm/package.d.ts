import { Registry } from ".//src/modules/npm/registry";
import type { TForceEnumKeys } from ".//src/utils/common";
interface PublishResponse {
    ok: boolean;
    status: number;
    statusText: string;
    headers: any;
    json(): Promise<unknown>;
    text(): Promise<string>;
}
export type TPackages = {
    [packageName: string]: Package;
};
export type TPackageDependencies = {
    [packageName: string]: string;
};
export type TPackagePartialDependencies = {
    dependencies?: TPackageDependencies;
    devDependencies?: TPackageDependencies;
    peerDependencies?: TPackageDependencies;
};
export type TPackagePartialJson = TPackagePartialDependencies & {
    name: string;
    workspaces?: string[];
    version?: string;
    files?: string[];
    publishConfig?: {
        access: string;
    };
};
export type TNewPackageOptions = {
    registryUrl: string;
    npmRcPath: string;
};
export declare class Package {
    private projectPath;
    private options;
    json: TPackagePartialJson;
    private registry;
    private publishFiles;
    constructor(projectPath?: string, options?: TNewPackageOptions);
    loadRegistry(): Promise<Registry>;
    saveAs(path: string): void;
    publish(): Promise<PublishResponse>;
    private getToken;
    getPath(): string;
    getDisplayName(): string;
    getDependencies(keys?: TForceEnumKeys<TPackagePartialDependencies>): TPackagePartialDependencies;
    getPublishFiles(cache?: boolean): Promise<string[]>;
    getPublishFilesCache(): string[];
}
export {};
//# sourceMappingURL=package.d.ts.map