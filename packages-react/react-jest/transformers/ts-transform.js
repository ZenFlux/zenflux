const swc = require('@swc/core');
const inspector = require( "node:inspector" );

const transformer = {
    process( content, filename ) {
        if ( inspector.url() ) {
            console.log( `TypeScript transforming ${filename}` );
        }

        return swc.transformSync( content, {
            filename,
            jsc: {
                parser: {
                    syntax: 'typescript',
                },
            },
            module: {
                type: 'commonjs',
            },

            sourceMaps: "inline"
        } );
    }
};

module.exports = transformer;
