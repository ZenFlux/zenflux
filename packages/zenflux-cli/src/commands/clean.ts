import path from "node:path";
import fs from "node:fs";

import { CommandConfigBase } from "@zenflux/cli/src/base/command-config-base";

import { console } from "@zenflux/cli/src/modules/console";

export default class Clean extends CommandConfigBase {

    public async run() {
        const obj: any = {};

        const configs = await this.loadConfigs();

        configs!.forEach( ( config ) => {
            const x = path.dirname( config.path ) + "/dist";

            if ( ! obj[ x ] ) {
                obj[ x ] = [];
            }
        } );


        // Remove all dist folders
        for ( const distPath of Object.keys( obj ) ) {
            const distPathObj = obj[ distPath ];

            console.log( "cleaning", distPath );

            // unlink all folders
            try {
                fs.rmdirSync( distPath, { recursive: true } );
            } catch ( e ) {
                console.error( e );
            }
        }
    }
}
