/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

const packagesCache = new Map<string, Package>();

export function zGetPackageByConfig( config: IZConfigInternal ) {
    if ( ! packagesCache.has( config.path ) ) {
        packagesCache.set( config.path, new Package( path.dirname( config.path ) ) );
    }

    return packagesCache.get( config.path )!;
}

export type TForceEnumKeys<T> = { [P in keyof Required<T>]: boolean };

export function zUppercaseAt( str: string, at = 0 ): string {
    return str.charAt( at ).toUpperCase() + str.slice( at + 1 );
};
