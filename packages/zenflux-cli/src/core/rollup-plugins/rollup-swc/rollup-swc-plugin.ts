import { convertTsConfig } from "@zenflux/tsconfig-to-swc";

import swc from "@swc/core";

import type { IPluginArgs } from "@zenflux/cli/src/definitions/rollup";

import type { Plugin } from "rollup";

export default function zRollupSwcPlugin( args: Required<IPluginArgs> ): Plugin {
    const swcOptions = convertTsConfig( args.tsConfig, {
        sourceMaps: args.sourcemap,
        minify: args.minify,
    } );

    const cache = new Map<string, swc.Output>();

    return {
        name: "z-rollup-swc-plugin",

        transform( source, id ) {
            if ( cache.has( id ) ) {
                return cache.get( id )!;
            }

            const output = swc.transformSync( source, swcOptions );

            cache.set( id, output );

            return output;
        },
    };
};
