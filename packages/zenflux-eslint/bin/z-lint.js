#!/usr/bin/env node
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import child_process from "node:child_process";

import { zLintGetProjectsPathsWithConfig } from "@zenflux/eslint";
import { fileURLToPath } from "node:url";

const hasConfig = !! ( await zLintGetProjectsPathsWithConfig( [ process.env.PWD ] ) ).length;

if ( hasConfig ) {
    console.log( "Use `eslint .` with following `eslint.config.js` file:\n" );

    // Print content of `./example-config-extend.js`.
    console.log( fs.readFileSync(
        path.join( path.dirname( fileURLToPath( import.meta.url ) ), "example-config-extend.js" ), "utf8" )
    );

    process.exit( 0 );
}

const rootPackagePath = path.dirname( __Z_ESLINT_CONFIG__.zRootPackagePath );

// Run `eslint` on `process.env.PWD` from `rootPackagePath`.
process.chdir( rootPackagePath );

const isWithinBun = typeof Bun !== "undefined";

const isInspectConfig = process.argv.includes( "--inspect-config" );

const shouldRunViaBun = ! isInspectConfig && ! isWithinBun && await ( async function () {
    return !! await child_process.exec( 'bun --version', { stdio: 'ignore' } );
}() );

const command = [
    isInspectConfig ? "" : "time",
    "(",
    shouldRunViaBun ? "bunx --bun eslint" : "eslint",
    `${ process.argv.includes( "--print-config" ) ? "" : process.env.PWD }`,
    ...process.argv.slice( 2 ),
    ")"
].join( " " );

console.log( `@z-lint running: ${ "`" + command + "`" }` );

child_process.execSync( command, {
    stdio: "inherit",
    env: {
        ...process.env,
    }
} );
