/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { promises as fsPromises } from "node:fs";
import { basename, join, isAbsolute, resolve } from "node:path";

/**
 * Retrieves all matching file paths in a directory and its subdirectories recursively.
 *
 * @function zGetMatchingPathsRecursive
 * @param {string} directoryPath - The path of the directory to search.
 * @param {RegExp} filterPattern - The regular expression pattern used to filter file paths.
 * @param {number} [maxAllowedDepth=Infinity] - The maximum allowed subdirectory depth to search.
 * @param {object} [options={}] - Optional parameters for filtering file paths.
 * @param {string[]} [options.ignoreStartsWith=[]] - An array of prefixes to ignore when searching file paths.
 *
 * @returns {Promise<string[]>} - A promise that resolves to an array of matching file paths.
 */
export const zGetMatchingPathsRecursive = async (
    directoryPath,
    filterPattern,
    maxAllowedDepth = Infinity,
    options = {
        ignoreStartsWith: [],
    } ) => {

    const result = [];

    const shouldIgnore = ( filePath ) =>
        options.ignoreStartsWith.some( ( prefix ) =>
            basename( directoryPath ).startsWith( prefix ) ||
            basename( filePath ).startsWith( prefix ) );

    const searchRecursive = async ( directory, depth = 0 ) => {
        if ( depth >= maxAllowedDepth )
            return;

        /**
         * @type {import("fs").Dirent[]}
         */
        const filesInDirectory = await fsPromises.readdir( directory, { withFileTypes: true } );

        await Promise.all( filesInDirectory.map( async dirent => {
            const filePath = join( directory, dirent.name );

            if ( shouldIgnore( filePath ) )
                return;

            if ( dirent.isFile() && filterPattern.test( filePath ) ) {
                result.push( filePath );
            } else if ( dirent.isDirectory() ) {
                await searchRecursive( filePath, depth + 1 );
            }
        } ) );
    };

    await searchRecursive( directoryPath );

    return result;
};

/**
 * Check if path a common path format.
 *
 * @param {string} path
 */
export const zIsUnixOrFileProtocolPath = ( path ) => {
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
export const zGetAbsoluteOrRelativePath = ( path, relative = process.cwd() ) => {
    return ! isAbsolute( path ) ? resolve( relative, path ) : resolve( path );
};
