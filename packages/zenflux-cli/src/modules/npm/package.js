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
exports.Package = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_process_1 = require("node:process");
var npm_packlist_1 = require("npm-packlist");
var pacote_1 = require("pacote");
var libnpmpublish_1 = require("libnpmpublish");
// @ts-ignore - no types available
var libnpmpack_1 = require("libnpmpack");
var registry_1 = require("@zenflux/cli/src/modules/npm/registry");
var definitions_1 = require("@zenflux/cli/src/modules/npm/definitions");
var defaultDependenciesKeys = {
    dependencies: true,
    devDependencies: true,
    peerDependencies: true,
};
var Package = /** @class */ (function () {
    function Package(projectPath, options) {
        if (projectPath === void 0) { projectPath = node_process_1.default.cwd(); }
        if (options === void 0) { options = {
            registryUrl: definitions_1.DEFAULT_NPM_REMOTE_REGISTRY_URL,
            npmRcPath: definitions_1.DEFAULT_NPM_RC_PATH,
        }; }
        this.projectPath = projectPath;
        this.options = options;
        this.publishFiles = [];
        this.json = JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(projectPath, "package.json"), "utf8"));
    }
    Package.prototype.loadRegistry = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.registry) {
                            return [2 /*return*/, this.registry];
                        }
                        this.registry = new registry_1.Registry(this.json.name, this.options.registryUrl);
                        if (!this.registry) {
                            throw new Error("Registry is not initialized");
                        }
                        return [4 /*yield*/, this.registry.await()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Package.prototype.saveAs = function (path) {
        node_fs_1.default.writeFileSync(path, JSON.stringify(this.json, null, 2));
    };
    Package.prototype.publish = function () {
        return __awaiter(this, void 0, void 0, function () {
            var manifest, tarData, token, options;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, pacote_1.default.manifest(this.getPath())];
                    case 1:
                        manifest = _a.sent();
                        return [4 /*yield*/, (0, libnpmpack_1.default)(this.getPath(), {
                                dryRun: true,
                            })];
                    case 2:
                        tarData = _a.sent();
                        token = this.getToken();
                        options = {
                            registry: this.options.registryUrl,
                            forceAuth: {
                                _authToken: token,
                            },
                        };
                        return [4 /*yield*/, libnpmpublish_1.default.publish(manifest, tarData, options)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Package.prototype.getToken = function () {
        var token = "";
        // Read token according to registry from binary file
        var content = node_fs_1.default.readFileSync(this.options.npmRcPath, "utf8");
        var lines = content.split("\n");
        var registryHost = this.options.registryUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            if (line.includes(registryHost)) {
                token = line.split("=")[1];
                break;
            }
        }
        return token;
    };
    Package.prototype.getPath = function () {
        return this.projectPath;
    };
    Package.prototype.getDisplayName = function () {
        return this.json.name + (this.json.version ? "@".concat(this.json.version) : "");
    };
    Package.prototype.getDependencies = function (keys) {
        if (keys === void 0) { keys = defaultDependenciesKeys; }
        var dependencies = {};
        for (var _i = 0, _a = Object.entries(keys); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var json = this.json[key];
            if (value && json) {
                dependencies[key] = json;
            }
        }
        return dependencies;
    };
    Package.prototype.getPublishFiles = function (cache) {
        if (cache === void 0) { cache = true; }
        return __awaiter(this, void 0, void 0, function () {
            var fakeTree, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (cache && this.publishFiles.length) {
                            return [2 /*return*/, this.publishFiles];
                        }
                        fakeTree = {
                            "path": this.getPath(),
                            "package": this.json,
                            "edgesOut": {
                                get: function () { return false; },
                            }
                        };
                        return [4 /*yield*/, (0, npm_packlist_1.default)(fakeTree)];
                    case 1:
                        result = (_a.sent()).sort();
                        if (cache) {
                            this.publishFiles = result;
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Package.prototype.getPublishFilesCache = function () {
        return this.publishFiles;
    };
    return Package;
}());
exports.Package = Package;
