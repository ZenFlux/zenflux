// noinspection ES6PreferShortImport

import { CoreAPI } from "../src/initializer";

import type { IAPIConfig } from "../src/interfaces/config";

const shared = {
    globalizeZenCore: function() {
        globalThis.ZenCore = CoreAPI;
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
