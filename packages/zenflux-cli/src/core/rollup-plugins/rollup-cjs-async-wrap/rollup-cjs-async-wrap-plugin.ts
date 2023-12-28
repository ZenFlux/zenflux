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

function isNodeTopLevelAwait( ast: Program, node: Statement | ModuleDeclaration ) {
    if ( node.type === "VariableDeclaration" && node.kind === "var" ) {
        // Check if the variable declaration contains an await expression and is not inside a function
        return node.declarations.some( ( declaration ) => {
            return declaration.init && declaration.init.type === "AwaitExpression";
        } );
    } else if ( node.type === "ExportNamedDeclaration" ) {
        if ( node.declaration && node.declaration.type === "VariableDeclaration" && node.declaration.kind === "const" ) {
            // Check if the variable declaration contains an await expression and is not inside a function
            return node.declaration.declarations.some( ( declaration ) => {
                return declaration.init && declaration.init.type === "AwaitExpression";
            } );
        }
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

function generateRandomString( length = 10 ) {
    let result = "";
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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

                magicString.prependLeft( ast.body[0].start, "\n" );

                ast.body.forEach( ( node ) => {
                    // TODO: Remove `isNodeTopLevelAwait`
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
                        } else if ( node.type === "ExportNamedDeclaration" ) {
                            if ( node.declaration && node.declaration.type === "VariableDeclaration" ) {
                                const originalCode = magicString.snip( node.start, node.end ).toString();

                                const refName = generateRandomString() + "_tempTopLevelAwait",
                                    vars = node.declaration.declarations[0].id.properties.map( p => p.key.name );

                                magicString.prependLeft( node.start - 1, "\n" );
                                magicString.prependLeft( node.start, `const ${ refName } = { ${ vars.join( ": undefined, ") }: undefined };\n\n` );

                                magicString.overwrite( node.start, node.end,
                                    "globalThis.__Z_CJS_WARP__.zRollupCjsAsyncWrap( async() => {\n" +
                                    originalCode.replace( "export", "    ") + "\n" +
                                    `${ vars.map( v => `    ${ "exports" }.${ v } = ${ v };`).join("\n") }\n` +
                                    `}, ${ node.start } );\n`
                                );

                                magicString.append( `export const { ${ vars.join( ", " ) } } = ${ refName };` );
                            }
                        }
                    }
                } );

                return {
                    code: magicString.toString(),
                    map: args.sourcemap ? magicString.generateMap( { hires: true } ) : null,
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
                    map: args.sourcemap ? magicString.generateMap( { hires: true } ) : null,
                };
            }
        }
    };
}

