import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

import MagicString from "magic-string";

import type { IPluginArgs } from "@zenflux/cli/src/definitions/rollup";

import type { Plugin } from "rollup";

// Issue with `magic-string` types
import type { default as MagicStringType } from "magic-string";

const loader = {
    path: "",
    code: "",
};

export function zEmitCustomLoaderMethod( module: string, args: { [ key: string ]: any } ) {
    let argsJSON = JSON.stringify( args, null, 4 );

    // Inject `__dirname` with favor of prettier
    argsJSON = argsJSON.replace( /{\s*/, "{\n    sourceDir: __dirname,\n    " );

    return `globalThis.__Z_CUSTOM_LOADER__.zCustomLoader( '${ module }', ${ argsJSON } )`;
}

export default function zRollupCustomLoaderPlugin( args: IPluginArgs ): Plugin {
    return {
        name: "z-rollup-custom-loader-plugin",

        buildStart() {
            const currentDir = path.dirname( fileURLToPath( import.meta.url ) );
            loader.path = path.resolve( currentDir, "rollup-custom-loader.js" );
            loader.code = fs.readFileSync( loader.path, "utf-8" );
            loader.code = `/* rollup-custom-loader.js */\n${ loader.code }`;
        },

        renderChunk( code, chunk, options ) {
            let hasReplacements = false;

            const magicString: MagicStringType = new MagicString( code );

            const sourceId = Math.random().toString( 36 ).slice( 2 );

            if ( "es" === options.format ) {
                // Replace import statements
                const importPattern = /import\s*((?:\* as \w+)|(?:\{[^}]+\})|\S+)\s*from\s*['"]([^'"]+)['"]/g;
                magicString.replace( importPattern, ( match, capture1, capture2 ) => {
                    hasReplacements = true;
                    let replacement = "";

                    if ( capture1.startsWith( "* as" ) ) {
                        // Handle namespace import
                        replacement = `const ${ capture1.replace( /\* as /, "" ) } = ` + zEmitCustomLoaderMethod( capture2, {
                            type: "import",
                            mode: "all",
                            moduleName: options.name,
                            chunkName: chunk.name,
                            sourceId,
                        } );
                    } else if ( capture1.includes( "{" ) ) {
                        // Handle named imports
                        if ( capture1.includes( " as " ) ) {
                            const names: { name: string, alias: string }[] = capture1.replace( /[{}]/g, "").split( "," ).map( ( i: string ) => {
                                const [ name, alias ] = i.trim().split( " as " );

                                return {
                                    name,
                                    alias,
                                };
                            } );

                            replacement = `const { ${ names.map( i => i.name ).join(", " ) } } = ` + zEmitCustomLoaderMethod( capture2, {
                                type: "import",
                                mode: "named",
                                moduleName: options.name,
                                chunkName: chunk.name,
                                sourceId,
                            } );

                            replacement += "\n" + names.map( ( { name, alias } ) => {
                                return `const ${ alias ? `${ alias } = ` : "" }${ name }`;
                            } ).join( "; \n" );
                        } else {
                            replacement = `const ${ capture1 } = ` + zEmitCustomLoaderMethod( capture2, {
                                type: "import",
                                mode: "named",
                                moduleName: options.name,
                                chunkName: chunk.name,
                                sourceId,
                            } );
                        }
                    } else {
                        // Handle default import
                        replacement = `const ${ capture1 } = ` + zEmitCustomLoaderMethod( capture2, {
                            type: "import",
                            mode: "default",
                            moduleName: options.name,
                            chunkName: chunk.name,
                            sourceId,
                        } );
                    }

                    return replacement;
                } );
            } else if ( "cjs" === options.format ) {
                // Replace require statements
                const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
                magicString.replace( requirePattern, ( match, capture ) => {
                    hasReplacements = true;
                    let replacement = "";

                    replacement = zEmitCustomLoaderMethod( capture, {
                        type: "require",
                        moduleName: options.name,
                        chunkName: chunk.name,
                        sourceId,
                    } );

                    return replacement;
                } );
            }

            // Include the content of customLoader.js in the bundle
            if ( hasReplacements ) {
                const extractedChunk = {
                    moduleForwarding: args.moduleForwarding,
                    outputOptions: options,
                    ... chunk,
                };

                // @ts-ignore
                delete extractedChunk.modules;
                // @ts-ignore
                delete extractedChunk.moduleIds;

                const chunkJSON = JSON.stringify( extractedChunk, null, 4 );

                const moduleForwarding = args.moduleForwarding
                    ? Object.entries( args.moduleForwarding ).map( ( [ forModule, sourceSlice ] ) => {
                        return Object.entries( sourceSlice ).map( ( [ source, target ] ) => {
                            return `globalThis.__Z_CUSTOM_LOADER__.zCustomLoaderModuleForwarding('${ forModule }', '${ source }', '${ target }');`;
                        } ).join( "\n" );
                    } ).join( "\n" )
                    : "";

                magicString.prepend( "" +
                    `${ ! code.includes( "/* rollup-custom-loader.js */" ) ? loader.code + "\n" : "" }` +
                    `${ moduleForwarding }\n` +
                    `globalThis.__Z_CUSTOM_LOADER__.zCustomLoaderData( ${ chunkJSON }, '${ sourceId }' );\n`
                );

                return {
                    code: magicString.toString(),
                    map: args.sourcemap ? magicString.generateMap() : null,
                };
            }
        },
    };
}

