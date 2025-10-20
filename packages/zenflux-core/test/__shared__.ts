// noinspection ES6PreferShortImport

import * as ZenCore from "@zenflux/core/src/exports";

import type { IAPIConfig } from "@zenflux/core/src/interfaces/config";

const shared = {
    globalizeZenCore: function() {
        // @ts-ignore
        globalThis.zCore = ZenCore;
    },

    initZenCore: function() {
        this.globalizeZenCore();

        ZenCore.initialize( {} as IAPIConfig );
    },

    destroyZenCore: function() {
        ZenCore.destroy();
    }
};

export default shared;
