"use strict";
// noinspection ES6PreferShortImport
Object.defineProperty(exports, "__esModule", { value: true });
var ZenCore = require("../src/exports");
var shared = {
    globalizeZenCore: function () {
        // @ts-ignore
        globalThis.zCore = ZenCore;
    },
    initZenCore: function () {
        this.globalizeZenCore();
        ZenCore.initialize({});
    },
    destroyZenCore: function () {
        ZenCore.destroy();
    }
};
exports.default = shared;
