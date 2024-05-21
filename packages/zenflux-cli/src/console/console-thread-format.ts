import process from "node:process";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { TConsoleLoggerMethod } from "@zenflux/cli/src/modules/console/console";

const stdout = process.stdout,
    stderr = process.stderr;

export abstract class ConsoleThreadFormat extends ConsoleManager.module() {
    public constructor() {
        super( {
            stdout,
            stderr
        } );

        if ( this.getFormatExtended && ( ConsoleManager.isFlagEnabled( "verbose" ) || ConsoleManager.isFlagEnabled( "debug" ) ) ) {
            this.getFormat = this.getFormatExtended;
        }
    }

    public abstract getName(): string;

    public abstract getThreadId(): number|string;

    public abstract getThreadCode(): string;

    /**
     * Function getFormatExtended(): Give the ability to set different format while verbose or debug is enabled.
     */
    protected getFormatExtended?( method: TConsoleLoggerMethod, args: any[] ): string;
}
