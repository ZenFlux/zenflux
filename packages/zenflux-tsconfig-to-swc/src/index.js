import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const defaultCompilerOptions = ts.getDefaultCompilerOptions();

/**
 * Reads and parses a TypeScript Configuration file.
 *
 * @param {string} tsConfigPath - The file path of the TypeScript Configuration file.
 * @param {(path: string) => string | undefined} [readConfigCallback]
 *
 * @throws {Error} Throws an error if there is an error reading or parsing the file.
 *
 * @returns {import("typescript").ParsedCommandLine} The parsed TypeScript Configuration object.
 */
export function readTsConfig( tsConfigPath, readConfigCallback = undefined ) {
    function readConfig( path ) {
        return fs.readFileSync( path, "utf-8" )
    }

    if ( ! readConfigCallback ) {
        readConfigCallback = readConfig;
    }

    const data = ts.readConfigFile(
        tsConfigPath,
        readConfigCallback
    );

    if ( data.error ) {
        const error = new Error();

        error.cause = tsConfigPath;
        error.name = "TypeScript Configuration Error";
        error.message = ts.flattenDiagnosticMessageText( data.error.messageText, "\n" );

        throw error;
    }

    const content = ts.parseJsonConfigFileContent(
        data.config,
        ts.sys,
        path.dirname( tsConfigPath )
    );

    if ( content.errors.length ) {
        const error = new Error();

        error.cause = tsConfigPath;
        error.name = "TypeScript Configuration Parsing Error";
        error.message = content.errors.map(
            error => ts.flattenDiagnosticMessageText( error.messageText, "\n" )
        ).join( "\n" );

        throw error;
    }

    content.options.configFilePath = tsConfigPath;

    return content;
}

/**
 * Converts TypeScript compiler options to SWC compiler options
 *
 * @param {import("typescript").ParsedCommandLine} tsConfig - TypeScript parsed configuration object
 * @param {import("@swc/types").Options} overrideOptionsSwcOptions - SWC compiler options object. Default to an empty object
 *
 * @returns {import("@swc/types").Options} - The converted/customized SWC options
 */
export function convertTsConfig( tsConfig, overrideOptionsSwcOptions = {} ) {
    // Destructuring assignment to define default values for certain TypeScript options
    // Defaults: https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Compiler%20Options.md
    const {
        baseUrl,
        emitDecoratorMetadata = false,
        experimentalDecorators = false,
        importHelpers = false,
        inlineSourceMap = false,
        inlineSources = false,
        jsx = defaultCompilerOptions.jsx,
        jsxFactory = 'React.createElement',
        jsxFragmentFactory = 'React.Fragment',
        jsxImportSource = 'react',
        paths,
        sourceMap = false,
        target = ts.ScriptTarget.ES3,
    } = tsConfig.options;

    const jsxRuntime = jsx === ts.JsxEmit.ReactJSX || jsx === ts.JsxEmit.ReactJSXDev ? 'automatic' : undefined,
        jsxDevelopment = jsx === ts.JsxEmit.ReactJSXDev ? true : undefined;

    /**
     * @type {import("@swc/types").Options}
     */
    const defaults = {
        jsc: {
            externalHelpers: importHelpers,
            target: convertScriptTarget( target ),
            parser: {
                syntax: 'typescript',
                // Find better solution for `.tsx`
                tsx: true,
                decorators: experimentalDecorators,
                dynamicImport: true,
            },
            transform: {
                legacyDecorator: true,
                decoratorMetadata: emitDecoratorMetadata,
                react: {
                    throwIfNamespace: false,
                    development: jsxDevelopment,
                    useBuiltins: false,
                    pragma: jsxFactory,
                    pragmaFrag: jsxFragmentFactory,
                    importSource: jsxImportSource,
                    runtime: jsxRuntime,
                },
            },
            keepClassNames: target >= ts.ScriptTarget.ES2015,
            paths,
            baseUrl,
        },

        module: convertModuleOptions( tsConfig.options ),

        sourceMaps: sourceMap ? ( inlineSourceMap ?? "inline" ) : false,
        inlineSourcesContent: sourceMap ? inlineSources : false,
    };

    function isObject( item ) {
        return ( item && typeof item === 'object' && ! Array.isArray( item ) );
    }

    function deepMerge( target, source ) {
        const output = { ...target };
        if ( isObject( target ) && isObject( source ) ) {
            Object.keys( source ).forEach( key => {
                const isSourceKeyAnObject = isObject( source[ key ] );
                const doesKeyExistInTarget = key in target;

                if ( isSourceKeyAnObject && doesKeyExistInTarget ) {
                    output[ key ] = deepMerge( target[ key ], source[ key ] );
                } else {
                    output[ key ] = source[ key ];
                }
            } );
        }
        return output;
    }

    // Create `transformedOptions` object by combining both tsOptions and overrideOptionsSwcOptions, using deep merge
    return deepMerge( defaults, overrideOptionsSwcOptions );
}

