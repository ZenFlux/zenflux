/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import path from "node:path";

// TODO: Use cache
const rootPackageJson = JSON.parse(
    fs.readFileSync( globalThis.__Z_ESLINT_CONFIG__.zRootPackagePath, 'utf8' )
);

// TODO Move out of "@zenflux/eslint" package
function findNearestPackageJson( directory ) {
    const packageJsonPath = path.join( directory, "package.json" );

    // Check if package.json exists in the current directory
    if ( fs.existsSync( packageJsonPath ) ) {
        return packageJsonPath;
    }

    // If not, move one directory up
    const parentDirectory = path.dirname( directory );

    // If we are already at the root directory, return null
    if ( directory === parentDirectory ) {
        return null;
    }

    // Recursively check the parent directory
    return findNearestPackageJson( parentDirectory );
}

// TODO It still not working code check:
// /Users/inewlegend/Desktop/zenflux/zenflux/packages/zenflux-cli/src/console/thread-receive-console.ts

const noRelativeImports = {
    meta: {
        type: "problem",
        fixable: "code",
        schema: []
    },
    create: function ( context ) {
        return {
            // ImportDeclaration( node ) {
            //     // Find the nearest package.json file
            //     const packageJsonPath = findNearestPackageJson( path.dirname( context.getFilename() ) );
            //     const currentPackageJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );
            //
            //     if ( node.source.value.startsWith( './' ) || node.source.value.startsWith( '../' ) ) {
            //         context.report( {
            //             node,
            //             message: `Please use ${ currentPackageJson.name }' instead of relative imports.`,
            //             fix: function ( fixer ) {
            //                 let newPath = node.source.value.replace( /(\.\/|\.\.\/)/g, `${ currentPackageJson.name }/src/` );
            //
            //                 // Determine if `newImport` need "src" prefix, only if current import does not found in the current path
            //                 // if ( ! fs.existsSync( path.join( patThreadReceiveConsoleh.dirname( packageJsonPath ), newPath ) ) ) {
            //                 //     newPath = node.source.value.replace( /(\.\/|\.\.\/)/g, `${ currentPackageJson.name }/src/` );
            //                 // }
            //
            //                 // // If the new path not found, return the original import
            //                 // if ( ! fs.existsSync( path.join( path.dirname( packageJsonPath ), newPath ) ) ) {
            //                 //     return;
            //                 // }
            //
            //                 return fixer.replaceText( node.source, `'${ newPath }'` );
            //             }
            //         } );
            //     }
            // }

            ImportDeclaration( node ) {
                if ( node.source.value.startsWith( './' ) || node.source.value.startsWith( '../' ) ) {
                    // Find the nearest package.json file
                    const packageJsonPath = findNearestPackageJson( path.dirname( context.getFilename() ) );
                    const currentPackageJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );

                    // Get the relative path from the current file to the imported file
                    const relativePath = path.relative(
                        path.dirname( packageJsonPath ),
                        path.resolve( path.dirname( context.getFilename() ), node.source.value )
                    );

                    context.report( {
                        node,
                        message: `Please use '${ currentPackageJson.name }/${ relativePath }' instead of relative imports.`,
                        fix: function ( fixer ) {
                            const newImport = `${ currentPackageJson.name }/${ relativePath }`;
                            return fixer.replaceText( node.source, `'${ newImport }'` );
                        }
                    } );
                }
            }
        };
    }
};

export default {
    rules: {
        'no-relative-imports': noRelativeImports
    }
}
