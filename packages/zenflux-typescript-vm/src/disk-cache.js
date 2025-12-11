import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export class DiskCache {
    constructor( cacheDir ) {
        this.cacheDir = cacheDir;
        this.ensureCacheDir();
    }

    ensureCacheDir() {
        if ( ! fs.existsSync( this.cacheDir ) ) {
            fs.mkdirSync( this.cacheDir, { recursive: true } );
        }
    }

    getCacheKey( filePath ) {
        const stat = fs.statSync( filePath );
        const raw = `${ filePath }:${ stat.mtimeMs }:${ stat.size }`;
        return crypto.createHash( "md5" ).update( raw ).digest( "hex" );
    }

    getCachePath( key ) {
        return path.join( this.cacheDir, `${ key }.json` );
    }

    get( filePath ) {
        const key = this.getCacheKey( filePath );
        const cachePath = this.getCachePath( key );

        if ( fs.existsSync( cachePath ) ) {
            const data = fs.readFileSync( cachePath, "utf-8" );
            return JSON.parse( data );
        }

        return null;
    }

    set( filePath, value ) {
        const key = this.getCacheKey( filePath );
        const cachePath = this.getCachePath( key );
        fs.writeFileSync( cachePath, JSON.stringify( value ), "utf-8" );
    }
}
