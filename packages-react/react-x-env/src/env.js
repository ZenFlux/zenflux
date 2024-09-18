"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_process_1 = require("node:process");
var env = node_process_1.default.env;
// Use `.env`
if ("undefined" === typeof __DEV__) {
    var isDev = void 0;
    if ("undefined" !== typeof env.__DEV__) {
        isDev = env.__DEV__ === "true";
    }
    else if ("undefined" !== typeof env.NODE_ENV) {
        isDev = env.NODE_ENV === "development";
    }
    else {
        isDev = true;
    }
    globalThis.__DEV__ = isDev;
}
if ("undefined" === typeof __EXPERIMENTAL__) {
    var isExperimental = void 0;
    if ("undefined" !== typeof env.__EXPERIMENTAL__) {
        isExperimental = env.__EXPERIMENTAL__ === "true";
    }
    else {
        isExperimental = true;
    }
    globalThis.__EXPERIMENTAL__ = isExperimental;
}
if ("undefined" === typeof __PROFILE__) {
    var isProfile = void 0;
    if ("undefined" !== typeof env.__PROFILE__) {
        isProfile = env.__PROFILE__ === "true";
    }
    else {
        isProfile = false;
    }
    globalThis.__PROFILE__ = isProfile;
}
if ("undefined" === typeof __VARIANT__) {
    var isVariant = void 0;
    if ("undefined" !== typeof env.__VARIANT__) {
        isVariant = env.__VARIANT__ === "true";
    }
    else {
        isVariant = false;
    }
    globalThis.__VARIANT__ = isVariant;
}
