export type SuspenseHydrationCallbacks<TSuspenseInstance extends SuspenseInstance = SuspenseInstance> = {
    onHydrated?: ( suspenseInstance: TSuspenseInstance ) => void;
    onDeleted?: ( suspenseInstance: TSuspenseInstance ) => void;
};

export type SuspenseInfo = {
    name: string | null;
};

export interface SuspenseInstance extends Comment {
    _reactRetry?: () => void;
}
