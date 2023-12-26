import util from "node:util";
import fs from "node:fs";

import { convertTsConfig } from "@zenflux/tsconfig-to-swc";

import swc from "@swc/core";

import type { IPluginArgs } from "@zenflux/cli/src/definitions/rollup";

import type { Plugin } from "rollup";

export default function zRollupSwcPlugin( args: Required<IPluginArgs> ): Plugin {
    const swcOptions = convertTsConfig( args.tsConfig, {
        sourceMaps: args.sourcemap,
        minify: args.minify,
    } );

    if ( ! swcOptions || ! swcOptions.module ) {
        throw new Error( "Unable to convert tsconfig to swc options" );
    }

    if ( ( args.format === "esm" || args.format === "module" ) && ! [ "nodenext", "es6" ].includes( swcOptions.module.type ) ) {
        // Tell the user that bundling esm is limited to 'NodeNext' or 'ES6'
        throw new Error( "Bundling esm is limited to 'NodeNext' or 'ES6'\n" +
            "Please ensure that `\"module\": \"NodeNext\"` or any ES(eg: `\"module\": \"ESNext\"` type is set in your `tsconfig.json`\n" +
            "Caused by file://" + args.tsConfig.options.configFilePath );
    }

    if ( args.format === "cjs" && swcOptions.module.type !== "nodenext" ) {
        throw new Error( "Rollup does not bundle `require` calls, currently bundling commonjs is limited to 'NodeNext'\n" +
            "Please ensure that `\"module\": \"NodeNext\"` is set in your `tsconfig.json`\n" +
            "Caused by file://" + args.tsConfig.options.configFilePath );
    }

    if ( swcOptions.jsc?.paths ) {
        throw new Error( "@zenflux/cli currently does not support paths, caused by file://" + args.tsConfig.options.configFilePath );
    }

    const cache = new Map<string, {
        output: swc.Output;
        lastModified: number;
    }>();

    return {
        name: "z-rollup-swc-plugin",

        transform( source, id ) {
            const lastModified = fs.statSync( id ).mtimeMs;

            const cached = cache.get( id );

            // Since `z-cli` being used with manual watch mode, we can't rely on `rollup`'s cache
            if ( cached && cached.lastModified === lastModified ) {
                return cached.output;
            }

            try {
                const output = swc.transformSync( source, swcOptions );

                // Acknowledge change for `build` command
                this.cache.set( id, { output, lastModified } );

                cache.set( id, { output, lastModified } );

                return output;
            } catch ( error: any ) {
                // Make error message more readable/useful
                if ( "undefined" !== typeof error.message ) {
                    let newMessage = `${ error.message } in project ${ util.inspect( args.tsConfig.options.configFilePath ) }\n    While SWC transform of file: (${ id.startsWith( "file://" ) ? id : "file://" + id }) ` +
                        `with options: \n    ${ util.inspect( swcOptions, {
                            breakLength: 1,
                            compact: false,
                        } ).replace( /^ +/gm, a => "    ".repeat( a.split( "" ).length ) ) }`;

                    error.message = newMessage.substring( newMessage.length - 1, 1 ) + "    }";
                }

                throw error;
            }
        },
    };
};
