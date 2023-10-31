/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "path";

import { DEFAULT_NPM_RC_FILE } from "@z-cli/modules/npm/definitions";

import {
    DEFAULT_Z_CONFIG_FILE,
    DEFAULT_Z_ETC_FOLDER,
    DEFAULT_Z_VERDACCIO_CONFIG_FILE,
    DEFAULT_Z_VERDACCIO_FOLDER,
    DEFAULT_Z_VERDACCIO_HTPASSWD_FILE,
    DEFAULT_Z_VERDACCIO_STORAGE_FOLDER
} from "@z-cli/definitions/zenflux";

const shared = {
    paths: {
        workspace: "",
        projects: [] as string[],
        etc: "",

        verdaccio: "",
        verdaccioConfig: "",
        verdaccioStorage: "",
        verdaccioHtpasswd: "",

        npmRc: "",
    }
};

export function zGlobalInitPaths( args: {
    cwd: string,
    workspacePath: string,
    projectsPaths?: string[],
} ) {
    const workingPath = args.workspacePath || args.cwd,
        etcPath = path.resolve( workingPath, DEFAULT_Z_ETC_FOLDER ),
        verdaccioPath = path.resolve( etcPath, DEFAULT_Z_VERDACCIO_FOLDER );

    if ( ! args.projectsPaths ) {
        args.projectsPaths = [ args.cwd ];
    }

    global.__ZENFLUX_CLI__.paths = Object.freeze( {
        workspace: args.workspacePath || "",
        projects: args.projectsPaths,

        etc: etcPath,

        verdaccio: verdaccioPath,

        verdaccioConfig: path.resolve( verdaccioPath, DEFAULT_Z_VERDACCIO_CONFIG_FILE ),
        verdaccioStorage: path.resolve( verdaccioPath, DEFAULT_Z_VERDACCIO_STORAGE_FOLDER ),
        verdaccioHtpasswd: path.resolve( verdaccioPath, DEFAULT_Z_VERDACCIO_HTPASSWD_FILE ),

        npmRc: path.resolve( etcPath, DEFAULT_NPM_RC_FILE ),
    } );

    return global.__ZENFLUX_CLI__.paths;
}

export function zGlobalPathsGet() {
    return global.__ZENFLUX_CLI__.paths;
}

export function zGlobalGetConfigPath( project: string ) {
    // Find the project path
    const projectPath = zGlobalPathsGet().projects.find( projectPath => projectPath === project );

    if ( ! projectPath ) {
        throw new Error( `Project '${ project }' not found` );
    }

    return path.resolve( projectPath, DEFAULT_Z_CONFIG_FILE );
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    var __ZENFLUX_CLI__: typeof shared;
}

// Since commands are loaded dynamically, it should use the same node context
global.__ZENFLUX_CLI__ =  shared;
