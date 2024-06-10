import util from "node:util";

import { Socket } from "node:net";

export function zNetCheckPortOnline( port: number, host = "0.0.0.0" ) {
    return new Promise( ( resolve, reject ) => {
        const socket = new Socket();

        const timeout = () => {
            resolve( false );
            socket.destroy();
        };

        setTimeout( timeout, 10 );

        socket.on( "timeout", timeout );

        socket.on( "connect", () => {
            resolve( true );
            socket.destroy();
        } );

        socket.on( "error", ( error: { code: string; } ) => {
            if ( error.code !== "ECONNREFUSED" )
                reject( false );
            else
                resolve( false );
        } );

        socket.connect( port, host );
    } );
}

export async function zNetFindFreePort( range: [ number, number ], host = "0.0.0.0" ) {
    let port = range[ 0 ];

    while ( port <= range[ 1 ] ) {
        const isOnline = await zNetCheckPortOnline( port, host );

        if ( ! isOnline ) return port;

        ++port;
    }

    throw new Error( `No free port found in range: ${ util.inspect( range ) }` );
}
