// TODO: Usw swc

const babel = require( "@babel/core" );
const inspector = require( "node:inspector" );

/**
 * @type {import("@babel/core").TransformOptions}
 */
const babelOptions = {
    plugins: [
        // "@babel/plugin-transform-modules-commonjs",
        "@babel/plugin-transform-react-jsx-source",
        "@babel/plugin-syntax-jsx",
        "@babel/plugin-transform-react-jsx",
    ],

    // Detect debug mode...
    sourceMaps: inspector.url() ? "both" : false,

    retainLines: true,
};

/**
 * @type {import("@jest/transform").SyncTransformer}
 */
const transformer = {
    process( content, filename ) {
        return babel.transformSync( content, {
            ...babelOptions,
            filename,
        } );
    }
};

module.exports = transformer;
