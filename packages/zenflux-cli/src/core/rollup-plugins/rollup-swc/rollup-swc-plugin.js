"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zRollupSwcCompareCaches = void 0;
var node_util_1 = require("node:util");
var node_fs_1 = require("node:fs");
var core_1 = require("@swc/core");
var tsconfig_to_swc_1 = require("@zenflux/tsconfig-to-swc");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
function zRollupSwcPlugin(args) {
    var _a;
    var swcOptions = (0, tsconfig_to_swc_1.convertTsConfig)(args.tsConfig, {
        sourceMaps: args.sourcemap,
        minify: args.minify,
    });
    if (!swcOptions || !swcOptions.module) {
        throw new Error("Unable to convert tsconfig to swc options");
    }
    if ((args.format === "es" && !["nodenext", "es6"].includes(swcOptions.module.type))) {
        // Tell the user that bundling esm is limited to 'NodeNext' or 'ES6'
        throw new Error("Bundling esm is limited to 'NodeNext' or 'ES6'\n" +
            "Please ensure that `\"module\": \"NodeNext\"` or any ES(eg: `\"module\": \"ESNext\"` type is set in your `tsconfig.json`\n" +
            "Caused by file://" + args.tsConfig.options.configFilePath);
    }
    else if (args.format === "cjs" && swcOptions.module.type !== "nodenext") {
        throw new Error("Rollup does not bundle `require` calls, currently bundling commonjs is limited to 'NodeNext'\n" +
            "Please ensure that `\"module\": \"NodeNext\"` is set in your `tsconfig.json`\n" +
            "Caused by file://" + args.tsConfig.options.configFilePath);
    }
    if ((_a = swcOptions.jsc) === null || _a === void 0 ? void 0 : _a.paths) {
        throw new Error("@zenflux/cli currently does not support paths, caused by file://" + args.tsConfig.options.configFilePath);
    }
    var cache = new Map();
    return {
        name: "z-rollup-swc-plugin",
        transform: function (source, id) {
            console_manager_1.ConsoleManager.$.debug(function () { return ["Transforming", id]; });
            // If id has \x00, then its virtual module, and cannot be interacted with fs.
            var lastModified = id.startsWith("\x00") ? Math.random() :
                node_fs_1.default.statSync(id).mtimeMs;
            var cached = cache.get(id);
            // Since `z-cli` being used with manual watch mode, we can't rely on `rollup`'s cache
            if (cached && cached.lastModified === lastModified) {
                return cached.output;
            }
            try {
                var output = core_1.default.transformSync(source, swcOptions);
                // Acknowledge change for `build` command
                this.cache.set(id, { output: output, lastModified: lastModified });
                cache.set(id, { output: output, lastModified: lastModified });
                return output;
            }
            catch (error) {
                // Make error message more readable/useful
                if ("undefined" !== typeof error.message) {
                    var newMessage = "".concat(error.message, " in project ").concat(node_util_1.default.inspect(args.tsConfig.options.configFilePath), "\n    While SWC transform of file: (").concat(id.startsWith("file://") ? id : "file://" + id, ") ") +
                        "with options: \n    ".concat(node_util_1.default.inspect(swcOptions, {
                            breakLength: 1,
                            compact: false,
                        }).replace(/^ +/gm, function (a) { return "    ".repeat(a.split("").length); }));
                    error.message = newMessage.substring(newMessage.length - 1, 1) + "    }";
                }
                throw error;
            }
        },
    };
}
exports.default = zRollupSwcPlugin;
;
function zRollupSwcCompareCaches(prevCache, currentCache) {
    // Check if the number of modules is the same
    if (prevCache.modules.length !== currentCache.modules.length) {
        return false;
    }
    function getZenFluxSwcPluginChecksum(cache) {
        var _a;
        return Object.values((_a = cache.plugins["z-rollup-swc-plugin"]) !== null && _a !== void 0 ? _a : []).reduce(function (acc, record) {
            var _a;
            return acc + (((_a = record[1]) === null || _a === void 0 ? void 0 : _a.lastModified) || Math.random());
        }, 0);
    }
    return getZenFluxSwcPluginChecksum(prevCache) === getZenFluxSwcPluginChecksum(currentCache);
}
exports.zRollupSwcCompareCaches = zRollupSwcCompareCaches;
