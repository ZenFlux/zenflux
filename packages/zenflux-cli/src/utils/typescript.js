"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zTSGetPackageByTSConfig = exports.zTSGetPackageByConfig = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_path_1 = require("node:path");
var package_1 = require("@zenflux/cli/src/modules/npm/package");
var packagesCache = new Map();
function zTSGetPackageByConfig(config) {
    var configPath = node_path_1.default.dirname(config.path);
    if (!packagesCache.has(configPath)) {
        packagesCache.set(configPath, new package_1.Package(configPath));
    }
    return packagesCache.get(configPath);
}
exports.zTSGetPackageByConfig = zTSGetPackageByConfig;
function zTSGetPackageByTSConfig(tsConfig) {
    var configPath = tsConfig.options.configFilePath.toString();
    if (!packagesCache.has(configPath)) {
        packagesCache.set(configPath, new package_1.Package(node_path_1.default.dirname(configPath)));
    }
    return packagesCache.get(configPath);
}
exports.zTSGetPackageByTSConfig = zTSGetPackageByTSConfig;
