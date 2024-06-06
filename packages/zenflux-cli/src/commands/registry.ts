/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import child_process from "node:child_process";
import util from "node:util";
import fs from "node:fs";

import process from "node:process";

import { fromJStoYAML, parseConfigFile } from "@verdaccio/config";

import { runServer } from "@verdaccio/node-api";

import { zRegistryGetAllNpmRcs, zRegistryGetAllOnlineNpmRcs, zRegistryGetNpmRc } from "@zenflux/cli/src/core/registry";

import { CommandBase } from "@zenflux/cli/src/base/command-base";

import {
    DEFAULT_Z_REGISTRY_HOST,
    DEFAULT_Z_REGISTRY_PASSWORD,
    DEFAULT_Z_REGISTRY_PORT_RANGE,
    DEFAULT_Z_REGISTRY_USER
} from "@zenflux/cli/src/definitions/zenflux";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import { zNetCheckPortOnline, zNetFindFreePort } from "@zenflux/cli/src/utils/net";

export default class Registry extends CommandBase {

    public async run() {
        const args = this.args,
            paths = this.paths;

        const current = zRegistryGetNpmRc( paths.npmRc );

        switch ( args[ 0 ] ) {
            case "@server":
                if ( current && await zNetCheckPortOnline( current.port ) ) {
                    ConsoleManager.$.error( `Verdaccio server is already running on port '${ current.host }:${ current.port }' for workspace '${ paths.workspace }'` );
                    return;
                }

                const port = await zNetFindFreePort( DEFAULT_Z_REGISTRY_PORT_RANGE, DEFAULT_Z_REGISTRY_HOST );

                this.serverEnsureVerdaccioConfig();

                const server = await runServer( paths.verdaccioConfig ),
                    url = `http://${ DEFAULT_Z_REGISTRY_HOST }:${ port }`;

                server.listen( port, async () => {
                    ConsoleManager.$.log( `Server running on port ${ port }` );
                    ConsoleManager.$.log( `You can access the registry at ${ util.inspect( url ) }` );
                    ConsoleManager.$.log( `Username: ${ util.inspect( DEFAULT_Z_REGISTRY_USER ) }` );
                    ConsoleManager.$.log( `Password: ${ util.inspect( DEFAULT_Z_REGISTRY_PASSWORD ) }` );
                    ConsoleManager.$.log( "To close the server, press CTRL + C" );

                    // Check if .htpasswd file exists
                    if ( ! current ) {
                        // Add new user
                        const response = await fetch( `${ url }/-/user/org.couchdb.user:${ DEFAULT_Z_REGISTRY_USER }`, {
                            method: "PUT",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify( {
                                "name": DEFAULT_Z_REGISTRY_USER,
                                "password": DEFAULT_Z_REGISTRY_PASSWORD,
                            } )
                        } );

                        const result = await response.json() as { token: string },
                            data = `//${ DEFAULT_Z_REGISTRY_HOST }:${ port }/:_authToken=${ result.token }`;

                        // Save token to `.z/verdaccio/.npmrc`
                        fs.writeFileSync( paths.npmRc, data );
                    }
                } );

                process.on( "SIGINT", () => {
                    ConsoleManager.$.log( "Shutting down server..." );
                    server.close( () => {
                        ConsoleManager.$.log( "Server closed" );
                        process.exit( 0 );
                    } );
                } );
                break;

            case "@list":
                const onlineHosts = await zRegistryGetAllOnlineNpmRcs();

                if ( onlineHosts.length === 0 ) {
                    ConsoleManager.$.log( "No online registry hosts found" );
                    return;
                }

                // Print hosts
                ConsoleManager.$.log( "Online registry hosts:" );

                onlineHosts.forEach( host =>
                    ConsoleManager.$.log( `Use command: ${ util.inspect( `${ this.options.name } @use ${ host.id }` ) } - host: ${ host.host }:${ host.port }` )
                );

                break;

            // What about bun? or other package managers?
            case "@use":
                // If no arguments then showHelp.
                if ( args.length === 1 ) {
                    return this.showHelp();
                }

                // Get registry host
                const hostId = args[ 1 ],
                    npmRc = zRegistryGetAllNpmRcs().find( ( host => host.id === hostId ) );

                if ( ! npmRc ) {
                    ConsoleManager.$.error( `No registry host found with id '${ hostId }'` );
                    return;
                }

                // Check if host is online
                if ( ! await zNetCheckPortOnline( npmRc.port ) ) {
                    ConsoleManager.$.error( `Registry host '${ npmRc.host }:${ npmRc.port }' is not online` );
                    return;
                }

                // Use npm with custom .npmrc, should be forwarded to npm
                // eg: `z-cli registry use npm install` to `npm --userconfig .z/verdaccio/.npmrc install
                child_process.execSync( [
                    `npm --userconfig ${ npmRc.path } --registry http://${ npmRc.host }:${ npmRc.port }`,
                    ... args.slice( 2 ),
                ].join( " " ), { stdio: "inherit" } );

                break;

            case "@clean":
                if ( ! current ) {
                    ConsoleManager.$.error( "No registry host is available" );
                    return;
                }

                // Check if current is online
                if ( await zNetCheckPortOnline( current.port, current.host ) ) {
                    ConsoleManager.$.error( `Registry host '${ current.host }:${ current.port }' is online, and cannot be deleted while` );
                    return;
                }

                // Remove current `.npmrc`
                fs.unlinkSync( paths.npmRc );

                // Remove verdaccio folder
                fs.rmdirSync( paths.verdaccio, { recursive: true } );

                break;

            default:
                this.showHelp();

        }
    }

