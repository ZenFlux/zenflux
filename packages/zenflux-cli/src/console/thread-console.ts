/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { ThreadHost } from "@zenflux/cli/src/modules/threading/thread";

const stdout = process.stdout,
    stderr = process.stderr;

export class ThreadConsole extends ConsoleManager.module() {
    public constructor( private host: ThreadHost ) {
        super( { stdout, stderr } );
    }

    public log( ... args: any[] ): any {
        this.host.sendMessage( "message", ...args );
    }

    public error( ... args: any[] ) {
        if ( args[ 0 ] instanceof Error ) {
            throw args[ 0 ];
        }

        this.host.sendMessage( "error", ...args );
    }

    public warn( ... args: any[] ): any {
        this.host.sendMessage( "message", ...args );
    }

    public info( ... args: any[] ): any {
        this.host.sendMessage( "message", ...args );
    }

    public message( ... args: any[] ): any {
        this.host.sendMessage( "message", ...args );
    }

    public verbose( context: any ): any {
        if ( ! process.argv.includes( "--verbose" ) ) {
            return;
        }

        let args;

        if ( context instanceof Function ) {
            args = context();
        }

        args = Array.isArray( args ) ? args : [ args ];

        this.host.sendMessage( "verbose", ...args );
    }

    public debug( context: any ): any {
        let args;

        if ( context instanceof Function ) {
            args = context();
        }

        args = Array.isArray( args ) ? args : [ args ];

        this.host.sendMessage( "debug", ...args );
    }
};
