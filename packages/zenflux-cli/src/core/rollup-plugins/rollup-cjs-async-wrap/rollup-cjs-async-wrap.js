if ( "undefined" === typeof globalThis.__Z_CJS_WARP__ ) {
    function zRollupCjsAsyncWrap( callback, id ) {
        globalThis.__Z_CJS_WARP__.callbacks[ id ] = callback;
    }

    globalThis.__Z_CJS_WARP__ = {
        callbacks: {},
        zRollupCjsAsyncWrap
    }
}
