/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import packlist from "npm-packlist";
import pacote from "pacote";
import npmpublish from "libnpmpublish";

// @ts-ignore - no types available
import pack from "libnpmpack";

import { Registry } from "@zenflux/cli/src/modules/npm/registry";

import {
    DEFAULT_NPM_RC_PATH,
    DEFAULT_NPM_REMOTE_REGISTRY_URL
} from "@zenflux/cli/src/modules/npm/definitions";

import type { TForceEnumKeys } from "@zenflux/cli/src/utils/common";

export type TPackages = { [ packageName: string ]: Package };

export type TPackageDependencies = { [ packageName: string ]: string };

export type TPackagePartialDependencies = {
    dependencies?: TPackageDependencies;
    devDependencies?: TPackageDependencies;
    peerDependencies?: TPackageDependencies;
}

export type TPackagePartialJson = TPackagePartialDependencies & {
    name: string;
    workspaces?: string[];
    version?: string;
    files?: string[];
    publishConfig?: {
        access: string;
    }
}

export type TNewPackageOptions = {
    registryUrl: string;
    npmRcPath: string;
}

const defaultDependenciesKeys: TForceEnumKeys<TPackagePartialDependencies> = {
    dependencies: true,
    devDependencies: true,
    peerDependencies: true,
};

export class Package {
    public json: TPackagePartialJson;

    private registry: Registry;

    private publishFiles: string[] = [];

    public constructor( private projectPath = process.cwd(), private options: TNewPackageOptions = {
        registryUrl: DEFAULT_NPM_REMOTE_REGISTRY_URL,
        npmRcPath: DEFAULT_NPM_RC_PATH,
    } ) {
        this.json = JSON.parse( fs.readFileSync( path.join( projectPath, "package.json" ), "utf8" ) );
    }

    public async loadRegistry() {
        if ( this.registry ) {
            return this.registry;
        }

        this.registry = new Registry( this.json.name, this.options.registryUrl );

        if ( ! this.registry ) {
            throw new Error( "Registry is not initialized" );
        }

        return await this.registry.await();
    }

    public saveAs( path: string ) {
        fs.writeFileSync( path, JSON.stringify( this.json, null, 2 ) );
    }

    public async publish() {
        const manifest = await pacote.manifest( this.getPath() ) as any;

        // Passing `dryRun` to avoid writing on disk
        const tarData = await pack( this.getPath(), {
            dryRun: true,
        } );

        const token = this.getToken();

        const options = {
            registry: this.options.registryUrl,
            forceAuth: {
                _authToken: token,
            },
        };

        return await npmpublish.publish( manifest, tarData, options );
    }

    private getToken() {
        let token = "";

        // Read token according to registry from binary file
        const content = fs.readFileSync( this.options.npmRcPath, "utf8" );
        const lines = content.split( "\n" );
        const registryHost = this.options.registryUrl.replace( /^https?:\/\//, "" ).replace( /\/$/, "" );

        for ( const line of lines ) {
            if ( line.includes( registryHost ) ) {
                token = line.split( "=" )[ 1 ];

                break;
            }
        }
        return token;
    }

    public getPath() {
        return this.projectPath;
    }

    public getDisplayName() {
        return this.json.name + ( this.json.version ? `@${ this.json.version }` : "" );
    }

    public getDependencies( keys = defaultDependenciesKeys ) {
        const dependencies: TPackagePartialDependencies = {};

        for ( const [ key, value ] of Object.entries( keys ) ) {
            const json = this.json[ key as keyof TPackagePartialDependencies ];

            if ( value && json ) {
                dependencies[ key as keyof TPackagePartialDependencies ] = json;
            }
        }

        return dependencies;
    }

    public async getPublishFiles( cache = true ): Promise<string[]> {
        if ( cache && this.publishFiles.length ) {
            return this.publishFiles;
        }

        const fakeTree = {
            "path": this.getPath(),
            "package": this.json,
            "edgesOut": {
                get: () => false,
            }
        };

        // @ts-ignore - since we are using fake tree, we can ignore this error
        const result = ( await packlist( fakeTree ) ).sort();

        if ( cache ) {
            this.publishFiles = result;
        }

        return result;
    }

    public getPublishFilesCache() {
        return this.publishFiles;
    }
}
