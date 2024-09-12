import { isMainThread } from "node:worker_threads";

export function ensureInWorker() {
    if ( isMainThread ) {
        throw new Error( "This function must be called from a worker thread." );
    }
}
