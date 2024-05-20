/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/internal";

import type ts from "typescript";

const packagesCache = new Map<string, Package>();

export function zTSGetPackageByConfig( config: IZConfigInternal ) {
    const configPath = path.dirname( config.path );

    if ( ! packagesCache.has( configPath ) ) {
        packagesCache.set( configPath, new Package( configPath ) );
    }

    return packagesCache.get( configPath )!;
}

export function zTSGetPackageByTSConfig( tsConfig: ts.ParsedCommandLine ) {
    const configPath = tsConfig.options.configFilePath!.toString();

    if ( ! packagesCache.has( configPath ) ) {
        packagesCache.set( configPath, new Package( path.dirname( configPath ) ) );
    }

    return packagesCache.get( configPath )!;
}
