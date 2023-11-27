import path from "node:path";
import fs from "node:fs";

import { fileURLToPath } from "node:url";

import { parse } from "acorn";

import MagicString from "magic-string";

import type { Program, ModuleDeclaration, Statement } from "acorn";

import type { Plugin } from "rollup";

import type { IPluginArgs } from "@zenflux/cli/src/definitions/rollup";

// Issue with `magic-string` types
import type { default as MagicStringType } from "magic-string";

const wrapInjection = {
    path: "",
    code: "",
};

const runInjection = {
    path: "",
    code: "",
};

const injectedChunks = new Map<string, boolean>();

function isNodeTopLevelAwait( ast: Program, node: Statement | ModuleDeclaration ) {
    if ( node.type === "VariableDeclaration" && node.kind === "var" ) {
        // Check if the variable declaration contains an await expression and is not inside a function
        return node.declarations.some( ( declaration ) => {
            return declaration.init && declaration.init.type === "AwaitExpression";
        } );
    }

    return false;
}

function hasTopLevelAwait( ast: Program ) {
    for ( const node of ast.body ) {
        if ( isNodeTopLevelAwait( ast, node ) ) {
            return true;
        }
    }

    return false;
}

export default function zRollupCjsAsyncWrapPlugin( args: IPluginArgs ): Plugin {
    return {
        name: "z-rollup-cjs-async-wrap-plugin",

        buildStart() {
            const currentDir = path.dirname( fileURLToPath( import.meta.url ) );

            wrapInjection.path = path.resolve( currentDir, "rollup-cjs-async-wrap.js" );
            wrapInjection.code = fs.readFileSync( wrapInjection.path, "utf-8" );
            wrapInjection.code = `/* rollup-cjs-async-wrap.js */\n${wrapInjection.code}`;

            runInjection.path = path.resolve( currentDir, "rollup-cjs-async-run.js" );
            runInjection.code = fs.readFileSync( runInjection.path, "utf-8" );
            runInjection.code = `/* rollup-cjs-async-run.js */\n${runInjection.code}`;
        },

        async transform( code, id ) {
            if ( ! code.includes( "await" ) ) {
                return null;
            }

            const ast = parse( code, {
                ecmaVersion: "latest",
                sourceType: "module",
                allowAwaitOutsideFunction: true,
            } );

            if ( hasTopLevelAwait( ast ) ) {
                const magicString: MagicStringType = new MagicString( code );

                ast.body.forEach( ( node ) => {
                    if ( isNodeTopLevelAwait( ast, node ) ) {
                        // Declare variable contains an await expression
                        if ( node.type === "VariableDeclaration" ) {
                            const vars = node.declarations.map( ( i ) => i.id.name ).join( ", " );

                            magicString.prependLeft( node.start, `var ${ vars };\n` );

                            magicString.overwrite( node.start, node.end,
                                "globalThis.__Z_CJS_WARP__.zRollupCjsAsyncWrap( async() => {\n" +
                                magicString.snip( node.start, node.end ).toString().replace("var", "") + "\n" +
                                `}, ${ node.start } );`
                            );
                        }
                    }
                } );

                return {
                    code: magicString.toString(),
                    map: args.sourcemap ? magicString.generateMap() : null,
                };
            }

            return null;
        },

        renderChunk( code, chunk, options ) {
            const magicString: MagicStringType = new MagicString( code );

            // Check if chunk contains wrapped async function
            if ( code.includes( "__Z_CJS_WARP__" ) && ! code.includes( "/* rollup-cjs-async-wrap.js */" ) ) {
                magicString.prepend( wrapInjection.code );
                magicString.append( runInjection.code );

                return {
                    code: magicString.toString(),
                    map: args.sourcemap ? magicString.generateMap() : null,
                };
            }
        }
    };
}

