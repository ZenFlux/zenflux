/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
export declare class Registry {
    private readonly packageName;
    private readonly endpoint;
    private readonly response;
    private responseStatus;
    private data;
    constructor(packageName: string, registryUrl: string);
    await(): Promise<this>;
    isExists(): boolean;
    getLastVersion(): any;
    isVersionUsed(version: string): any;
}
//# sourceMappingURL=registry.d.ts.map