    private serverEnsureVerdaccioConfig(): void {
        const paths = this.paths;

        // Check file exists.
        if ( ! fs.existsSync( paths.verdaccioConfig ) ) {
            const DEFAULT_VERDACCIO_CONFIG = {
                "storage": paths.verdaccioStorage,
                "auth": {
                    "htpasswd": {
                        "file": paths.verdaccioHtpasswd,
                    }
                },
                "uplinks": {
                    "npmjs": {
                        "url": "https://registry.npmjs.org/"
                    }
                },
                "packages": {
                    // "@zenflux/*": {
                    //     "access": "$all",
                    //     "publish": "$authenticated"
                    // },
                    "@*/*": {
                        "access": "$all",
                        "publish": "$authenticated",
                        "unpublish": "$authenticated",
                        "proxy": "npmjs"
                    },
                    "**": {
                        "access": "$all",
                        "publish": "$authenticated",
                        "unpublish": "$authenticated",
                        "proxy": "npmjs"
                    }
                },
                "server": {
                    "keepAliveTimeout": 60
                },
                "security": {
                    "api": {
                        "legacy": true
                    }
                },
                "middlewares": {
                    "audit": {
                        "enabled": true
                    }
                },
                "log": {
                    "type": "stdout",
                    "format": "pretty",
                    "level": "trace"
                },
                "i18n": {
                    "web": "en-US"
                },
                "configPath": paths.verdaccioConfig,
            };

            ConsoleManager.$.log( `Creating config file at: '${ paths.verdaccioConfig }'` );

            // Create config file
            fs.mkdirSync( paths.verdaccio, { recursive: true } );
            fs.writeFileSync( paths.verdaccioConfig, fromJStoYAML( DEFAULT_VERDACCIO_CONFIG ) as string );
        }

        ConsoleManager.$.log( `Reading config from: '${ paths.verdaccioConfig }'` );

        const verdaccioConfig = parseConfigFile( paths.verdaccioConfig );

        // What happen if the project relocated?
        if ( verdaccioConfig.configPath !== paths.verdaccioConfig ) {
            ConsoleManager.$.log( "Config path change detected, recreating..." );

            // Delete config.
            fs.unlinkSync( paths.verdaccioConfig );

            return this.serverEnsureVerdaccioConfig();
        }

        ConsoleManager.$.log( `Reading workspace package.json from: '${ paths.workspace }'` );

        const rootPkg = new Package( paths.workspace ),
            companyPrefix = `${ rootPkg.json.name.split( "/" )[ 0 ] }/*`;

        // Ensure that workspace packages are added to verdaccio config
        if ( ! verdaccioConfig.packages[ companyPrefix ] ) {
            ConsoleManager.$.log( `Adding workspace: ${ util.inspect( companyPrefix ) } to registry config` );
            ConsoleManager.$.log( `It means that all other packages except the workspace packages will be forwarded to remote: ${ util.inspect( "registry.npmjs.org" ) } registry` );

            // Add workspace to verdaccioConfig
            verdaccioConfig.packages[ companyPrefix ] = {
                "access": "$all",
                "publish": "$authenticated"
            };

            // Ensure that company prefixed are first in the list
            const packages = Object.entries( verdaccioConfig.packages ),
                companyName = rootPkg.json.name.split( "/" )[ 0 ],
                companyPackages = packages.filter( ( [ key ] ) => key.startsWith( companyName ) ),
                otherPackages = packages.filter( ( [ key ] ) => ! key.startsWith( companyName ) );

            verdaccioConfig.packages = Object.fromEntries( [ ... companyPackages, ... otherPackages ] );

            // Save config
            fs.writeFileSync( paths.verdaccioConfig, fromJStoYAML( verdaccioConfig ) as string );
        }
    }

    protected showHelp( name = this.options.name, optionsText = "commands" ): void {
        super.showHelp( name, optionsText );

        ConsoleManager.$.log( util.inspect( {
            "@server": {
                description: "Starts a local npm registry server",
                usage: `${ name } @server`
            },
            "@list": {
                description: "List all online npm registry servers",
                usage: `${ name } @list`
            },
            "@use": {
                description: "Use npm with custom configuration, that will be forwarded to local npm server",
                arguments: {
                    "id": "Id of the npm registry server, can be obtain using: @registry @list command",
                    "command": "A npm command to execute against the registry"
                },
                examples: [
                    `${ name } @use npm <id> <command>`,
                    `${ name } @use npm 4a1a whoami`,
                    `${ name } @use npm 4a1a install`,
                ]
            },
            "@clean": {
                description: "Delete current npm registry server and '.npmrc' token",
                examples: [
                    `${ name } @delete`
                ]
            }
        } ) );
    }
}
