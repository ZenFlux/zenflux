const swc = require('@swc/core');

const transformer = {
    process( content, filename ) {
        return swc.transformSync( content, {
            filename,
            jsc: {
                target: 'es5',
                parser: {
                    syntax: 'typescript',
                },
            },
            module: {
                type: 'commonjs',
            },
        } );
    }
};

module.exports = transformer;
