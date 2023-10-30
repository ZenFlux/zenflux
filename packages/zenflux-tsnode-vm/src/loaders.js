/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { fileURLToPath } from "node:url";
import { isAbsolute } from "node:path";

import fs from "node:fs";
import util from "node:util";
import vm from "node:vm";

import { verbose } from "./utils.js";

/**
 * @typedef {"node" | "json" | "esm"} zVmModuleType
 *
 * @typedef {import("node:module").Module | Awaited<ReturnType<import("ts-node").NodeLoaderHooksAPI2.LoadHook>>} zVmModuleSource
 *
 * @typedef {vm.SyntheticModule|vm.SourceTextModule} zVmModule
 */

/**
 * @typedef {Object} zVmModuleLocalTextSourceOptions
 * @property {ReturnType<vm.SourceTextModuleOptions["initializeImportMeta"]>} [moduleImportMeta]
 * @property {ReturnType<vm.SourceTextModuleOptions["importModuleDynamically"]>} [moduleImportDynamically]
 * @property {vm.ModuleLinker | null} [moduleLinkerCallback] - null disable linking.
 */

/**
 * @typedef {Object} zVmModuleEvaluateOptions
 * @property {zVmModuleType} [moduleType]
 * @property {zVmModuleLocalTextSourceOptions} [moduleLocalTextSourceOptions]
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
            throw new Error( `Module not found at: ${ util.inspect( path ) }` );
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
            throw new Error( `JSON file not found at: ${ util.inspect( path ) }` );
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

                vmModule = new vm.SourceTextModule( module.source.toString(), sourceModuleOptions );
                break;

            default:
                throw new Error( `Invalid exportType: ${ util.inspect( options.moduleType ) }` );
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
