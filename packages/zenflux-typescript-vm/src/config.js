import util from "node:util";

import { createResolvablePromise, verbose } from "./utils.js";

const defineConfigPromise = createResolvablePromise();

export const externalConfig = {
    projectPath: "./",
    workspacePath: "",
    entrypointPath: "src/index.ts",
    nodeModulesPath: "../node_modules",

    tsConfigPath: "./tsconfig.json",
    tsConfigVerbose: ( path ) => {
        verbose( "ts-node", "readConfig", () => `reading: ${ util.inspect( path ) }` );
    },

    /**
     * @type {import("node:vm").Context}
     */
    vmContext: {},

    /**
     * @type {import("node:vm").CreateContextOptions}
     */
    vmContextOptions: {},

    /**
     * Determines whether to use ts-node compiler or not.
     *
     * @param {boolean}
     */
    useTsNode: true,

    /**
     * Determines whether to use SWC compiler or not.
     *
     * @type {boolean}
     */
    useSwc: false,

    /**
     * Extensions to use when resolving modules, without a leading dot.
     */
    extensions: [ ".ts", ".tsx", ".js", ".jsx", ".json" ],
};

/**
 * @param {typeof externalConfig} config
 */
function validateConfig( config ) {
    if ( ! config.useTsNode && ! config.useSwc ) {
        throw new Error( "Must use either `useTsNode` or `useSwc` to transpile typescript" );
    }
}

/**
 * @param {typeof externalConfig} config
 */
export function defineConfig( config ) {
    Object.assign( externalConfig, config );

    validateConfig( externalConfig );

    defineConfigPromise.resolve();
};

export async function waitForConfig() {
    await defineConfigPromise.promise;
}
