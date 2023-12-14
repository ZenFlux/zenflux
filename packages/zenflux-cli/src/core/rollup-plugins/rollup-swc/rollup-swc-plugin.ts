import util from "node:util";

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

    if ( args.format === "cjs" && swcOptions.module.type !== "commonjs" ) {
        throw new Error( "Trying to bundle cjs format but tsconfig has invalid module type, caused by file://" + args.tsConfig.options.configFilePath );
    } else if ( (args.format === "esm" || args.format === "module" ) && swcOptions.module.type !== "es6" ) {
        throw new Error( "Trying to bundle es format but tsconfig has invalid module type, caused by file://" + args.tsConfig.options.configFilePath );
    }

    if ( swcOptions.jsc?.paths ) {
        throw new Error( "@zenflux/cli currently does not support paths, caused by file://" + args.tsConfig.options.configFilePath );
    }

    const cache = new Map<string, swc.Output>();

    return {
        name: "z-rollup-swc-plugin",

        transform( source, id ) {
            if ( cache.has( id ) ) {
                return cache.get( id )!;
            }

            try {
                const output = swc.transformSync( source, swcOptions );

                cache.set( id, output );

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
