"use strict";
// noinspection HttpUrlsUsage
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
exports.zRegistryGetAllOnlineNpmRcs = exports.zRegistryGetAllNpmRcs = exports.zRegistryGetNpmRc = void 0;
var node_fs_1 = require("node:fs");
var node_crypto_1 = require("node:crypto");
var path_1 = require("@zenflux/utils/src/path");
var net_1 = require("@zenflux/cli/src/utils/net");
var global_1 = require("@zenflux/cli/src/core/global");
function zRegistryGetNpmRc(path) {
    // If file not exist, return false
    if (!node_fs_1.default.existsSync(path)) {
        return null;
    }
    var content = node_fs_1.default.readFileSync(path, "utf8"), match = content.match(/\/\/(.*):(\d+)\/:_authToken=(.*)/);
    if (!match)
        throw new Error("Can't find token in ".concat(path));
    // Generate 4 character hash from content
    var hash = node_crypto_1.default
        .createHash("md5")
        .update(content)
        .digest("hex")
        .slice(0, 4);
    return {
        id: hash,
        host: match[1],
        port: Number(match[2]),
        token: match[3],
        url: "http://".concat(match[1], ":").concat(match[2]),
        path: path
    };
}
exports.zRegistryGetNpmRc = zRegistryGetNpmRc;
function zRegistryGetAllNpmRcs() {
    return __awaiter(this, void 0, void 0, function () {
        var paths, npmrcPaths, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    paths = (0, global_1.zGlobalPathsGet)();
                    return [4 /*yield*/, (0, path_1.zGetMatchingPathsRecursive)(paths.etc, new RegExp(".*/*/.npmrc"), 3)];
                case 1:
                    npmrcPaths = _a.sent();
                    results = npmrcPaths.map(function (path) {
                        return zRegistryGetNpmRc(path);
                    });
                    return [2 /*return*/, results.filter(Boolean)];
            }
        });
    });
}
exports.zRegistryGetAllNpmRcs = zRegistryGetAllNpmRcs;
function zRegistryGetAllOnlineNpmRcs() {
    return __awaiter(this, void 0, void 0, function () {
        var results, hosts, _i, hosts_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    return [4 /*yield*/, zRegistryGetAllNpmRcs()];
                case 1:
                    hosts = _a.sent();
                    if (!hosts) {
                        return [2 /*return*/, results];
                    }
                    _i = 0, hosts_1 = hosts;
                    _a.label = 2;
                case 2:
                    if (!(_i < hosts_1.length)) return [3 /*break*/, 5];
                    i = hosts_1[_i];
                    return [4 /*yield*/, (0, net_1.zNetCheckPortOnline)(i.port, i.host)];
                case 3:
                    if (_a.sent()) {
                        results.push(i);
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, results];
            }
        });
    });
}
exports.zRegistryGetAllOnlineNpmRcs = zRegistryGetAllOnlineNpmRcs;
