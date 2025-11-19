export interface DMessageInterface {
    type: DWorkerEvent;

    args?: any[];

    [ key: string ]: any;
}

export interface DThreadHostInterface {
    name: string;
    id: string;
    display: string;

    sendMessage( type: DWorkerEvent, ... args: any[] ): void;

    sendLog( ... args: any[] ): void;

    sendWarn( ... args: any[] ): void;

    sendInfo( ... args: any[] ): void;

    sendVerbose( ... args: any[] ): void;

    sendDebug( ... args: any[] ): void;
}

export interface DWorkerPoolRunControllerInterface {
    failed: ( callback: ( errors: Error ) => void ) => DWorkerPoolRunControllerInterface,
    onAllFailed: ( callback: ( errors: Error[] ) => void ) => DWorkerPoolRunControllerInterface,
    succeed: ( callback: ( workerId: number ) => void ) => DWorkerPoolRunControllerInterface,
    onAllSucceed: ( callback: () => void ) => DWorkerPoolRunControllerInterface,

    execute: ( ... args: any[] ) => Promise<void>,
}

export const DEFAULT_WORKER_CONSOLE_EVENTS = [
    "log",
    "warn",
    "error",
    "verbose",
    "info",
    "debug"
] as const;

// TODO: Separate to Server/Client
export const DEFAULT_WORKER_EVENTS = [ ... DEFAULT_WORKER_CONSOLE_EVENTS,
    "run",
    "done",
    "started",
    "internal-error",
    "add-task",
    "task-completed",
    "terminate"
] as const;

export const DEFAULT_WORKER_STATE = [
    "none",
    "created",
    "running",
    "idle",
    "skip-run",
    "terminated",
    "kill-request",
    "dead",
    "error"
] as const;

export type DWorkerEvent = typeof DEFAULT_WORKER_EVENTS[ number ];

export type DWorkerState = typeof DEFAULT_WORKER_STATE[ number ]

export interface DWorkerTask {
    workFunction: Function | string;
    workArgs?: any[]
}

export interface DWorkerTaskWithWorkPath extends DWorkerTask {
    workFilePath: string;
}

export interface DWorkerTaskInQueue extends DWorkerTaskWithWorkPath {
    status: "queued" | "running" | "done";
}

export interface DCreateWorkerArguments extends DWorkerTask {
    name: string;
    id?: string;
    display?: string;

    workFilePath?: string;
}
