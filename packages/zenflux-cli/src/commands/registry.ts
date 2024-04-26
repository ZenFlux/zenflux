/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "fs";
import util from "util";
import child_process from "child_process";

import { runServer } from "@verdaccio/node-api";
import { fromJStoYAML, parseConfigFile } from "@verdaccio/config";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { CommandBase } from "@zenflux/cli/src/base/command-base";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import {
    DEFAULT_Z_REGISTRY_HOST,
    DEFAULT_Z_REGISTRY_PASSWORD,
    DEFAULT_Z_REGISTRY_URL,
    DEFAULT_Z_REGISTRY_USER
} from "@zenflux/cli/src/definitions/zenflux";

export default class Registry extends CommandBase {

    public async run() {
        const args = this.args,
            paths = this.paths;

        switch ( args[ 0 ] ) {
            case "@server":
                this.serverEnsureVerdaccioConfig();

                const server = await runServer( paths.verdaccioConfig );

                server.listen( 4873, async () => {
                    ConsoleManager.$.log( "Server running on port 4873" );
                    ConsoleManager.$.log( `You can access the registry at ${ util.inspect( DEFAULT_Z_REGISTRY_URL ) } ` );
                    ConsoleManager.$.log( `Username: ${ util.inspect( DEFAULT_Z_REGISTRY_USER ) }` );
                    ConsoleManager.$.log( `Password: ${ util.inspect( DEFAULT_Z_REGISTRY_PASSWORD ) }` );
                    ConsoleManager.$.log( "To close the server, press CTRL + C" );

                    // Check if .htpasswd file exists
                    if ( ! fs.existsSync( paths.verdaccioHtpasswd ) ) {
                        // Add new user
                        const response = await fetch( `${ DEFAULT_Z_REGISTRY_URL }/-/user/org.couchdb.user:${ DEFAULT_Z_REGISTRY_USER }`, {
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
                            data = `//${ DEFAULT_Z_REGISTRY_HOST }/:_authToken=${ result.token }`;

                        // Save token to `.z/verdaccio/.npmrc`
                        fs.writeFileSync( paths.npmRc, data );
                    }
                } );
                break;

            // What about bun? or other package managers?
            case "@use":
                // Use npm with custom .npmrc, should be forwarded to npm
                // eg: `z-cli registry use npm install` to `npm --userconfig .z/verdaccio/.npmrc install
                child_process.execSync( [
                    `npm --userconfig ${ paths.npmRc } --registry ${ DEFAULT_Z_REGISTRY_URL } `,
                    ... args.slice( 1 ),
                ].join( " " ), { stdio: "inherit" } );

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

        const rootPkg = new Package( paths.workspace  ),
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
            "@use": {
                description: "Use npm with custom configuration, that will be forwarded to local npm server",
                examples: [
                    `${ name } @use npm <command>`,
                    `${ name } @use npm whoami`,
                    `${ name } @use npm install`,
                ]
            }
        } ) );
    }
}
