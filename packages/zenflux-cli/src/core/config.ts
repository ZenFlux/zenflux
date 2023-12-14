/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "fs";

import { console } from "@zenflux/cli/src/modules/console";

import { Z_CONFIG_REQUIRED_KEYS } from "@zenflux/cli/src/definitions/config";

import type { IZConfigInternal , IConfigArgsBase, IZConfigs, TConfigType} from "@zenflux/cli/src/definitions/config";

type KeyOfZConfigRequiredKeys = keyof typeof Z_CONFIG_REQUIRED_KEYS;

function hasRequiredKeys( config: IZConfigInternal ) {
    return Z_CONFIG_REQUIRED_KEYS.every( ( key ) => {
        return config.hasOwnProperty( key as KeyOfZConfigRequiredKeys );
    } );
}

function configValidate( config: IZConfigInternal ) {
    if ( config.inputDtsPath && ! config.outputDtsPath ) {
        throw new Error( `'${ config.path }' inputDtsPath is defined but outputDtsPath is not` );
    }
}

function configEnsureInternals( config: IZConfigInternal, args: {
    type: TConfigType,
    path: string,
    name: string,
    $defaults?: IConfigArgsBase,
} ) {
    Object.assign(
        config as IZConfigInternal,
        args.$defaults || {},
        {
            type: args.type,
            path: args.path,
            outputName: args.name,
        }
    );
}
export async function zConfigLoad( path: string, silent = false ) {
    // Check if target config exists.
    console.verbose( () => `${ zConfigLoad.name }() -> Checking if exists: '${ path }'` );

    if ( ! fs.existsSync( path ) ) {
        const message = `File not found: '${ path }'`;

        if ( ! silent ) {
            throw new Error( message );
        }

        console.verbose( () => `${ zConfigLoad.name }() -> ${ message }` );

        return;
    }

    // Load the file.
    const config = ( await import( path ) ).default;

    if ( ! Object.keys( config ).length ) {
        throw new Error( `'${ path }' empty or not loaded` );
    }

    let configType: | "single" | "multi" | "unknown" = "unknown";

    // Determine which config type is it.

    // - If first level has all `Z_CONFIG_REQUIRED_KEYS` then it's a single config object.
    if ( hasRequiredKeys( config ) ) {
        configType = "single";
    }
    // - If one of the second level has all `Z_CONFIG_REQUIRED_KEYS` then it's a multi config object.
    else if ( Object.values( config ).some( i => hasRequiredKeys( i as IZConfigInternal ) ) ) {
        configType = "multi";
    } else {
        throw new Error( `Invalid config: 'file://${ path }' unable to determine the config type, the required keys are missing\n` +
            "Ensure you have them both per config: " + Z_CONFIG_REQUIRED_KEYS.join( ", " )
        );
    }

    const configs: IZConfigInternal[] = [];

    let $defaults: IConfigArgsBase | undefined;

    if ( configType === "single" ) {
        configEnsureInternals( config as IZConfigInternal, {
            path,
            type: configType,
            name: config.outputName,
            $defaults,
        } );

        configValidate( config );

        configs.push( config as IZConfigInternal );
    } else {
        Object.entries( config as IZConfigs ).forEach( ( [ key, i ] ) => {
            if ( i && ! hasRequiredKeys( i as IZConfigInternal ) ) {
                if ( "$defaults" === key ) {
                    $defaults = i as IConfigArgsBase;
                } else {
                    throw new Error( `Invalid config: 'file://${ path }' the required keys are missing:\n` +
                        Object.keys( Z_CONFIG_REQUIRED_KEYS ).join( ", " )
                    );
                }

                return;
            }

            configEnsureInternals( i as IZConfigInternal, {
                path,
                type: configType,
                name: key,
                $defaults,
            } );

            configValidate( i as IZConfigInternal );

            configs.push( i as IZConfigInternal );
        } );
    }

    return configs;
}
