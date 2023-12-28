/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * TODO: Add switch to disable caching, should there be caching at all?
 */
import { isAbsolute } from "node:path";

import fs from "node:fs";
import util from "node:util";
import vm from "node:vm";

import { checksum, createResolvablePromise, verbose } from "./utils.js";

export class Loaders {
    /**
     * @param {zVm} vm
     */
    constructor( vm ) {
        this.vm = vm;

        this.moduleCache = new Map();
        this.modulePrepareCache = new Map();

        this.moduleProviders = new Map();

        this.vm.providers.forEach( provider => {
            if ( ! provider.type ) {
                return;
            }

            // If already registered, error
            if ( this.moduleProviders.has( provider.type ) ) {
                throw new Error( `Provider with name: ${ util.inspect( provider.name ) } cannot be registered, type: ${ util.inspect( provider.type ) } is already registered` );
            }

            // Register provider
            this.moduleProviders.set( provider.type, provider );
        } );
    }

    /**
     * @param {string} path
     * @param {zVmModuleType} type
     * @param {vm.Module} referencingModule
     * @param {vm.ModuleLinker} linkerCallback
     * @param {vm.ModuleLinker} [dynamicLinkerCallback]
     *
     * @return {Promise<vm.Module|vm.SyntheticModule>}
     */
    async loadModule( path, type, referencingModule, linkerCallback, dynamicLinkerCallback = linkerCallback ) {
        // TODO: Enable options for all moduleProviders, currently its fine.
        /**
         * @type {zVmModuleLocalTextSourceOptions}
         */
        const options = {
            referencingModule
        };

        if ( "esm" === type ) {
            options.moduleLinkerCallback = linkerCallback;
            options.moduleImportDynamically = dynamicLinkerCallback;
        }

        return this.loadModuleWithOptions( path, type, options );
    }

    /**
     * @param {string} path
     * @param {zVmModuleType} type
     * @param {zVmModuleLocalTextSourceOptions} [options]
     *
     * @return {Promise<vm.Module|vm.SyntheticModule>}
     */
    async loadModuleWithOptions( path, type, options ) {
        let module;

        const id = this.getModuleId( path, type );

        /**
         * TODO: Find better solution for this
         *
         * Trying to get from cache if possible, some modules won't get synthesis till their dependencies are loaded
         * and if they depend one a module that depends on initial load module (circular dependency), it will cause a new module synthesis.
         */
        module = await this.getFromCache( id, path, type );

        if ( module ) {
            return module;
        }

        this.setPrepareCache( id, path, type );

        const provider = this.moduleProviders.get( type );

        module = await provider.load( path );

        switch ( type ) {
            case "node":
                module = await this.sanitizeModule( module, path, {
                    moduleType: "node",
                } );
                break;

            case "json":
                module = await this.sanitizeModule( module, path, {
                    moduleType: "json",
                } );
                break;

            case "esm":
                const url = path.startsWith( "file://" ) ? path : "file://" + path;

                /**
                 * @type {zVmModuleEvaluateOptions}
                 */
                const evalOptions = {
                    moduleType: "esm",
                };

                if ( options ) {
                    evalOptions.moduleLocalTextSourceOptions = options;
                }

                module = await this.sanitizeModule( module, url, evalOptions );
                break;

            default:
                throw new Error( `Invalid module type: ${ util.inspect( type ) }` );
        }

        this.setToCache( id, path, type, module );

        return module;
    }

    /**
     * @param {zVmModuleSource} module
     * @param {string} path
     * @param {zVmModuleEvaluateOptions} options
     *h
     * @return {Promise<zVmModule>}
     */
    async sanitizeModule( module, path, options ) {
        const vmModule = await this.evaluateModule( module, path, options );

        if ( options.moduleLocalTextSourceOptions?.moduleLinkerCallback ) {
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
                 * @this {vm.SyntheticModule}
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
                 * @this {vm.SyntheticModule}
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

            // should be source-module
            case "esm":
                /**
                 * @type {vm.SourceTextModuleOptions}
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
                        meta.refererUrl = options.moduleLocalTextSourceOptions.referencingModule.identifier
                    };
                }

                vmModule = new vm.SourceTextModule( module, sourceModuleOptions );
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

    /**
     * @param {string} id
     * @param {string} path
     * @param {zVmModuleType} type
     * @param {import("vm").Module} module
     */
    setToCache( id, path, type, module ) {
        if ( ! ( module instanceof vm.Module ) ) {
            throw new Error( `Module path: ${ util.inspect( path ) }, id: ${ util.inspect( id ) } type: ${ util.inspect( type ) } is not a module` );
        }

        if ( this.moduleCache.has( id ) ) {
            verbose( "loaders", "setToCache", () => `cache id: ${ util.inspect( id ) } path: ${ util.inspect( path ) } type: ${ util.inspect( type ) } is already set` );
            return;
        }

        verbose( "loaders", "setToCache", () => `caching: ${ util.inspect( path ) } id: ${ util.inspect( id ) } type: ${ util.inspect( type ) }` );

        this.moduleCache.set( id, {
            path,
            type,
            module,
        } );

        if ( this.modulePrepareCache.has( id ) ) {
            verbose( "loaders", "setToCache", () => `resolving prepare cache id: ${ util.inspect( id ) }` );

            this.modulePrepareCache.get( id ).promise.resolve( module );
        }
    }

    /**
     * @param {string} id
     * @param {string} path
     * @param {zVmModuleType} type
     */
    setPrepareCache( id, path, type ) {
        if ( this.modulePrepareCache.has( id ) ) {
            return;
        }

        verbose( "loaders", "setPrepareCache", () => `setting prepare cache id: ${ util.inspect( id ) }` );

        this.modulePrepareCache.set( id, {
            promise: createResolvablePromise(),
            prepare: true,
        } )
    }

    /**
     * @param {string} id
     * @param {string} path
     * @param {zVmModuleType} type
     * @param {zVmModuleEvaluateOptions["moduleType"]} type
     *
     * @return {Promise<import("vm").Module>}
     */
    async getFromCache( id, path, type ) {
        let result = undefined;

        if ( this.modulePrepareCache.has( id ) ) {
            verbose( "loaders", "getFromCache", () => `waiting for prepare: ${ util.inspect( path ) } id: ${ util.inspect( id ) } type: ${ util.inspect( type ) }` );

            await this.modulePrepareCache.get( id ).promise.await;

            verbose( "loaders", "getFromCache", () => `prepare released: ${ util.inspect( path ) } id: ${ util.inspect( id ) } type: ${ util.inspect( type ) }` );
        }

        // Check if the module is already cached
        if ( this.moduleCache.has( id ) ) {
            result = this.moduleCache.get( id );

            if ( result.type !== type ) {
                throw new Error( `Module path: ${ util.inspect( path ) } is already cached with different type: ${ util.inspect( result.type ) } !== ${ util.inspect( type ) }` );
            }

            if ( result.path !== path ) {
                verbose( "loaders", "getFromCache", () => `receiving: ${ util.inspect( result.path ) } !== ${ util.inspect( path ) } module is already cached with different path` );
            }

            verbose( "loaders", "getFromCache", () => `receiving: ${ util.inspect( result.path ) } from cache` );

            result = result.module;
        }

        return result;
    }

    getModuleId( path, type ) {
        const factor = "node" === type && ! isAbsolute( path ) ?
            path : fs.readFileSync( path );

        return checksum( factor );
    }
}
