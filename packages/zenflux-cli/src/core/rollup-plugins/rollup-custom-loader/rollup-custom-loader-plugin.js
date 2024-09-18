"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeComments = exports.zEmitCustomLoaderCallESM = exports.zEmitCustomLoaderCallCJS = void 0;
var fs = require("fs");
var path = require("path");
var url_1 = require("url");
var magic_string_1 = require("magic-string");
var loader = {
    path: "",
    code: "",
};
// Matches both single-line (//) and multi-line (/** */) comments
// const commentPattern = /^\s*(\/\*[\s\S]*?\*\/|\/\/.*)$/;
var importPattern = /import\s*((?:\* as \w+)|(?:\{[^}]+\})|\S+)\s*from\s*['"]([^'"]+)['"]/g;
var requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
function zEmitCustomLoaderCallCJS(module, args) {
    var argsJSON = JSON.stringify(args, null, 4);
    // Inject `__dirname` with favor of prettier
    argsJSON = argsJSON.replace(/{\s*/, "{\n    sourceDir: __dirname,\n    ");
    return "globalThis.__Z_CUSTOM_LOADER__.zCustomLoader( '".concat(module, "', ").concat(argsJSON, " )");
}
exports.zEmitCustomLoaderCallCJS = zEmitCustomLoaderCallCJS;
function zEmitCustomLoaderCallESM(module, args) {
    var argsJSON = JSON.stringify(args, null, 4);
    return "await globalThis.__Z_CUSTOM_LOADER__.zCustomLoader( '".concat(module, "', ").concat(argsJSON, " )");
}
exports.zEmitCustomLoaderCallESM = zEmitCustomLoaderCallESM;
/**
 * TODO: Not working well
 */
function removeComments(code) {
    // Matches both single-line (//) and multi-line (/** */) comments
    var commentPattern = /.*(?:\/\*[\s\S]*?\*\/|\/\/.*).*/g;
    var magicString = new magic_string_1.default(code);
    var match;
    while ((match = commentPattern.exec(code)) !== null) {
        // Get the start and end indices of the match
        var start = match.index;
        var end = start + match[0].length;
        // Remove the comment from magicString
        magicString.remove(start, end);
    }
    return magicString.toString();
}
exports.removeComments = removeComments;
function zRollupCustomLoaderPlugin(args) {
    return {
        name: "z-rollup-custom-loader-plugin",
        buildStart: function () {
            var currentDir = path.dirname((0, url_1.fileURLToPath)(import.meta.url));
            loader.path = path.resolve(currentDir, "rollup-custom-loader.js");
            loader.code = fs.readFileSync(loader.path, "utf-8");
            loader.code = "/* rollup-custom-loader.js */\n".concat(loader.code);
        },
        renderChunk: function (code, chunk, options) {
            var hasReplacements = false;
            // Create a new MagicString instance from the string without comments
            var magicString = new magic_string_1.default(code);
            var sourceId = Math.random().toString(36).slice(2);
            if ("es" === options.format) {
                // Replace import statements
                magicString.replace(importPattern, function (match, capture1, capture2) {
                    hasReplacements = true;
                    var replacement = "";
                    if (capture1.startsWith("* as")) {
                        // Handle namespace import
                        replacement = "const ".concat(capture1.replace(/\* as /, ""), " = ") + zEmitCustomLoaderCallESM(capture2, {
                            type: "import",
                            mode: "all",
                            moduleName: options.name,
                            chunkName: chunk.name,
                            sourceId: sourceId,
                        });
                    }
                    else if (capture1.includes("{")) {
                        // Handle named imports
                        if (capture1.includes(" as ")) {
                            var names = capture1.replace(/[{}]/g, "").split(",").map(function (i) {
                                var _a = i.trim().split(" as "), name = _a[0], alias = _a[1];
                                return {
                                    name: name,
                                    alias: alias,
                                };
                            });
                            replacement = "const { ".concat(names.map(function (i) { return i.name; }).join(", "), " } = ") + zEmitCustomLoaderCallESM(capture2, {
                                type: "import",
                                mode: "named",
                                moduleName: options.name,
                                chunkName: chunk.name,
                                sourceId: sourceId,
                            });
                            replacement += "\n" + names.map(function (_a) {
                                var name = _a.name, alias = _a.alias;
                                return "const ".concat(alias ? "".concat(alias, " = ") : "").concat(name);
                            }).join("; \n");
                        }
                        else {
                            replacement = "const ".concat(capture1, " = ") + zEmitCustomLoaderCallESM(capture2, {
                                type: "import",
                                mode: "named",
                                moduleName: options.name,
                                chunkName: chunk.name,
                                sourceId: sourceId,
                            });
                        }
                    }
                    else {
                        // Handle default import
                        replacement = "const ".concat(capture1, " = ") + zEmitCustomLoaderCallESM(capture2, {
                            type: "import",
                            mode: "default",
                            moduleName: options.name,
                            chunkName: chunk.name,
                            sourceId: sourceId,
                        });
                    }
                    return replacement;
                });
            }
            else if ("cjs" === options.format) {
                // Replace require statements
                magicString.replace(requirePattern, function (match, capture) {
                    hasReplacements = true;
                    var replacement = "";
                    replacement = zEmitCustomLoaderCallCJS(capture, {
                        type: "require",
                        moduleName: options.name,
                        chunkName: chunk.name,
                        sourceId: sourceId,
                    });
                    return replacement;
                });
            }
            // Include the content of customLoader.js in the bundle
            if (hasReplacements) {
                var extractedChunk = __assign({ moduleForwarding: args.moduleForwarding, outputOptions: options }, chunk);
                // @ts-ignore
                delete extractedChunk.modules;
                // @ts-ignore
                delete extractedChunk.moduleIds;
                var chunkJSON = JSON.stringify(extractedChunk, null, 4);
                var moduleForwarding = args.moduleForwarding
                    ? Object.entries(args.moduleForwarding).map(function (_a) {
                        var forModule = _a[0], sourceSlice = _a[1];
                        return Object.entries(sourceSlice).map(function (_a) {
                            var source = _a[0], target = _a[1];
                            return "globalThis.__Z_CUSTOM_LOADER__.zCustomLoaderModuleForwarding('".concat(forModule, "', '").concat(source, "', '").concat(target, "');");
                        }).join("\n");
                    }).join("\n")
                    : "";
                magicString.prepend("" +
                    "".concat(!code.includes("/* rollup-custom-loader.js */") ? loader.code + "\n" : "") +
                    "".concat(moduleForwarding, "\n") +
                    "globalThis.__Z_CUSTOM_LOADER__.zCustomLoaderData( ".concat(chunkJSON, ", '").concat(sourceId, "' );\n"));
                return {
                    code: magicString.toString(),
                    map: args.sourcemap ? magicString.generateMap({ hires: true }) : null,
                };
            }
        },
    };
}
exports.default = zRollupCustomLoaderPlugin;
