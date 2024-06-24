/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";
import crypto from "node:crypto";
import process from "node:process";

/**
 * Generate checksum for data.
 *
 * @param {import("node:crypto").BinaryLike} data
 *
 * @return {string}
 */
export function checksum( data ) {
    // Faster checksums like crc32, xor, modulo, are not sufficient for this use case.
    return crypto.createHash( "sha256" ).update( data ).digest( "hex" );
}

/**
 * Function to output verbose information.
 *
 * @param {string} module
 * @param {string} method
 * @param {function} callback
 */
export const verbose = ( module, method, callback ) => output( module, method, callback );

const output = process.argv.includes( '--zvm-verbose' ) ? ( module, method, callback ) => {
    let result = callback();

    console.log( ...[
        `[zVm@verbose] ${ util.inspect( module ) }::${ util.inspect( method + "()" ) } ->`,
        ...Array.isArray( result ) ? result : [ result ],
    ] );
} : () => {};
