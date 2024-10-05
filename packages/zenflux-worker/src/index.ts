/// <reference types="@zenflux/typescript-vm/import-meta" />

/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "fs";
import { fileURLToPath } from "node:url";

import { WorkerServer } from "@zenflux/worker/worker-server";

import type { DCreateWorkerArguments } from "@zenflux/worker/definitions";

declare module globalThis {
    var zWorkersCount: number;
}

if ( ! globalThis.zWorkersCount ) {
    globalThis.zWorkersCount = 0;
}

export function zWorkerGetCount() {
    return globalThis.zWorkersCount;
}

export async function zCreateWorker( args: DCreateWorkerArguments ) {
    const {
        name,
        id = zWorkerGetCount().toString(),
        display = name,
        workFunction,
        workFilePath = import.meta.refererUrl ? fileURLToPath( import.meta.refererUrl ) : undefined,
        workArgs = []
    } = args;

    let isExist = false;

    try {
        isExist = workFilePath && fs.existsSync( workFilePath );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch ( e ) {
    }

    if ( ! isExist ) {
        throw new Error( `File not found: ${ workFilePath }` );
    }

    const worker = new WorkerServer( name,
        id.toString(),
        display,
        workFunction,
        workFilePath,
        workArgs
    );

    await worker.initialize();

    return worker;
};
