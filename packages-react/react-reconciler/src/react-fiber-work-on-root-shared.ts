// Used to quickly bail out of flushSync if there's no sync work to do.
import type { FlushSyncWorkOnAllRootsCallback } from "@zenflux/react-reconciler/src/react-fiber-work-on-root";

let mightHavePendingSyncWork: boolean = false;
let isFlushingWork: boolean = false;

export class ReactFiberWorkOnRootShared {
    public static isFlushingWork() {
        return isFlushingWork;
    }

    public static setIsFlushingOnWork() {
        isFlushingWork = true;
    }

    public static unsetIsFlushingOnWork() {
        isFlushingWork = false;
    }

    public static hasPendingSyncWork() {
        return mightHavePendingSyncWork;
    }

    public static setHavePendingSyncWork() {
        mightHavePendingSyncWork = true;
    }

    public static unsetHavePendingSyncWork() {
        mightHavePendingSyncWork = false;
    }

    public static flushSyncWorkOnAllRoots: FlushSyncWorkOnAllRootsCallback;
    public static flushSyncWorkOnLegacyRootsOnly: FlushSyncWorkOnAllRootsCallback;
}
