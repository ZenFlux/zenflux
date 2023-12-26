export type StoreInstance<T> = {
    value: T;
    getSnapshot: () => T;
};
export type StoreConsistencyCheck<T> = {
    value: T;
    getSnapshot: () => T;
};
