/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "process";

import { Console } from "node:console";

// eslint-disable-next-line no-restricted-imports
import packageJSON from "../../../package.json";

export * from "@zenflux/cli/src/modules/console/console-menu";
export * from "@zenflux/cli/src/modules/console/console-menu-checkbox";
export * from "@zenflux/cli/src/modules/console/console-menu-hotkey";

export const console = new class extends Console {
    public readonly prefix: string;

    public constructor( stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream ) {
        super( stdin, stdout );

        if ( ! process.argv.includes( "--verbose" ) ) {
            this.verbose = () => {};
        }

        this.prefix = `[${ packageJSON.name }@${ packageJSON.version }]:`;
    }

    public prompt( message: string ): Promise<string> {
        return new Promise( ( resolve ) => {
            console.log( message );

            process.stdin.resume();
            process.stdin.once( "data", ( data ) => {
                process.stdin.pause();

                resolve( data.toString().trim() );
            } );
        } );
    }

    public confirm( message: string ): Promise<boolean> {
        return new Promise( async ( resolve ) => {
            const answer = await this.prompt( `${ message } (y/n)` );

            resolve( answer === "y" );
        } );
    }

    public log( ... args: any[] ) {
        return super.log.apply( this, [
            this.prefix,
            ... args
        ] );
    }

    public error( ... args: any[] ) {
        return super.error.apply( this, [
            this.prefix,
            "\x1b[31m",
            ... args,
            "\x1b[0m"
        ] );
    }

    public warn( ... args: any[] ) {
        return super.warn.apply( this, [
            this.prefix,
            ... args
        ] );
    }

    public info( ... args: any[] ) {
        return super.info.apply( this, [
            this.prefix,
            ... args
        ] );
    }

    public verbose( callback: () => any ) {
        let result = callback();

        result = Array.isArray( result ) ? result : [ result ];

        return super.log.apply( this, [
            this.prefix,
            ... result
        ] );
    }
}( process.stdin, process.stdout );

export default console;
