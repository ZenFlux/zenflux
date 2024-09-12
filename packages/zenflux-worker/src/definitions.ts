export interface ThreadHost {
    name: string;
    id: number;
    display: string;

    sendMessage( type: string, ... args: any[] ): void;

    sendLog( ... args: any[] ): void;

    sendWarn( ... args: any[] ): void;

    sendInfo( ... args: any[] ): void;

    sendVerbose( ... args: any[] ): void;

    sendDebug( ... args: any[] ): void;
}

export const DEFAULT_WORKER_EVENTS: TWorkerEvent[] = [ "log", "warn", "error", "verbose", "info", "debug" ];

export type TWorkerEvent = "log" | "warn" | "error" | "verbose" | "info" | "debug";

export type TWorkerState =
    "created"
    | "running"
    | "idle"
    | "skip-run"
    | "terminated"
    | "kill-request"
    | "killed"
    | "error";
