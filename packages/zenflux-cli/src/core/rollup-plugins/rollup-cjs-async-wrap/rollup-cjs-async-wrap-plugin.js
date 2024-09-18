"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var node_url_1 = require("node:url");
var acorn_1 = require("acorn");
var magic_string_1 = require("magic-string");
var wrapInjection = {
    path: "",
    code: "",
};
var runInjection = {
    path: "",
    code: "",
};
function isNodeTopLevelAwait(ast, node) {
    if (node.type === "VariableDeclaration" && node.kind === "var") {
        // Check if the variable declaration contains an await expression and is not inside a function
        return node.declarations.some(function (declaration) {
            return declaration.init && declaration.init.type === "AwaitExpression";
        });
    }
    else if (node.type === "ExportNamedDeclaration") {
        if (node.declaration && node.declaration.type === "VariableDeclaration" && node.declaration.kind === "const") {
            // Check if the variable declaration contains an await expression and is not inside a function
            return node.declaration.declarations.some(function (declaration) {
                return declaration.init && declaration.init.type === "AwaitExpression";
            });
        }
    }
    return false;
}
function hasTopLevelAwait(ast) {
    for (var _i = 0, _a = ast.body; _i < _a.length; _i++) {
        var node = _a[_i];
        if (isNodeTopLevelAwait(ast, node)) {
            return true;
        }
    }
    return false;
}
function generateRandomString(length) {
    if (length === void 0) { length = 10; }
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function zRollupCjsAsyncWrapPlugin(args) {
    return {
        name: "z-rollup-cjs-async-wrap-plugin",
        buildStart: function () {
            var currentDir = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
            wrapInjection.path = node_path_1.default.resolve(currentDir, "rollup-cjs-async-wrap.js");
            wrapInjection.code = node_fs_1.default.readFileSync(wrapInjection.path, "utf-8");
            wrapInjection.code = "/* rollup-cjs-async-wrap.js */\n".concat(wrapInjection.code);
            runInjection.path = node_path_1.default.resolve(currentDir, "rollup-cjs-async-run.js");
            runInjection.code = node_fs_1.default.readFileSync(runInjection.path, "utf-8");
            runInjection.code = "/* rollup-cjs-async-run.js */\n".concat(runInjection.code);
        },
        transform: function (code, id) {
            return __awaiter(this, void 0, void 0, function () {
                var ast, magicString_1;
                return __generator(this, function (_a) {
                    if (!code.includes("await")) {
                        return [2 /*return*/, null];
                    }
                    ast = (0, acorn_1.parse)(code, {
                        ecmaVersion: "latest",
                        sourceType: "module",
                        allowAwaitOutsideFunction: true,
                    });
                    if (hasTopLevelAwait(ast)) {
                        magicString_1 = new magic_string_1.default(code);
                        magicString_1.prependLeft(ast.body[0].start, "\n");
                        ast.body.forEach(function (node) {
                            // TODO: Remove `isNodeTopLevelAwait`
                            if (isNodeTopLevelAwait(ast, node)) {
                                // Declare variable contains an await expression
                                if (node.type === "VariableDeclaration") {
                                    var vars = node.declarations.map(function (i) { return i.id.name; }).join(", ");
                                    magicString_1.prependLeft(node.start, "var ".concat(vars, ";\n"));
                                    magicString_1.overwrite(node.start, node.end, "globalThis.__Z_CJS_WARP__.zRollupCjsAsyncWrap( async() => {\n" +
                                        magicString_1.snip(node.start, node.end).toString().replace("var", "") + "\n" +
                                        "}, ".concat(node.start, " );"));
                                }
                                else if (node.type === "ExportNamedDeclaration") {
                                    if (node.declaration && node.declaration.type === "VariableDeclaration") {
                                        var originalCode = magicString_1.snip(node.start, node.end).toString();
                                        var refName = generateRandomString() + "_tempTopLevelAwait", vars = node.declaration.declarations[0].id.properties.map(function (p) { return p.key.name; });
                                        magicString_1.prependLeft(node.start - 1, "\n");
                                        magicString_1.prependLeft(node.start, "const ".concat(refName, " = { ").concat(vars.join(": undefined, "), ": undefined };\n\n"));
                                        magicString_1.overwrite(node.start, node.end, "globalThis.__Z_CJS_WARP__.zRollupCjsAsyncWrap( async() => {\n" +
                                            originalCode.replace("export", "    ") + "\n" +
                                            "".concat(vars.map(function (v) { return "    ".concat("exports", ".").concat(v, " = ").concat(v, ";"); }).join("\n"), "\n") +
                                            "}, ".concat(node.start, " );\n"));
                                        magicString_1.append("export const { ".concat(vars.join(", "), " } = ").concat(refName, ";"));
                                    }
                                }
                            }
                        });
                        return [2 /*return*/, {
                                code: magicString_1.toString(),
                                map: args.sourcemap ? magicString_1.generateMap({ hires: true }) : null,
                            }];
                    }
                    return [2 /*return*/, null];
                });
            });
        },
        renderChunk: function (code) {
            var magicString = new magic_string_1.default(code);
            // Check if chunk contains wrapped async function
            if (code.includes("__Z_CJS_WARP__") && !code.includes("/* rollup-cjs-async-wrap.js */")) {
                magicString.prepend(wrapInjection.code);
                magicString.append(runInjection.code);
                return {
                    code: magicString.toString(),
                    map: args.sourcemap ? magicString.generateMap({ hires: true }) : null,
                };
            }
        }
    };
}
exports.default = zRollupCjsAsyncWrapPlugin;