/**
 * Converts TypeScript's ScriptTarget version to SWC JscTarget version.
 *
 * @param {import("typescript").ScriptTarget} target - The TypeScript ScriptTarget version.
 *
 * @returns {import("@swc/types").JscTarget} - The corresponding SWC JscTarget version.
 */
export function convertScriptTarget( target ) {
    /**
     * @type {Record<ts.ScriptTarget, import("@swc/types").JscTarget>}
     */
    const mapping = {
        [ ts.ScriptTarget.ES3 ]: "es3",
        [ ts.ScriptTarget.ES5 ]: "es5",
        [ ts.ScriptTarget.ES2015 ]: "es2015",
        [ ts.ScriptTarget.ES2016 ]: "es2016",
        [ ts.ScriptTarget.ES2017 ]: "es2017",
        [ ts.ScriptTarget.ES2018 ]: "es2018",
        [ ts.ScriptTarget.ES2019 ]: "es2019",
        [ ts.ScriptTarget.ES2020 ]: "es2020",
        [ ts.ScriptTarget.ES2021 ]: "es2021",
        [ ts.ScriptTarget.ES2022 ]: "es2022",
        [ ts.ScriptTarget.ESNext ]: "esnext",
        // Assuming JSON should be treated as latest, since SWC doesn't have a JSON target
        [ ts.ScriptTarget.JSON ]: "esnext",
        // Assuming Latest should map to esnext, as it generally refers to the latest ECMAScript features
        [ ts.ScriptTarget.Latest ]: "esnext",
    };

    // If the target from tsOptions does not exist in mapping
    // then fallback to the lowest version that is 'es3'
    return mapping[ target ] ?? mapping[ defaultCompilerOptions.target ];
}

/**
 * Converts TypeScript CompilerOptions to SWC ModuleConfig.
 *
 * @param {import("typescript").CompilerOptions} compilerOptions - TypeScript CompilerOptions
 *
 * @returns {import("@swc/types").ModuleConfig} - The corresponding SWC ModuleConfig
 */
export function convertModuleOptions( compilerOptions ) {
    /**
     * @type {import("typescript").CompilerOptions}
     */
    const {
        esModuleInterop = false,
        alwaysStrict = false,
        noImplicitUseStrict = false,
    } = compilerOptions;

    /**
     * @type {Record<import("typescript").ModuleKind, import("@swc/types").ModuleConfig>}
     */
    const mapping = {
        [ ts.ModuleKind.None ]: { type: "es6" },
        [ ts.ModuleKind.CommonJS ]: { type: "commonjs" },
        [ ts.ModuleKind.AMD ]: { type: "amd", config: {} },
        [ ts.ModuleKind.UMD ]: { type: "umd", config: {} },
        [ ts.ModuleKind.System ]: { type: "systemjs", config: {} },
        [ ts.ModuleKind.ES2015 ]: { type: "es6" },
        [ ts.ModuleKind.ES2020 ]: { type: "es6" },
        [ ts.ModuleKind.ES2022 ]: { type: "es6" },
        [ ts.ModuleKind.ESNext ]: { type: "es6" },
        // Assuming Node16 should use "commonjs"
        [ ts.ModuleKind.Node16 ]: { type: "commonjs" },
        [ ts.ModuleKind.NodeNext ]: { type: "nodenext", config: {} },
    };

    /**
     * @type {import("@swc/types").ModuleConfig|import("@swc/types").BaseModuleConfig}
     */
    const moduleConfig = mapping[ compilerOptions.module ] || mapping[ ts.ModuleKind.None ]; // Default to "es6"

    moduleConfig.strict = alwaysStrict || ! noImplicitUseStrict;
    moduleConfig.strictMode = compilerOptions.alwaysStrict || ! compilerOptions.noImplicitUseStrict;
    moduleConfig.importInterop = esModuleInterop ?? "swc";

    return moduleConfig;
}
