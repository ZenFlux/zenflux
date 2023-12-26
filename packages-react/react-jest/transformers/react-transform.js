// TODO: Usw swc

const babel = require( "@babel/core" );
const swc = require( "@swc/core" );
const inspector = require( "node:inspector" );

const pathToBabelPluginReplaceConsoleCalls = require.resolve(
    './react-transformers/test-replace-console-calls.js'
);

const pathToTransformTestGatePragma = require.resolve(
    './react-transformers/test-gate-pragma.js'
);

const conditionalPlugins = [];

// if ( process.env.NODE_ENV === "development" ) {
//     conditionalPlugins.push( pathToBabelPluginReplaceConsoleCalls );
// }

/**
 * @type {import("@babel/core").TransformOptions}
 */
const babelOptions = {
    plugins: [
        "@babel/plugin-transform-react-jsx-source",
        "@babel/plugin-syntax-jsx",
        '@babel/plugin-transform-react-jsx',

        pathToTransformTestGatePragma,

        ...conditionalPlugins,
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

/**
 * @type {import("@swc/core").TransformConfig}
 */
// const transformer = {
//     process( content, filename ) {
//         return swc.transformSync( content, {
//             env: {
//                 debug: true,
//                 mode: "usage",
//             },
//             filename,
//             jsc: {
//                 parser: {
//                     syntax: "ecmascript",
//                     jsx: true,
//                     decorators: false,
//                 },
//             },
//             module: {
//                 type: "commonjs",
//             },
//
//             sourceMaps: true,
//             sourceRoot: process.cwd(),
//             sourceFileName: filename,
//         } );
//     }
// };

module.exports = transformer;
