/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { isAbsolute, resolve } from "node:path";

import util from "node:util";


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

