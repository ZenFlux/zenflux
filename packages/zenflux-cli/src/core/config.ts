/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "fs";

// import { zGlobalInitConfig } from "@z-cli/core/global";
import { console } from "@z-cli/modules/console";

import type { IZConfig } from "@z-cli/definitions/config";

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

    if ( config.inputDtsPath && ! config.outputDtsPath ) {
        throw new Error( `'${ path }' inputDtsPath is defined but outputDtsPath is not` );
    }

    config.path = path;

    // zGlobalInitConfig( config as IZConfig );

    return config as IZConfig;
}
