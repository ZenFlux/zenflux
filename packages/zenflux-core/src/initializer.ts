// @ts-ignore
import * as pkg from "../package.json" assert { type: "json" };

import { destroy, initialize, afterInitializeCallbacks } from "@z-core/managers/export";

import * as exported from "@z-core/exports";

import type { IAPIConfig } from "@z-core/interfaces";

function errorInitTwice() {
    if ( "undefined" !== typeof __ZEN_CORE__IS_INITIALIZED__ && __ZEN_CORE__IS_INITIALIZED__) {
        throw new Error( "ZenCore is already initialized." );
    }
}

errorInitTwice();

export let config: IAPIConfig = {
    version: pkg.version,
};

export const CoreAPI = {
    initialize: ( configuration?: Partial<IAPIConfig> ) => {
        errorInitTwice();

        config = (configuration || config) as IAPIConfig;

        initialize( config );

        globalThis.__ZEN_CORE__IS_INITIALIZED__ = true;

    },

    destroy: () => {
        destroy();

        globalThis.__ZEN_CORE__IS_INITIALIZED__ = false;
    },

    onAfterInitialize: ( callback: () => void ) => {
        afterInitializeCallbacks.push( callback );
    },

    config,

    ...exported,
};

if ( ! globalThis?.ZenCore ) globalThis.ZenCore = CoreAPI;

declare global {
    var ZenCore: typeof CoreAPI;
    var __ZEN_CORE__IS_INITIALIZED__: boolean;
}

// console.log( `ZenCore initialized, version: ${pkg.version}` );
