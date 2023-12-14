(async function zCjsAsyncTopLevelEntry() {
    var callbacks = [ ... Object.entries( globalThis.__Z_CJS_WARP__.callbacks ) ];

    for( var i = 0; i < callbacks.length; i++ ) {
        var [ name, callback ] = callbacks[ i ];

        await callback();

        delete globalThis.__Z_CJS_WARP__.callbacks[ name ];
    }

    if( Object.keys( globalThis.__Z_CJS_WARP__.callbacks ).length > 0 ) {
        await zCjsAsyncTopLevelEntry();
    }

})().catch( function( error ) {
    throw error;
} ).then( function() {
} );
