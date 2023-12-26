// Self calling anonymous function
(async function zCjsAsyncTopLevelEntry() {
    // console.log( "Warp loading" );

    var callbacks = [ ... Object.entries( globalThis.__Z_CJS_WARP__.callbacks ) ];

    for( var i = 0; i < callbacks.length; i++ ) {
        var [ name, callback ] = callbacks[ i ];

        await callback();

        delete globalThis.__Z_CJS_WARP__.callbacks[ name ];
    }

    // TODO: Test
    // Check if new callbacks were added while we were running
    if( Object.keys( globalThis.__Z_CJS_WARP__.callbacks ).length > 0 ) {
        await zCjsAsyncTopLevelEntry();
    }

})().catch( function( error ) {
    // console.error( error );
    // process.exit( 1 );
    throw error;
} ).then( function() {
} );
