/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { DThreadHostInterface } from "@zenflux/worker/definitions";
import type { TConsoleLoggerMethod } from "@zenflux/cli/src/modules/console/console";

const stdout = process.stdout,
    stderr = process.stderr;

/**
 * `ConsoleThreadSend` is a specialized class for managing sending operations in a multithreaded console environment,
 * leveraging the functionalities provided by ConsoleManager.
 */
export class ConsoleThreadSend extends ConsoleManager.module() {
    public constructor( private host: DThreadHostInterface ) {
        super( { stdout, stderr } );
    }

    public output( method: TConsoleLoggerMethod, args: any[] ) {
        args = this.getArgs( method, args );

        switch ( method ) {
            case this.error:
                if ( args[ 0 ] instanceof Error ) {
                    throw args[ 0 ];
                }

                throw new Error( args.join( " " ) );

            case this.warn:
                this.host.sendWarn( ...args );
                break;

            case this.info:
                this.host.sendInfo( ...args );
                break;

            case this.verbose:
                this.host.sendVerbose( ...args );
                break;

            case this.debug:
                this.host.sendDebug( ...args );
                break;

            case this.log:
                this.host.sendLog( ...args );
                break;

            default:
                throw new Error( `Unknown method: ${ method }` );
        }
    }
};
