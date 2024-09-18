"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var util = require("util");
var fs_1 = require("fs");
var path_1 = require("path");
var process_1 = require("process");
var console_1 = require("@zenflux/cli/src/modules/console");
var registry_1 = require("@zenflux/cli/src/core/registry");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var command_base_1 = require("@zenflux/cli/src/base/command-base");
var workspace_1 = require("@zenflux/cli/src/core/workspace");
var package_1 = require("@zenflux/cli/src/modules/npm/package");
var console_menu_checkbox_1 = require("@zenflux/cli/src/modules/console/console-menu-checkbox");
var definitions_1 = require("@zenflux/cli/src/modules/npm/definitions");
var localPublishRequirements = ["publishConfig", "version"];
var Publish = /** @class */ (function (_super) {
    __extends(Publish, _super);
    function Publish() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.newPackageOptions = {
            registryUrl: definitions_1.DEFAULT_NPM_REMOTE_REGISTRY_URL,
            npmRcPath: definitions_1.DEFAULT_NPM_RC_PATH,
        };
        return _this;
    }
    Publish.prototype.runImpl = function () {
        return __awaiter(this, void 0, void 0, function () {
            var workspacePackage, packages, activeRegistries, _a, menu, selected, selectedRegistry, publishAblePackages, updatedPackages, publishPackages;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        workspacePackage = new package_1.Package(this.paths.workspace);
                        return [4 /*yield*/, (0, workspace_1.zWorkspaceGetPackages)(workspacePackage, this.newPackageOptions)];
                    case 1:
                        packages = _b.sent();
                        if (!Object.keys(packages).length) {
                            console_manager_1.ConsoleManager.$.log("No workspaces found");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, registry_1.zRegistryGetAllOnlineNpmRcs)()];
                    case 2:
                        activeRegistries = _b.sent();
                        _a = activeRegistries.length;
                        if (!_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, console_manager_1.ConsoleManager.$.confirm("There are ".concat(util.inspect(activeRegistries.length), " active registries, do you want to use one of them?"))];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        if (!_a) return [3 /*break*/, 6];
                        menu = new console_1.ConsoleMenu(activeRegistries.map(function (r) { return ({
                            title: "id: ".concat(r.id, ", url: ").concat(r.url, ", path: ").concat(r.path),
                        }); }));
                        return [4 /*yield*/, menu.start()];
                    case 5:
                        selected = _b.sent();
                        if (!selected) {
                            return [2 /*return*/, console_manager_1.ConsoleManager.$.log("No registry selected")];
                        }
                        selectedRegistry = activeRegistries[selected.index];
                        this.newPackageOptions.registryUrl = selectedRegistry.url;
                        this.newPackageOptions.npmRcPath = selectedRegistry.path;
                        _b.label = 6;
                    case 6:
                        console_manager_1.ConsoleManager.$.log("Used NPM registry: ".concat(util.inspect(this.newPackageOptions.registryUrl)));
                        return [4 /*yield*/, this.ensurePublishAblePackages(packages)];
                    case 7:
                        publishAblePackages = _b.sent();
                        if (!Object.keys(publishAblePackages).length) {
                            return [2 /*return*/, console_manager_1.ConsoleManager.$.log("No publishable packages found")];
                        }
                        console_manager_1.ConsoleManager.$.log(util.inspect(Object.values(publishAblePackages).map(function (p) { return p.getDisplayName(); })), "\n");
                        console_manager_1.ConsoleManager.$.log("Analyzing workspace dependencies\ny");
                        return [4 /*yield*/, this.ensurePackagesWorkspaceDependencies(publishAblePackages, packages)];
                    case 8:
                        updatedPackages = _b.sent();
                        return [4 /*yield*/, this.preparePublishPackages(updatedPackages)];
                    case 9:
                        publishPackages = _b.sent();
                        if (!publishPackages) {
                            return [2 /*return*/];
                        }
                        // Publish packages
                        return [4 /*yield*/, this.publishPackages(publishPackages)];
                    case 10:
                        // Publish packages
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Publish.prototype.preparePublishPackages = function (packages) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _i, _a, _b, pkg, _c, _d, _e, prepublishPath;
            var _this = this;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        result = {};
                        // Display publish files.
                        console_manager_1.ConsoleManager.$.log("Files that will be published:");
                        _i = 0, _a = Object.entries(packages);
                        _f.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], pkg = _b[1];
                        _d = (_c = console_manager_1.ConsoleManager.$).log;
                        _e = [pkg.getDisplayName() + " =>"];
                        return [4 /*yield*/, pkg.getPublishFiles()];
                    case 2:
                        _d.apply(_c, _e.concat([_f.sent()]));
                        _f.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        prepublishPath = path_1.default.join(this.paths.workspaceEtc, "prepublish");
                        // Make directory for files that about to be published
                        fs_1.default.mkdirSync(prepublishPath, { recursive: true });
                        // Copy files to publish directory
                        Object.values(packages).forEach(function (pkg) {
                            var prepublishAgentpath = path_1.default.join(prepublishPath, pkg.json.name), files = pkg.getPublishFilesCache();
                            files.forEach(function (file) {
                                var targetPath = path_1.default.join(prepublishAgentpath, file);
                                fs_1.default.mkdirSync(path_1.default.dirname(targetPath), { recursive: true });
                                fs_1.default.copyFileSync(path_1.default.join(pkg.getPath(), file), targetPath);
                            });
                            // Save package.json with updated dependencies
                            pkg.saveAs(path_1.default.join(prepublishAgentpath, "package.json"));
                            result[pkg.json.name] = new package_1.Package(prepublishAgentpath, _this.newPackageOptions);
                        });
                        return [4 /*yield*/, console_manager_1.ConsoleManager.$.confirm("Please review the contents of the 'Prepublish' directory, which can be found at ".concat(util.inspect("file://" + prepublishPath), ", are you ready to proceed?"))];
                    case 5:
                        // Display to user the prepublish directory path and ask if he wants to continue
                        if (!(_f.sent())) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Publish.prototype.publishPackages = function (packages) {
        return __awaiter(this, void 0, void 0, function () {
            var promises, _loop_1, _i, _a, pkg;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        promises = [];
                        console_manager_1.ConsoleManager.$.log("Publishing package: ".concat(util.inspect(Object.values(packages).map(function (pkg) { return pkg.getDisplayName(); }))));
                        _loop_1 = function (pkg) {
                            promises.push(pkg.publish()
                                .then(function () { return console_manager_1.ConsoleManager.$.log(util.inspect(pkg.getDisplayName()) + " Package published successfully"); })
                                .catch(function (e) { return console_manager_1.ConsoleManager.$.error("Error while publishing => " + (e.stack)); }));
                        };
                        for (_i = 0, _a = Object.values(packages); _i < _a.length; _i++) {
                            pkg = _a[_i];
                            _loop_1(pkg);
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Publish.prototype.ensurePublishAblePackages = function (packages) {
        return __awaiter(this, void 0, void 0, function () {
            var result, restrictedPackages, resultValues, selectedPackages_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = {}, restrictedPackages = [];
                        return [4 /*yield*/, Promise.all(Object.values(packages).map(function (pkg) { return __awaiter(_this, void 0, void 0, function () {
                                var json, missingRequirements, isVersionExists, registry;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            json = pkg.json, missingRequirements = localPublishRequirements.filter(function (key) { return !json[key]; });
                                            isVersionExists = false;
                                            if (!(missingRequirements.length === 0)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, pkg.loadRegistry()];
                                        case 1:
                                            registry = _a.sent();
                                            isVersionExists = registry.isExists() && registry.isVersionUsed(json.version);
                                            if (!isVersionExists) {
                                                result[pkg.json.name] = pkg;
                                                return [2 /*return*/];
                                            }
                                            _a.label = 2;
                                        case 2:
                                            restrictedPackages.push({
                                                pkg: pkg,
                                                terms: {
                                                    missing: missingRequirements,
                                                    isVersionExists: isVersionExists,
                                                }
                                            });
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        if (restrictedPackages.length) {
                            console_manager_1.ConsoleManager.$.log("Packages that not meet the publish requirements:");
                            restrictedPackages
                                .sort(function (a, b) { return a.pkg.json.name.localeCompare(b.pkg.json.name); })
                                .forEach(function (i) {
                                console_manager_1.ConsoleManager.$.log("  - ".concat(util.inspect(i.pkg.getDisplayName())));
                                var missing = i.terms.missing;
                                if (Object.keys(missing).length) {
                                    console_manager_1.ConsoleManager.$.log("    - Package missing:", util.inspect(missing, { breakLength: Infinity }));
                                }
                                else if (i.terms.isVersionExists) {
                                    console_manager_1.ConsoleManager.$.log("    - Package version: ".concat(util.inspect(i.pkg.json.version), " already exists"));
                                }
                            });
                            process_1.default.stdout.write("\n");
                        }
                        resultValues = Object.values(result);
                        if (!Object.keys(resultValues).length) return [3 /*break*/, 3];
                        console_manager_1.ConsoleManager.$.log("Packages that meet the publish requirements:");
                        return [4 /*yield*/, (new console_menu_checkbox_1.ConsoleMenuCheckbox(Object.values(resultValues).map(function (pkg) {
                                return {
                                    title: pkg.json.name,
                                    checked: true,
                                };
                            }))).start()];
                    case 2:
                        selectedPackages_1 = _a.sent();
                        if (selectedPackages_1) {
                            Object.keys(result).forEach(function (key) {
                                // Remove not selected packages
                                if (!selectedPackages_1.find(function (i) { return i.title === key; })) {
                                    delete result[key];
                                }
                            });
                            return [2 /*return*/, result];
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/, {}];
                }
            });
        });
    };
    Publish.prototype.ensurePackagesWorkspaceDependencies = function (packages, allPackages) {
        return __awaiter(this, void 0, void 0, function () {
            function updateDependency(pkg, dependencyName, dependencyValue) {
                return __awaiter(this, void 0, void 0, function () {
                    var updatedPackagesAndTheirDependencies, dependencyPackage, npmRegistry, isRegistryExists, latestVersion, localVersion, selectedVersion, _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                updatedPackagesAndTheirDependencies = {}, dependencyPackage = allPackages[dependencyName];
                                return [4 /*yield*/, dependencyPackage.loadRegistry()];
                            case 1:
                                npmRegistry = _b.sent(), isRegistryExists = npmRegistry.isExists(), latestVersion = isRegistryExists ? npmRegistry.getLastVersion() : null, localVersion = dependencyPackage === null || dependencyPackage === void 0 ? void 0 : dependencyPackage.json.version;
                                console_manager_1.ConsoleManager.$.log("  - ".concat(dependencyName, "@").concat(dependencyValue));
                                // Print details about the dependency
                                console_manager_1.ConsoleManager.$.log("    - Package in registry (npm): ".concat(isRegistryExists ? "exists" : "not exists"));
                                console_manager_1.ConsoleManager.$.log("    - Latest version (npm): ".concat(latestVersion !== null && latestVersion !== void 0 ? latestVersion : "not exists"));
                                console_manager_1.ConsoleManager.$.log("    - Local version: ".concat(localVersion !== null && localVersion !== void 0 ? localVersion : "not exists"));
                                selectedVersion = null;
                                _a = localVersion;
                                if (!_a) return [3 /*break*/, 3];
                                return [4 /*yield*/, console_manager_1.ConsoleManager.$.confirm("    - > Do you want to use local version: '".concat(localVersion, "' for ").concat(util.inspect(dependencyName), " ?"))];
                            case 2:
                                _a = (_b.sent());
                                _b.label = 3;
                            case 3:
                                // If only local version exists, ask if it should be used as the version for the package.
                                if (_a) {
                                    selectedVersion = localVersion;
                                }
                                if (!(null === selectedVersion)) return [3 /*break*/, 5];
                                return [4 /*yield*/, console_manager_1.ConsoleManager.$.prompt("    - > Please type the version you want use for ".concat(util.inspect(dependencyName)))];
                            case 4:
                                selectedVersion = _b.sent();
                                if (!selectedVersion.length) {
                                    throw new Error("Invalid version: ".concat(util.inspect(selectedVersion)));
                                }
                                _b.label = 5;
                            case 5:
                                // Update dependency version for current package.
                                Object.values(pkg.getDependencies()).forEach(function (value) {
                                    if (value[dependencyName]) {
                                        if (!updatedPackagesAndTheirDependencies[pkg.json.name]) {
                                            updatedPackagesAndTheirDependencies[pkg.json.name] = {};
                                        }
                                        updatedPackagesAndTheirDependencies[pkg.json.name][dependencyName] = {
                                            oldVersion: value[dependencyName],
                                            newVersion: selectedVersion,
                                        };
                                        value[dependencyName] = selectedVersion;
                                    }
                                });
                                return [2 /*return*/, updatedPackagesAndTheirDependencies];
                        }
                    });
                });
            }
            var result, 
            // Get packages dependencies that are part of the workspace
            packagesDependencies, updatedPackagesAndTheirDependencies, _i, _a, _b, _c, pkg, dependencies, dependenciesEntries, _d, dependenciesEntries_1, _e, dependencyName, dependencyValue, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        result = __assign({}, packages), packagesDependencies = (0, workspace_1.zWorkspaceGetWorkspaceDependencies)(packages), updatedPackagesAndTheirDependencies = {};
                        _i = 0, _a = Object.entries(packagesDependencies);
                        _j.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], _c = _b[1], pkg = _c.pkg, dependencies = _c.dependencies;
                        console_manager_1.ConsoleManager.$.log(util.inspect(pkg.getDisplayName()));
                        dependenciesEntries = Object.entries(dependencies || {});
                        if (!dependenciesEntries.length) {
                            console_manager_1.ConsoleManager.$.log("  - No workspace dependencies");
                            process_1.default.stdout.write("\n");
                            return [3 /*break*/, 5];
                        }
                        _d = 0, dependenciesEntries_1 = dependenciesEntries;
                        _j.label = 2;
                    case 2:
                        if (!(_d < dependenciesEntries_1.length)) return [3 /*break*/, 5];
                        _e = dependenciesEntries_1[_d], dependencyName = _e[0], dependencyValue = _e[1];
                        _g = (_f = Object).assign;
                        _h = [updatedPackagesAndTheirDependencies];
                        return [4 /*yield*/, updateDependency(pkg, dependencyName, dependencyValue)];
                    case 3:
                        _g.apply(_f, _h.concat([_j.sent()]));
                        _j.label = 4;
                    case 4:
                        _d++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        // Print updated packages and their dependencies
                        console_manager_1.ConsoleManager.$.log("Updated packages and their workspace dependencies:");
                        Object.entries(updatedPackagesAndTheirDependencies).forEach(function (_a) {
                            var packageName = _a[0], dependencies = _a[1];
                            console_manager_1.ConsoleManager.$.log(util.inspect(packageName));
                            Object.entries(dependencies).forEach(function (_a) {
                                var dependencyName = _a[0], dependencyValue = _a[1];
                                console_manager_1.ConsoleManager.$.log("  -  '".concat(dependencyName, "@").concat(dependencyValue.oldVersion, "' => '").concat(dependencyName, "@").concat(dependencyValue.newVersion, "'"));
                            });
                        });
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return Publish;
}(command_base_1.CommandBase));
exports.default = Publish;
