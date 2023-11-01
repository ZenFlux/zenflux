/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "fs";
import path from "path";

/**
 * Since we are currently bun based, we can use the same logic as bun.
 *
 * TODO - Find better solution - https://github.com/oven-sh/bun/blob/feefaf00d799e152e1c816e7cd8c8beb70c7f074/docs/install/workspaces.md?plain=1#L41
 */
export const getMatchingPathsRecursive = ( directoryPath: string, filterPattern: RegExp, maxAllowedDepth = Infinity ): string[] => {
    const result: string[] = [],
        maxPatternDepth = filterPattern.toString().split( "*" ).length;

    function searchRecursive( directoryPath: string, depth = 0 ) {
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
