/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
// @ts-ignore - TODO handle error in jest
import pkg from "@zenflux/core/package.json" assert { type: "json" };

import { bases, commandBases, errors, interfaces, managers, } from "@zenflux/core/src/exports-index";

declare global {
    var __ZEN_CORE__IS_INITIALIZED__: boolean;
}

export const classes = {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    /* eslint-disable @typescript-eslint/explicit-member-accessibility */

    Logger: class NullLogger implements interfaces.ILogger {
        constructor( owner: typeof bases.ObjectBase, params: any = {} ) {
        }

        log( caller: interfaces.TCaller, message: string, ... params: any[] ) {}
        warn( caller: interfaces.TCaller, message: string, ... params: any[] ) {}
        error( caller: interfaces.TCaller, message: string, ... params: any[] ) {}
        info( caller: interfaces.TCaller, message: string, ... params: any[] ) {}
        debug( caller: interfaces.TCaller, message: string, ... params: any[] ) {}
        startsEmpty( caller: interfaces.TCaller ) {}
        startsWith( caller: interfaces.TCaller, params: object ) {}
        dump( caller: interfaces.TCaller, data: any ) {}
        drop( caller: interfaces.TCaller, according: { [ key: string ]: string }, data: any ) {}
    }

    /* eslint-enable */
};

let exportedConfig: interfaces.IAPIConfig = {
    version: pkg.version,
};

export function initialize( config?: Partial<interfaces.IAPIConfig> ) {
    if ( "undefined" !== typeof __ZEN_CORE__IS_INITIALIZED__ && __ZEN_CORE__IS_INITIALIZED__ ) {
        throw new Error( "ZenCore is already initialized." );
    }

    exportedConfig = ( config || exportedConfig ) as interfaces.IAPIConfig;

    managers.initialize( exportedConfig );

    globalThis.__ZEN_CORE__IS_INITIALIZED__ = true;
}

export function destroy() {
    managers.destroy();

    globalThis.__ZEN_CORE__IS_INITIALIZED__ = false;
}

export function onAfterInitialize( callback: () => void ) {
    managers.afterInitializeCallbacks.push( callback );
}

export const config = exportedConfig;

export {
    bases,
    commandBases,
    errors,
    interfaces,
    managers
};
