/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
// @ts-ignore - TODO handle error in jest
import { bases, commandBases, errors, interfaces, managers, } from "./exports-index";

import { Logger } from "./modules/logger";

import * as pkg from "../package.json" assert { type: "json" };

declare global {
    var __ZEN_CORE__IS_INITIALIZED__: boolean;
}

export const classes = {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    /* eslint-disable @typescript-eslint/explicit-member-accessibility */

    Logger,

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
