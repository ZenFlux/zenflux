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
exports.zWorkspaceGetRootPackageName = exports.zWorkspaceGetWorkspaceDependencies = exports.zWorkspaceGetPackagesPaths = exports.zWorkspaceGetPackages = exports.zWorkspaceFindPackages = exports.zWorkspaceExtractPackage = exports.zWorkspaceExtractPackages = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_path_1 = require("node:path");
var node_util_1 = require("node:util");
var path_1 = require("@zenflux/utils/src/path");
var workspace_1 = require("@zenflux/utils/src/workspace");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var package_1 = require("@zenflux/cli/src/modules/npm/package");
function zWorkspaceExtractPackages(regex, rootPkg, packages) {
    var result = {};
    var regexPattern = new RegExp(regex);
    Object.keys(packages).forEach(function (key) {
        var packageName = packages[key] ? key : "".concat(rootPkg.json.name.split("/")[0], "/").concat(key);
        if (regexPattern.test(packageName)) {
            if (packages[packageName]) {
                result[packageName] = packages[packageName];
            }
        }
    });
    return result;
}
exports.zWorkspaceExtractPackages = zWorkspaceExtractPackages;
function zWorkspaceExtractPackage(name, rootPkg, packages) {
    name = name.trim();
    // eg: root package name is "@zenflux/zenflux".
    // if searching for "cli" package, it will return "@zenflux/zenflux-cli".
    // if searching for "zenflux/cli" package, it will return "@zenflux/zenflux-cli".
    var packageName = packages[name] ? name : "".concat(rootPkg.json.name.split("/")[0], "/").concat(name);
    if (packages[packageName]) {
        return packages[packageName];
    }
}
exports.zWorkspaceExtractPackage = zWorkspaceExtractPackage;
var zWorkspaceFindPackagesCache = {};
function zWorkspaceFindPackages(names, workspacePath, options) {
    var _a;
    if (workspacePath === void 0) { workspacePath = node_path_1.default.dirname((0, workspace_1.zFindRootPackageJsonPath)({ silent: true })); }
    if (options === void 0) { options = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var result, _b, silent, _c, useCache, fromCache, rootPkg, packages;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    result = {};
                    _b = options.silent, silent = _b === void 0 ? false : _b, _c = options.useCache, useCache = _c === void 0 ? true : _c;
                    if (useCache && zWorkspaceFindPackagesCache[workspacePath]) {
                        fromCache = Object.entries(zWorkspaceFindPackagesCache[workspacePath]);
                        if (fromCache.length === names.length && fromCache.every(function (_a) {
                            var key = _a[0];
                            return names.includes(key);
                        })) {
                            return [2 /*return*/, zWorkspaceFindPackagesCache[workspacePath]];
                        }
                        Object.entries(zWorkspaceFindPackagesCache[workspacePath]).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            if (names.includes(key)) {
                                result[key] = value;
                            }
                        });
                        if (names.every(function (name) { return result[name]; })) {
                            return [2 /*return*/, result];
                        }
                    }
                    // Exclude names that already found
                    names = names.filter(function (name) { return !result[name]; });
                    rootPkg = new package_1.Package(workspacePath);
                    return [4 /*yield*/, zWorkspaceGetPackages(rootPkg)];
                case 1:
                    packages = _d.sent();
                    names.forEach(function (name) {
                        var currentPackages = zWorkspaceExtractPackages(name, rootPkg, packages);
                        if (!currentPackages) {
                            if (!silent) {
                                throw new Error("Workspace package(s) '".concat(name, "' not found"));
                            }
                            return;
                        }
                        Object.values(currentPackages).forEach(function (pkg) {
                            result[pkg.json.name] = pkg;
                        });
                    });
                    Object.assign((_a = zWorkspaceFindPackagesCache[workspacePath]) !== null && _a !== void 0 ? _a : (zWorkspaceFindPackagesCache[workspacePath] = {}), result);
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.zWorkspaceFindPackages = zWorkspaceFindPackages;
var zWorkspaceGetPackagesCache = {};
function zWorkspaceGetPackages(rootPkg, newPackageOptions, options) {
    if (options === void 0) { options = { useCache: true }; }
    return __awaiter(this, void 0, void 0, function () {
        var packages, workspacePaths;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (rootPkg === "auto") {
                        rootPkg = new package_1.Package(node_path_1.default.dirname((0, workspace_1.zFindRootPackageJsonPath)()));
                    }
                    if (options.useCache && zWorkspaceGetPackagesCache[rootPkg.getPath()]) {
                        return [2 /*return*/, zWorkspaceGetPackagesCache[rootPkg.getPath()]];
                    }
                    packages = {};
                    return [4 /*yield*/, zWorkspaceGetPackagesPaths(rootPkg)];
                case 1:
                    workspacePaths = _a.sent();
                    workspacePaths.forEach(function (workspace) {
                        workspace.packages.forEach(function (packagePath) {
                            var pkg = new package_1.Package(packagePath, newPackageOptions);
                            // Copy values from package.json to package object
                            packages[pkg.json.name] = pkg;
                        });
                    });
                    return [2 /*return*/, packages];
            }
        });
    });
}
exports.zWorkspaceGetPackages = zWorkspaceGetPackages;
var zWorkspaceGetPackagesPathsCache = {};
function zWorkspaceGetPackagesPaths(rootPkg, options) {
    var _a;
    if (options === void 0) { options = { useCache: true }; }
    return __awaiter(this, void 0, void 0, function () {
        var promises, result;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Check if package contains `workspaces` property
                    if (!((_a = rootPkg.json.workspaces) === null || _a === void 0 ? void 0 : _a.length)) {
                        return [2 /*return*/, []];
                    }
                    if (options.useCache && zWorkspaceGetPackagesPathsCache[rootPkg.getPath()]) {
                        return [2 /*return*/, zWorkspaceGetPackagesPathsCache[rootPkg.getPath()]];
                    }
                    promises = (rootPkg.json.workspaces).map(function (workspace) { return __awaiter(_this, void 0, void 0, function () {
                        var workspacesPackageJsons, packages;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, path_1.zGetMatchingPathsRecursive)(rootPkg.getPath(), new RegExp(workspace.replace("*", ".*") + "/package.json"), 3, {
                                        ignoreStartsWith: [".", "#"]
                                    })];
                                case 1:
                                    workspacesPackageJsons = _a.sent();
                                    packages = workspacesPackageJsons.map(function (packageJsonPath) { return node_path_1.default.dirname(packageJsonPath); });
                                    return [2 /*return*/, {
                                            workspace: workspace,
                                            packages: packages,
                                        }];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    result = _b.sent();
                    console_manager_1.ConsoleManager.$.debug(function () { return [
                        "workspace",
                        zWorkspaceGetPackagesPaths.name,
                        "workspaces from package: ".concat(node_util_1.default.inspect(rootPkg.getPath())),
                        node_util_1.default.inspect({
                            workspaces: rootPkg.json.workspaces,
                            paths: Object.values(result.map(function (i) { return i.packages; }).flat()),
                        })
                    ]; });
                    zWorkspaceGetPackagesPathsCache[rootPkg.getPath()] = result;
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.zWorkspaceGetPackagesPaths = zWorkspaceGetPackagesPaths;
/**
 * Get packages dependencies that are part of the workspace
 */
function zWorkspaceGetWorkspaceDependencies(packages) {
    var packagesDependencies = {};
    // Filter dependencies that include "workspace:" prefix
    Object.values(packages).forEach(function (pkg) {
        var workspaceDependencies = {};
        Object.values(pkg.getDependencies()).forEach(function (dependencies) {
            Object.entries(dependencies).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                if (value.startsWith("workspace:")) {
                    workspaceDependencies[key] = value;
                }
            });
        });
        packagesDependencies[pkg.json.name] = { pkg: pkg, dependencies: workspaceDependencies };
    });
    return packagesDependencies;
}
exports.zWorkspaceGetWorkspaceDependencies = zWorkspaceGetWorkspaceDependencies;
function zWorkspaceGetRootPackageName(options) {
    if (options === void 0) { options = { silent: true }; }
    var rootPackageJsonPath = (0, workspace_1.zFindRootPackageJsonPath)(options);
    return new package_1.Package(node_path_1.default.dirname(rootPackageJsonPath)).json.name;
}
exports.zWorkspaceGetRootPackageName = zWorkspaceGetRootPackageName;
