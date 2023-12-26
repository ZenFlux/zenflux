export type Cache = {
    controller: AbortController;
    data: Map<() => unknown, unknown>;
    refCount: number;
};

export type CacheComponentState = {
    readonly parent: Cache;
    readonly cache: Cache;
};

export type MemoCache = {
    data: Array<Array<any>>;
    index: number;
};

export type SpawnedCachePool = {
    readonly parent: Cache;
    readonly pool: Cache;
};
