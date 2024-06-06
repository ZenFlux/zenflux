/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import os from "node:os";

import { DEFAULT_NPM_RC_FILE } from "@zenflux/cli/src/modules/npm/definitions";

import {
    DEFAULT_Z_CONFIG_FILE,
    DEFAULT_Z_ETC_FOLDER,
    DEFAULT_Z_VERDACCIO_CONFIG_FILE,
    DEFAULT_Z_VERDACCIO_FOLDER,
    DEFAULT_Z_VERDACCIO_HTPASSWD_FILE,
    DEFAULT_Z_VERDACCIO_STORAGE_FOLDER
} from "@zenflux/cli/src/definitions/zenflux";

const shared: {
    paths: {
        cli: any;
        verdaccioConfig: string;
        workspace: string;
        projects: string[];
        verdaccio: string;
        etc: string;
        workspaceEtc: string;
        verdaccioStorage: string;
        verdaccioHtpasswd: string;
        npmRc: string
    }
} = {
    paths: {
        // Depends on the cli self
        cli: global.__ZENFLUX_CLI__?.paths?.cli || "",

        workspace: "",
        projects: [] as string[],

        etc: "",
        workspaceEtc: "",

        verdaccio: "",
        verdaccioConfig: "",
        verdaccioStorage: "",
        verdaccioHtpasswd: "",

        npmRc: "",
    }
};

export function zGlobalInitPaths( args: {
    cwd: string,
    workspaceName: string,
    workspacePath: string,
    projectsPaths?: string[],
} ) {
    const etcPath = path.resolve( os.homedir(), DEFAULT_Z_ETC_FOLDER ),
        workspaceEtcPath = path.resolve( etcPath, args.workspaceName ),
        verdaccioPath = path.resolve( workspaceEtcPath, DEFAULT_Z_VERDACCIO_FOLDER );

    if ( ! args.projectsPaths ) {
        args.projectsPaths = [ args.cwd ];
    }

    global.__ZENFLUX_CLI__.paths = Object.freeze( {
        // Chain path to the cli
        cli: global.__ZENFLUX_CLI__.paths.cli,

        workspace: args.workspacePath || "",
        projects: args.projectsPaths,

        etc: etcPath,
        workspaceEtc: workspaceEtcPath,

        verdaccio: verdaccioPath,

        verdaccioConfig: path.resolve( verdaccioPath, DEFAULT_Z_VERDACCIO_CONFIG_FILE ),
        verdaccioStorage: path.resolve( verdaccioPath, DEFAULT_Z_VERDACCIO_STORAGE_FOLDER ),
        verdaccioHtpasswd: path.resolve( verdaccioPath, DEFAULT_Z_VERDACCIO_HTPASSWD_FILE ),

        npmRc: path.resolve( workspaceEtcPath, DEFAULT_NPM_RC_FILE ),
    } );

    return global.__ZENFLUX_CLI__.paths;
}

export function zGlobalPathsGet() {
    return global.__ZENFLUX_CLI__.paths;
}

export function zGlobalGetConfigPath( project: string, configFileName = DEFAULT_Z_CONFIG_FILE  ) {
    // Find the project path
    const projectPath = zGlobalPathsGet().projects.find( projectPath => projectPath === project );

    if ( ! projectPath ) {
        throw new Error( `Project '${ project }' not found` );
    }

    return path.resolve( projectPath, configFileName );
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    var __ZENFLUX_CLI__: typeof shared;
}

// Since commands are loaded dynamically, it should use the same node context
global.__ZENFLUX_CLI__ = Object.assign(
    {},
    // Can be injected from the outside
    global.__ZENFLUX_CLI__,
    shared
);
