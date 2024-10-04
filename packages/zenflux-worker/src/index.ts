/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "fs";
import { fileURLToPath } from "node:url";

import { WorkerServer } from "@zenflux/worker/worker-server";

declare module globalThis {
    var zWorkersCount: number;
}

if ( ! globalThis.zWorkersCount ) {
    globalThis.zWorkersCount = 0;
}

export function zWorkerGetCount() {
    return globalThis.zWorkersCount;
}

interface ZCreateWorkerArguments {
    name: string;
    id?: number;
    display?: string;
    workFunction: Function;
    workFilePath?: string;
    workArgs?: any[]
}

export const zCreateWorker: ( args: ZCreateWorkerArguments ) => WorkerServer = ( {
   name,
   id = zWorkerGetCount(),
   display = name,
   workFunction,
   workFilePath = import.meta.refererUrl ? fileURLToPath( import.meta.refererUrl ) : undefined,
   workArgs = []
} ) => {
    let isExist = false;

    try {
        isExist = workFilePath && fs.existsSync( workFilePath );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch ( e ) {
    }

    if ( ! isExist ) {
        throw new Error( `File not found: ${ workFilePath }` );
    }

    return new WorkerServer( name, id, display, workFunction, workFilePath, workArgs );
};
