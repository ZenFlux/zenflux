// noinspection ES6PreferShortImport

import * as ZenCore from "../src/exports";

import type { IAPIConfig } from "../src/interfaces/config";

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
