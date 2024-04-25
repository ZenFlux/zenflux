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
}
