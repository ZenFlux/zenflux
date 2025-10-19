// noinspection HttpUrlsUsage

import fs from "node:fs";
import crypto from "node:crypto";

import { zGetMatchingPathsRecursive } from "@zenflux/utils/path";

import { zNetCheckPortOnline } from "@zenflux/cli/src/utils/net";

import { zGlobalPathsGet } from "@zenflux/cli/src/core/global";

export function zRegistryGetNpmRc( path: string ) {
    // If file not exist, return false
    if ( ! fs.existsSync( path ) ) {
        return null;
    }

    const content = fs.readFileSync( path, "utf8" ),
        match = content.match( /\/\/(.*):(\d+)\/:_authToken=(.*)/ );

    if ( ! match )
        throw new Error( `Can't find token in ${ path }` );

    // Generate 4 character hash from content
    const hash = crypto
        .createHash( "md5" )
        .update( content )
        .digest( "hex" )
        .slice( 0, 4 );

    return {
        id: hash,
        host: match[ 1 ],
        port: Number( match[ 2 ] ),
        token: match[ 3 ],
        url: `http://${ match[ 1 ] }:${ match[ 2 ] }`,
        path
    };
}

export async function zRegistryGetAllNpmRcs() {
    const paths = zGlobalPathsGet();

    const npmrcPaths = await zGetMatchingPathsRecursive(
        paths.etc,
        new RegExp( ".*/*/.npmrc" ),
        3
    );

    // Get hosts from `.npmrc` files
    const results = npmrcPaths.map( ( path ) => {
        return zRegistryGetNpmRc( path );
    } );

    return results.filter( Boolean ) as NonNullable<ReturnType<typeof zRegistryGetNpmRc>>[];
}

export async function zRegistryGetAllOnlineNpmRcs() {
    const results: NonNullable<ReturnType<typeof zRegistryGetNpmRc>>[] = [],
        hosts = await zRegistryGetAllNpmRcs();

    if ( ! hosts ) {
        return results;
    }

    for ( const i of hosts ) {
        if ( await zNetCheckPortOnline( i.port, i.host ) ) {
            results.push( i );
        }
    }

    return results;
}
