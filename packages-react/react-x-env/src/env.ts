import process from "node:process";

declare global {
    var __DEV__: boolean;
    var __EXPERIMENTAL__: boolean;
    var __PROFILE__: boolean;
    var __VARIANT__: boolean;
}

const env = process.env;

// Use `.env`
if ( "undefined" === typeof __DEV__ ) {
    let isDev: boolean;

    if ( "undefined" !== typeof env.__DEV__ ) {
        isDev = env.__DEV__ === "true";
    } else if ( "undefined" !== typeof env.NODE_ENV ) {
        isDev = env.NODE_ENV === "development";
    } else {
        isDev = true;
    }

    globalThis.__DEV__ = isDev;
}

if ( "undefined" === typeof __EXPERIMENTAL__ ) {
    let isExperimental: boolean;

    if ( "undefined" !== typeof env.__EXPERIMENTAL__ ) {
        isExperimental = env.__EXPERIMENTAL__ === "true";
    } else {
        isExperimental = true;
    }

    globalThis.__EXPERIMENTAL__ = isExperimental;
}

if ( "undefined" === typeof __PROFILE__ ) {
    let isProfile: boolean;

    if ( "undefined" !== typeof env.__PROFILE__ ) {
        isProfile = env.__PROFILE__ === "true";
    } else {
        isProfile = false;
    }

    globalThis.__PROFILE__ = isProfile;
}

if ( "undefined" === typeof __VARIANT__ ) {
    let isVariant: boolean;

    if ( "undefined" !== typeof env.__VARIANT__ ) {
        isVariant = env.__VARIANT__ === "true";
    } else {
        isVariant = false;
    }

    globalThis.__VARIANT__ = isVariant;
}

