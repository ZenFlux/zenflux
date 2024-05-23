/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { TConsoleLoggerMethod } from "@zenflux/cli/src/modules/console/console";

const stdout = process.stdout,
    stderr = process.stderr;

/**
 * ConsoleThreadFormat is an abstract class that provides a structure for formatting console threads.
 * It also provides the ability to switch formatting based on logging level.
 */
export abstract class ConsoleThreadFormat extends ConsoleManager.module() {
    /**
     * The constructor checks if the getFormatExtended method is defined and if either the verbose or debug flags are enabled.
     * If these conditions are met, it replaces the getFormat method with the getFormatExtended method.
     */
    public constructor() {
        super( {
            stdout,
            stderr
        } );

        if ( this.getFormatExtended && ( ConsoleManager.isFlagEnabled( "verbose" ) || ConsoleManager.isFlagEnabled( "debug" ) ) ) {
            this.getFormat = this.getFormatExtended;
        }
    }

    /**
     * Abstract method that should return the name of the thread.
     * This method is expected to be implemented by any class that extends ConsoleThreadFormat.
     */
    public abstract getName(): string;

    /**
     * Abstract method that should return the ID of the thread.
     * This method is expected to be implemented by any class that extends ConsoleThreadFormat.
     */
    public abstract getThreadId(): number|string;

    /**
     * Abstract method that should return the code of the thread.
     * This method is expected to be implemented by any class that extends ConsoleThreadFormat.
     */
    public abstract getThreadCode(): string;

    /**
     * Optional method that, if implemented in a subclass, should return a string that represents a different format for verbose or debug logging.
     */
    protected getFormatExtended?( method: TConsoleLoggerMethod, args: any[] ): string;
}
