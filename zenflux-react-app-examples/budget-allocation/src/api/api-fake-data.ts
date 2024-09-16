import AffiliateProgramPNG from "@zenflux/app-budget-allocation/assets/affiliate-program.png";
import TestPNG from "@zenflux/app-budget-allocation/assets/test.png";

const storage = window.localStorage;

function initializeStorage() {
    storage.clear();
    if ( storage.getItem( "__DEFAULT_STORAGE__" ) === null ) {
        storage.setItem( "__DEFAULT_STORAGE__", "true" );
        storage.setItem( "/v1/channels/free-reviews", JSON.stringify( {
            key: "free-reviews",
            meta: {
                id: "free-reviews",
                name: "Free Reviews",
                icon: TestPNG,
                createdAt: 0,
            },
            allocation: "equal",
            baseline: "0",
            frequency: "annually",
            breaks: [],
        } ) );
        storage.setItem( "/v1/channels/paid-reviews", JSON.stringify( {
            key: "paid-reviews",
            meta: {
                id: "paid-reviews",
                name: "Paid Reviews",
                icon: AffiliateProgramPNG,
                createdAt: 1,
            },
            allocation: "equal",
            baseline: "0",
            frequency: "annually",
            breaks: [],
        } ) );
    }
}

initializeStorage();

function isObject( item: any ) {
    return ( item && typeof item === "object" && ! Array.isArray( item ) );
}

function deepMerge( target: any, source: any ) {
    const output = { ... target };
    if ( isObject( target ) && isObject( source ) ) {
        Object.keys( source ).forEach( key => {
            if ( isObject( source[ key ] ) && key in target ) {
                output[ key ] = deepMerge( target[ key ], source[ key ] );
            } else {
                output[ key ] = source[ key ];
            }
        } );
    }
    return output;
}

globalThis.fetch = ( input: RequestInfo | URL, init?: RequestInit ): Promise<Response> => {
    const url = typeof input === "string" ? new URL( input ) : input instanceof URL ? input : new URL( input.url );
    const path = url.pathname;
    const method = init?.method || "GET";

    console.log( `API: ${ method } ${ path }` );

    const baseInit = {};

    const act = async () => {
        if ( method === "GET" ) {
            const data = storage.getItem( path );
            if ( ! data ) {
                const items: Record<string, any> = {};
                for ( const key in storage ) {
                    if ( key.startsWith( path ) ) {
                        items[ key ] = JSON.parse( storage.getItem( key ) || "{}" );
                    }
                }
                const sortedItems: Record<string, string> = {};

                // Sort by meta.createdAt
                Object.keys( items ).sort( ( a, b ) => {
                    const aCreatedAt = items[ a ].meta.createdAt;
                    const bCreatedAt = items[ b ].meta.createdAt;
                    return aCreatedAt - bCreatedAt;
                } ).forEach( key => {
                    sortedItems[ key ] = items[ key ];
                } );

                return Promise.resolve( new Response( JSON.stringify( Object.values( sortedItems ) ), baseInit ) );
            }
            return Promise.resolve( new Response( data || "{}", baseInit ) );
        } else if ( method === "POST" || method === "PUT" ) {
            const data = init?.body || "";
            const currentData = storage.getItem( path ) || "{}";
            if ( typeof data !== "string" ) {
                return Promise.reject( new Error( `Data at ${ path } is not a string` ) );
            }
            const newData = JSON.stringify( deepMerge(
                JSON.parse( currentData ),
                JSON.parse( data ),
            ) );
            storage.setItem( path, newData );
            return Promise.resolve( new Response( data, baseInit ) );
        } else if ( method === "DELETE" ) {
            storage.removeItem( path );
            return Promise.resolve( new Response( "{\"ok\": true}", baseInit ) );
        } else {
            return Promise.reject( new Error( `Method ${ method } not implemented` ) );
        }
    };

    return act();
};
