/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import packageJSON from "@zenflux/cli/package.json" assert { type: "json" };

function ensureZenfluxConfigDirectory() {
    const zConfigDir = path.resolve( os.homedir(), ".z" );

    if ( ! fs.existsSync( zConfigDir ) ) {
        ConsoleManager.$.log( `Creating .z config directory at: '${ zConfigDir }'` );

        try {
            fs.mkdirSync( zConfigDir, { recursive: true } );
        } catch {
            // If we can't create the directory, we'll let the error be handled later
            // This ensures the CLI doesn't fail on permission issues
        }
    }
}

export default async function boot( args = process.argv.slice( 2 ) ) {
    ConsoleManager.$.log( `(${ packageJSON.name }~v${ packageJSON.version }) Starting...`);

    // Ensure .z config directory exists
    ensureZenfluxConfigDirectory();

    const commands = {
        "@watch": {
            module: async () => ( await import( "@zenflux/cli/src/commands/watch" ) ).default,
        },

        "@build": {
            module: async () => ( await import( "@zenflux/cli/src/commands/build" ) ).default,
        },

        "@typecheck": {
            module: async () => ( await import( "@zenflux/cli/src/commands/typecheck" ) ).default,
        },

        "@publish": {
            module: async () => ( await import( "@zenflux/cli/src/commands/publish" ) ).default,
        },

        "@registry": {
            module: async () => ( await import( "@zenflux/cli/src/commands/registry" ) ).default,
        },
    };

    const runner = commands[ args[ 0 ] as keyof typeof commands ];

    if ( ! runner ) {
        ConsoleManager.$.log( "available commands:" );
        ConsoleManager.$.log( util.inspect( Object.keys( commands ).map(
            ( name ) => ( `@z-cli ${ name } --help` )
        ) ) );

        ConsoleManager.$.log( "global options",  util.inspect( {
            "--zvm-verbose":"Log `@zenflux/typescript-vm` verbose, shows modules resolution",
            "--verbose": "Log verbose",
            "--help": "Show help",
        } ) );

        return;
    }

    const command = new ( await runner.module() )( args.slice( 1 ), {
        name: `@z-cli ${ args[ 0 ] }`,
    } );

    await command.run();
}

util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.breakLength = 1;
