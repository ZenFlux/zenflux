/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "process";

import { Console } from "@zenflux/cli/src/modules/console/console";

import packageJSON from "@zenflux/cli/package.json" assert { type: "json" };

export class ConsoleManager extends Console {
    private static instance: Console;

    public static getInstance() {
        if ( ! ConsoleManager.instance ) {
            ConsoleManager.instance = new ConsoleManager( {
                stdout: process.stdout,
                stderr: process.stderr,
            } );
        }

        return ConsoleManager.instance;
    }

    public static setInstance( instance: Console ) {
        ConsoleManager.instance = instance;
    }

    public static get $() {
        return ConsoleManager.getInstance();
    }

    public static module() {
        return Console;
    }

    protected setPrefix( prefix: string ) {
        this.prefix = `[${ packageJSON.name }@${ packageJSON.version }]:` + prefix;
    }

    public message( id: number | string, subject: string, action: string, ... args: any[] ) {
        const paddedArgs = args.map( arg => String( arg ).padEnd( 50 ) ).join( "\t" );

        // Capitalize subject and Action
        subject = subject.charAt( 0 ).toUpperCase() + subject.slice( 1 );
        action = action.charAt( 0 ).toUpperCase() + action.slice( 1 );

        super.log( [ "Thread", id, subject, action, "\t", paddedArgs ].join( "\t" ) );
    }
}
