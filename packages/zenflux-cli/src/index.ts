/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import process from "node:process";

import { CommandConfigBase } from "@zenflux/cli/src/base/command-config-base";

import { console } from "@zenflux/cli/src/modules/console";

export default async function boot( args = process.argv.slice( 2 ) ) {
    const commands = {
        "@watch": {
            module: async () => ( await import( "@zenflux/cli/src/commands/watch" ) ).default,
        },

        "@build": {
            module: async () => ( await import( "@zenflux/cli/src/commands/build" ) ).default,
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
        console.log( "available commands:" );
        console.log( util.inspect( Object.keys( commands ).map(
            ( name ) => ( `@z-cli ${ name } --help` )
        ) ) );

        console.log( "global options",  util.inspect( {
            "--zvm-verbose":"Log tsnode-vm verbose, shows modules resolution",
            "--verbose": "Log verbose",
            "--help": "Show help",
        } ) );

        return;
    }

    const command = new ( await runner.module() )( args.slice( 1 ), {
        name: `@z-cli ${ args[ 0 ] }`,
    } );

    if ( command instanceof CommandConfigBase ) {
        await command.loadConfigs();
    }

    await command.run();
}

util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.breakLength = 1;
