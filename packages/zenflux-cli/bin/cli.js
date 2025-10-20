#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";
import path from "node:path";
import fs from "node:fs";

const isBun = typeof process.versions.bun !== "undefined";

if (!isBun) {
    const requiredFlags = [
        '--experimental-vm-modules',
        '--experimental-import-meta-resolve'
    ];

    const missingFlags = requiredFlags.filter(flag => !process.execArgv.includes(flag));

    if (missingFlags.length > 0) {
        const nodeArgs = [
            '--unhandled-rejections=strict',
            '--experimental-vm-modules',
            '--trace-uncaught',
            '--no-warnings',
            '--experimental-import-meta-resolve',
            fileURLToPath(import.meta.url),
            ...process.argv.slice(2)
        ];

        try {
            execFileSync('node', nodeArgs, { stdio: 'inherit' });
            process.exit(0);
        } catch (err) {
            process.exit(err.status || 1);
        }
    }
}

const { Loaders, Resolvers, vm } = await import("@zenflux/typescript-vm");
const { workerData } = await import("node:worker_threads");
const { ErrorWithMeta } = await import("@zenflux/utils/error");

const currentFilePath = fileURLToPath(import.meta.url || `file://${__filename}`),
    currentDirPath = path.dirname(currentFilePath),
    currentWorkspacePackageJsonPath = path.resolve(currentDirPath, "../../../package.json");

function isZenWorkspace() {
    if (fs.existsSync(currentWorkspacePackageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(currentWorkspacePackageJsonPath, "utf-8"));

        if (packageJson.name === "@zenflux/zenflux")
            return true;
    }
}

// For better error stack trace, since we are using vm.
Error.stackTraceLimit = Infinity;

global.__ZENFLUX_CLI__ = {
    paths: {
        cli: currentFilePath,
    }
};

const vmContext = {
    global,

    fetch,
    setTimeout,
    setInterval,
    setImmediate,
    clearTimeout,
    clearInterval
};

Object.defineProperty(vmContext, "console", {
    get() {
        throw new Error("global 'console' is restricted use local module");
    }
});

/**
 * @type {typeof import("@zenflux/typescript-vm/src/config.js").externalConfig}
 */
const config = {
    projectPath: path.resolve(currentDirPath, "../"),

    nodeModulesPath: process.env["npm_package_json"] ?
        path.dirname(process.env["npm_package_json"]) : path.resolve(currentDirPath, "../../../node_modules"),

    tsConfigPath: path.resolve(currentDirPath, "./tsconfig.json"),

    vmContext,

    vmModuleEvaluateOptions: {
        breakOnSigint: !isBun,
    },

    extensions: [".ts", ".json"],

    useSwc: true,

    useTsNode: false,
};

if (isZenWorkspace()) {
    config.workspacePath = path.dirname(currentWorkspacePackageJsonPath);
}

vm.defineConfig(config);

if (isBun) {
    await import(path.resolve(currentDirPath, "../src/boot.ts"));
} else {
    vm.tap(async (vm) => {
        const resolvers = new Resolvers(vm),
            loaders = new Loaders(vm);

        await vm.auto(workerData?.zCliWorkPath || vm.config.paths.project + "/src/boot.ts", loaders, resolvers).catch((err) => {
            if (err.message) {
                const deepStack = err.meta?.deepStack || [];

                deepStack.push(import.meta.url || `file://${__filename}`);

                const isGenericError = err.message.includes('Error in @zenflux/cli') ||
                    err.message.includes('While running boot script');

                const errorMessage = isGenericError ?
                    `Error in @zenflux/cli, While running boot script` :
                    `Error in @zenflux/cli: ${err.message}`;

                err = new ErrorWithMeta(errorMessage, {
                    ...err.meta || {},
                    config: vm.config.paths,
                    deepStack,
                    originalError: err.message
                }, err);
            }

            throw err;
        });
    } )
}
