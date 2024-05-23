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

const noRelativeImports = {
    meta: {
        type: "problem",
        fixable: "code",
        schema: []
    },
    create: function ( context ) {
        return {
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
