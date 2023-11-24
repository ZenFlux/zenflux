/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { isAbsolute, resolve } from "node:path";

import util from "node:util";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Check if path a common path format.
 *
 * @param {string} path
 */
export const isCommonPathFormat = ( path ) => {
    return path.startsWith( "/" ) ||
        path.startsWith( "./" ) ||
        path.startsWith( "../" ) ||
        path.startsWith( "file://" );
};

/**
 * Ensure path is absolute, if not, resolve it from relative path.
 *
 * @param {string} path
 * @param {string} [relative=process.cwd()]
 */
export const getAbsoluteOrRelativePath = ( path, relative = process.cwd() ) => {
    return ! isAbsolute( path ) ? resolve( relative, path ) : resolve( path );
};

/**
 * Create a promise that can be resolved from outside.
 */
export const createResolvablePromise = () => {
    const result = {};

    result.promise = new Promise( ( resolve, reject ) => {
        result.resolve = resolve;
        result.reject = reject;
    } );

    return result;
};

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


/**
 * Since we are currently bun based, we can use the same logic as bun.
 *
 * TODO - Find better solution - https://github.com/oven-sh/bun/blob/feefaf00d799e152e1c816e7cd8c8beb70c7f074/docs/install/workspaces.md?plain=1#L41
 *
 * @param {string} directoryPath
 * @param {RegExp} filterPattern
 * @param {number} [maxAllowedDepth=Infinity]
 *
 * @return {string[]}
 */
export const getMatchingPathsRecursive = ( directoryPath, filterPattern, maxAllowedDepth = Infinity )=> {
    const result = [],
        maxPatternDepth = filterPattern.toString().split( "*" ).length;

    function searchRecursive( directoryPath, depth = 0 ) {
        const filesInDirectory = fs.readdirSync( directoryPath, { withFileTypes: true } );

        if ( ( maxPatternDepth > 0 && depth >= maxPatternDepth ) || depth >= maxAllowedDepth ) {
            return;
        }

        filesInDirectory.forEach( ( dirent ) => {
            if ( dirent.name.startsWith( "." ) ) {
                return;
            }

            const filePath = path.join( directoryPath, dirent.name );

            if ( dirent.isDirectory() && filterPattern.test( filePath ) ) {
                result.push( filePath );

                searchRecursive( filePath, depth + 1 );
            }
        } );
    };

    searchRecursive( directoryPath );

    return result;
};
