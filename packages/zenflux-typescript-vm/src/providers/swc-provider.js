import fs from "node:fs";
import path from "node:path";

import ts from "typescript";
import swc from "@swc/core";

import { ProviderBase } from "./base/provider-base.js";

export class SwcProvider extends ProviderBase {
    static getName() {
        return "swc";
    }

    static getType() {
        return "esm";
    }

    /**
     * @type {string}
     */
    tsConfigPath;

    /**
     * @type {import("ts-node").RegisterOptions["readFile"]}
     */
    tsReadConfigCallback;

    /**
     * @override
     *
     * @param {object} args
     * @param {string} args.tsConfigPath
     * @param {import("ts-node").RegisterOptions["readFile"]} args.tsConfigReadCallback
     */
    constructor( args ) {
        super( args );

        this.tsConfigPath = args.tsConfigPath;
        this.tsReadConfigCallback = args.tsConfigReadCallback;
    }

    initialize() {
        const tsConfigContent = ts.readConfigFile( this.tsConfigPath, ( path ) => {
            this.tsReadConfigCallback( path );

            return fs.readFileSync( path, "utf-8" );
        } );

        this.tsConfig = ts.parseJsonConfigFileContent(
            tsConfigContent.config,
            ts.sys,
            path.dirname( this.tsConfigPath ),
            {},
            path.basename( this.tsConfigPath ),
        );

        this.swcConfig = this.convertTsConfigToSwcOptions( this.tsConfig );
    }

    /**
     * This function takes TypeScript configuration options (`tsOptions`) and
     * transforms them into configuration options that are compatible with SWC (`swcOptions`).
     *
     * @param {ts.ParsedCommandLine} tsConfig - TypeScript compiler options
     * @param {swc.Options} inherentOptionsSwcOptions - SWC compiler options object. Default to empty object
     *
     * @returns {swc.Options} - The converted/customized SWC options
     */
    convertTsConfigToSwcOptions( tsConfig, inherentOptionsSwcOptions = {} ) {
        // Destructuring assignment to define default values for certain TypeScript options
        const {
            baseUrl,
            emitDecoratorMetadata = false,
            experimentalDecorators = false,
            importHelpers = false,
            jsx,
            jsxFactory = 'React.createElement',
            jsxFragmentFactory = 'React.Fragment',
            jsxImportSource = 'react',
            module,
            paths,
            sourceMap = true,
            target = ts.ScriptTarget.ES3,
        } = tsConfig.options;

        const jsxRuntime = jsx === ts.JsxEmit.ReactJSX || jsx === ts.JsxEmit.ReactJSXDev ? 'automatic' : undefined,
            jsxDevelopment = jsx === ts.JsxEmit.ReactJSXDev ? true : undefined;

        /**
         * @type {swc.Options}
         */
        const defaults = {
            jsc: {
                externalHelpers: importHelpers,
                target: this.convertScriptTarget( target ),
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
            module: this.convertModuleOptions( tsConfig.options ),
            sourceMaps: sourceMap,
        };

        // Create `transformedOptions` object by combining both tsOptions and swcOptions
        return Object.assign( defaults, inherentOptionsSwcOptions );
    }

    /**
     * This function converts TypeScript ScriptTarget into SWC JscTarget version.
     * @param {ts.ScriptTarget} target - The TypeScript's ScriptTarget version
     *
     * @returns {swc.JscTarget} - The corresponding SWC's JscTarget version
     */
    convertScriptTarget( target ) {
        /**
         * @type {Record<ts.ScriptTarget, swc.JscTarget>}
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
        return mapping[ target ] ?? "es3";
    }

    /**
     * This function converts TypeScript ModuleKind into SWC ModuleConfig.
     *
     * @param {ts.CompilerOptions} compilerOptions - TS CompilerOptions
     *
     * @returns {swc.ModuleConfig} - The corresponding SWC's ModuleConfig
     */
    convertModuleOptions( compilerOptions ) {
        /**
         * @type {ts.CompilerOptions}
         */
        const {
            esModuleInterop = false,
            alwaysStrict = false,
            noImplicitUseStrict = false,
        } = compilerOptions;

        /**
         * @type {Record<ts.ModuleKind, swc.ModuleConfig>}
         */
        const mapping = {
            [ ts.ModuleKind.None ]: { type: "es6" },
            [ ts.ModuleKind.CommonJS ]: { type: "commonjs" },
            // Assuming no config needed for "amd"
            [ ts.ModuleKind.AMD ]: { type: "amd", config: {} },
            // Assuming no config needed for "umd"
            [ ts.ModuleKind.UMD ]: { type: "umd", config: {} },
            // Assuming no config needed for "systemjs"
            [ ts.ModuleKind.System ]: { type: "systemjs", config: {} },
            [ ts.ModuleKind.ES2015 ]: { type: "es6" },
            [ ts.ModuleKind.ES2020 ]: { type: "es6" },
            [ ts.ModuleKind.ES2022 ]: { type: "es6" },
            [ ts.ModuleKind.ESNext ]: { type: "es6" },
            // Assuming Node16 should use "commonjs"
            [ ts.ModuleKind.Node16 ]: { type: "commonjs" },
            // Assuming no config needed for "nodeNext"
            [ ts.ModuleKind.NodeNext ]: { type: "nodenext", config: {} },
        };

        /**
         * @type {swc.ModuleConfig|swc.BaseModuleConfig}
         */
        const moduleConfig = mapping[ compilerOptions.module ] || mapping[ ts.ModuleKind.None ]; // Default to "es6"

        moduleConfig.strict = alwaysStrict || ! noImplicitUseStrict;
        moduleConfig.strictMode = compilerOptions.alwaysStrict || ! compilerOptions.noImplicitUseStrict;
        moduleConfig.importInterop = esModuleInterop ?? "swc";

        return moduleConfig;
    }

    async resolve( modulePath, referencingModule, middleware ) {
        // No dedicated resolver
        return null;
    }

    async load( path, options ) {
        const source = fs.readFileSync( path, "utf-8" );

        const result = await swc.transform( source, {
            ...this.swcConfig,
            filename: path,
        } );

        return result.code;
    }
}
