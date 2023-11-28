import util from "node:util";

import { createResolvablePromise, verbose } from "./utils.js";

const defineConfigPromise = createResolvablePromise();

export const externalConfig = {
    /**
     * Enable support for resolving workspace packages, eg: `@company/package`,
     * it will read "workspace" field from `package.json`.
     *
     * @type {string}
     */
    workspacePath: "",

    projectPath: "./",
    entrypointPath: "src/index.ts",
    nodeModulesPath: "../node_modules",

    tsConfigPath: "./tsconfig.json",
    tsConfigVerbose: ( path ) => {
        verbose( "typescript-vm", "readConfig", () => `reading: ${ util.inspect( path ) }` );
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
    useTsNode: false,

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
    if ( externalConfig.extensions.includes( [ ".ts", ".tsx" ] && ( ! config.useTsNode && ! config.useSwc )) ) {
        throw new Error( "Must use either `useTsNode` or `useSwc` to transpile typescript" );
    }

    if ( config.useTsNode && config.useSwc ) {
        throw new Error( "Cannot use both `useTsNode` and `useSwc`" );
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
