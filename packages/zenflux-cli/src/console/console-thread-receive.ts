/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { DEFAULT_WORKER_CONSOLE_EVENTS } from "@zenflux/worker/definitions";

import { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

import type { TConsoleLoggerMethod } from "@zenflux/cli/src/modules/console/console";
import type { WorkerServer } from "@zenflux/worker/worker-server";

/**
 * The `ConsoleThreadReceive` class is an adapter like, a part of a console system that is designed to handle console output in a multithreaded environment.
 *
 * It extends the `ConsoleThreadFormat` class, which is a wrapper around the native `console` that allows for console output to be formatted in a specific way.
 *
 * It allows for console output to be handled in a way that is aware of the multithreaded environment,
 * ensuring that messages from different threads are outputted correctly.
 */
export class ConsoleThreadReceive extends ConsoleThreadFormat {
    public static connect( worker: WorkerServer, console: ConsoleThreadFormat ) {
        const newConsole = new ConsoleThreadReceive( console, worker.getId() );

        DEFAULT_WORKER_CONSOLE_EVENTS.forEach( ( event ) => {
            worker.on( event, ( ... args: any[] ) => {
                newConsole[ event ].call( newConsole, ... args );
            } );
        } );

        return newConsole;
    }

    protected constructor(
        private console: ConsoleThreadFormat,
        private threadId: string
    ) {
        super();
    }

    public getName(): string {
        return this.console.getName();
    }

    public getThreadId() {
        return this.threadId.match( /\d+/ )?.[ 0 ] ?? this.threadId;
    }

    public getThreadCode(): string {
        return this.console.getThreadCode();
    }

    public getPrefix(): string {
        // Behave same as `this.console` but with different threadId.
        return this.console.getPrefix.call( this );
    }

    public output( method: TConsoleLoggerMethod, args: any[] ) {
        // Behave same as `this.console` but with different threadId.
        this.console.output( method, args, this.prepareFormat.bind( this ) );
    }

    protected prepareFormat( args: any[], method: ( ( ... args: any[] ) => void ) | ( ( callback: () => any ) => void ) ) {
        args = this.console.getArgs( method, args );

        if ( this.prefix.length ) {
            args.unshift( this.prefix );
        }

        if ( this.console.getFormat ) {
            args = [ this.console.getFormat( method, args ) ];
        }

        return args;
    }
}
