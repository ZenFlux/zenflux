/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { inspect } from "util";

import { fileURLToPath } from "url";

import fs from "fs";

import vm from "node:vm";

/**
 * @typedef {{
 *     moduleType?: "node" | "json" | "esm",
 *
 *     moduleLocalTextSourceOptions?: zVmModuleLocalTextSourceOptions,
 * }} zVmModuleEvaluateOptions
 *
 * @typedef {module|Object|Awaited<ReturnType<import("ts-node").NodeLoaderHooksAPI2.LoadHook>>} zVmModuleSource
 *
 * @typedef {module:vm.SyntheticModule|module:vm.SourceTextModule} zVmModule
 *
 * @typedef {{
 *     moduleImportMeta?: ReturnType<module:vm.SourceTextModuleOptions.initializeImportMeta>,
 *     moduleImportDynamically?: ReturnType<module:vm.SourceTextModuleOptions.importModuleDynamically>,
 *
 *     // Null will disable linking.
 *     moduleLinkerCallback?: module:vm.ModuleLinker | null
 * }} zVmModuleLocalTextSourceOptions
 */

export class Loaders {
    /**
     * @param {zVm} vm
     */
    constructor( vm ) {
        this.vm = vm;
    }

    /**
     * @param {string} path
     *
     * @return {Promise<module:vm.SyntheticModule>}
     */
    async loadNodeModule( path ) {
        const module = await import( path );

        if ( ! module ) {
            throw new Error( `Module not found at: ${ inspect( path ) }` );
        }

        return this.sanitizeModule( module, path, {
            moduleType: "node",
        } );
    }

    /**
     * @param {string} path
     *
     * @return {Promise<module:vm.SyntheticModule>}
     */
    async loadJsonModule( path ) {
        const json = fs.readFileSync( path, 'utf8' );

        if ( ! json ) {
            throw new Error( `JSON file not found at: ${ inspect( path ) }` );
        }

        return this.sanitizeModule( JSON.parse( json ), path, {
            moduleType: "json",
        } );
    }

    /**
     * @param {string} path
     * @param {zVmModuleLocalTextSourceOptions} [options]
     *
     * @return {Promise<module:vm.SourceTextModule>}
     */
    async loadEsmModule( path, options ) {
        const url = path.startsWith( "file://" ) ? path : "file://" + path;

        /**
         * @type {import("ts-node").NodeLoaderHooksFormat}
         */
        const format = "module";

        /**
         * @type {import("ts-node").NodeLoaderHooksAPI2.LoadHook}
         */
        const defaultLoad = async ( url, context, defaultLoad ) => {
            const path = fileURLToPath( url );

            return {
                format,
                source: fs.readFileSync( path, "utf8" ),
            }
        };

        const module = await this.vm.node.hooks.esm.load( url, { format }, defaultLoad );

        /**
         * @type {zVmModuleEvaluateOptions}
         */
        const evalOptions = {
            moduleType: "esm",
        };

        if ( options ) {
            evalOptions.moduleLocalTextSourceOptions = options;
        }

        return this.sanitizeModule( module, url, evalOptions );
    }

    /**
     * @param {zVmModuleSource} module
     * @param {string} path
     * @param {zVmModuleEvaluateOptions} options
     *
     * @return {Promise<zVmModule>}
     */
    async sanitizeModule( module, path, options ) {
        const vmModule = await this.evaluateModule( module, path, options );

        if ( options.moduleLocalTextSourceOptions?.moduleLinkerCallback !== null ) {
            await this.linkModule( vmModule, options );
        }

        return vmModule;
    }

    /**
     * @param {zVmModuleSource} module
     * @param {string} path
     * @param {zVmModuleEvaluateOptions} options
     *
     * @return {Promise<zVmModule>}
     */
    async evaluateModule( module, path, options = {} ) {
        let vmModule;

        const moduleOptions = {
            identifier: path,
            context: this.vm.sandbox.context
        };

        switch ( options.moduleType ) {
            case 'node':
                const exportNames = Object.keys( module );

                /**
                 * @this {module:vm.SyntheticModule}
                 */
                const evaluateExportsAll = function () {
                    exportNames.forEach( key =>
                        this.setExport( key, module[ key ] )
                    );
                };

                vmModule = new vm.SyntheticModule(
                    exportNames,
                    evaluateExportsAll,
                    moduleOptions
                );
                break;

            case "json":
                /**
                 * @this {module:vm.SyntheticModule}
                 */
                const evaluateExportsDefault = function () {
                    this.setExport( "default", module );
                };

                vmModule = new vm.SyntheticModule(
                    [ "default" ],
                    evaluateExportsDefault,
                    moduleOptions
                );

                break;

            case "esm":

                /**
                 * @type {SourceTextModuleOptions}
                 */
                const sourceModuleOptions = moduleOptions;

                if ( options.moduleLocalTextSourceOptions ) {
                    const {
                        moduleImportMeta,
                        moduleImportDynamically,
                    } = options.moduleLocalTextSourceOptions;

                    if ( moduleImportMeta ) {
                        sourceModuleOptions.initializeImportMeta = moduleImportMeta
                    }

                    if ( moduleImportDynamically ) {
                        sourceModuleOptions.importModuleDynamically = moduleImportDynamically;
                    }
                }

                if ( ! sourceModuleOptions.initializeImportMeta ) {
                    sourceModuleOptions.initializeImportMeta = ( meta, module ) => {
                        meta.url = path;
                    };
                }

                try {
                    vmModule = new vm.SourceTextModule( module.source.toString(), sourceModuleOptions );

                } catch ( error ) {
                    debugger;
                }
                break;

            default:
                throw new Error( `Invalid exportType: ${ inspect( options.moduleType ) }` );
        }

        return vmModule;
    }

    /**
     * @param {zVmModule} vmModule
     * @param {zVmModuleEvaluateOptions} options
     */
    async linkModule( vmModule, options ) {
        const moduleLinkerCallback = options.moduleLocalTextSourceOptions?.moduleLinkerCallback || ( () => {
            throw new Error( "Invalid module specification" );
        } );

        await vmModule.link( moduleLinkerCallback );
        await vmModule.evaluate();

        return vmModule;
    }
}
