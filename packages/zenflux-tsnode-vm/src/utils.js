/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "util";

import { isAbsolute, resolve} from "path";

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

    result.promise = new Promise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
};

/**
 * Inspect alias
 *
 * @param {any} obj
 * @param {util.InspectOptions} options
 */
export function inspect( obj, options = {} ) {
   options = Object.assign(  {
        colors: true,
        breakLength: 1,
        depth: 1,
    }, options );

    return util.inspect( obj, options );
}
