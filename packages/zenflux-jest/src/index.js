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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_inspector_1 = require("node:inspector");
var node_path_1 = require("node:path");
var node_process_1 = require("node:process");
var node_url_1 = require("node:url");
var jest_config_1 = require("jest-config");
var workspace_1 = require("@zenflux/utils/src/workspace");
var package_1 = require("@zenflux/cli/src/modules/npm/package");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var workspace_2 = require("@zenflux/cli/src/core/workspace");
var core_1 = require("@jest/core");
var __dirname = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
var rootPkg = new package_1.Package(node_path_1.default.dirname((0, workspace_1.zFindRootPackageJsonPath)()));
var filterProjects = [];
if (node_process_1.default.argv.includes("--help") || node_process_1.default.argv.includes("-h")) {
    console_manager_1.ConsoleManager.$.log("Use jest --help");
    node_process_1.default.exit(0);
}
if (node_process_1.default.argv.includes("--selectedProjects")) {
    var selectedProjectsKey = node_process_1.default.argv.indexOf("--selectedProjects");
    var selectedProjects = node_process_1.default.argv[selectedProjectsKey + 1];
    if (!selectedProjects) {
        console_manager_1.ConsoleManager.$.log("Use @z-jest --selectedProjects <project1, project2>");
        node_process_1.default.exit(1);
    }
    // Remove both key and value
    node_process_1.default.argv.splice(selectedProjectsKey, 2);
    selectedProjects.split(",").forEach(function (p) { return filterProjects.push(p.trim()); });
}
if (node_process_1.default.argv.includes("--runTestsByPath")) {
    var runTestsByPathKey = node_process_1.default.argv.indexOf("--runTestsByPath");
    var runTestsByPath_1 = node_process_1.default.argv[runTestsByPathKey + 1];
    if (!runTestsByPath_1) {
        console_manager_1.ConsoleManager.$.log("Use @z-jest --runTestsByPath <path>");
        node_process_1.default.exit(1);
    }
    var packages = (0, workspace_2.zWorkspaceGetPackages)(rootPkg);
    var matched = Object.values(packages).find(function (pkg) {
        return runTestsByPath_1.includes(pkg.getPath());
    });
    if (matched) {
        filterProjects.push(matched.json.name);
    }
}
function getProjectsConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var packages;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, workspace_2.zWorkspaceGetPackages)(rootPkg)];
                case 1:
                    packages = _a.sent();
                    return [4 /*yield*/, Promise.all(Object.values(packages)
                            .filter(function (pkg) {
                            if (filterProjects.length > 0) {
                                var match = filterProjects.find(function (p) {
                                    var regex = new RegExp(p);
                                    return regex.test(pkg.json.name);
                                });
                                if (!match) {
                                    return false;
                                }
                            }
                            return node_fs_1.default.existsSync(pkg.getPath() + "/jest.config.ts");
                        })
                            .map(function (pkg) { return __awaiter(_this, void 0, void 0, function () {
                            var configPath;
                            return __generator(this, function (_a) {
                                configPath = pkg.getPath() + "/jest.config.ts";
                                return [2 /*return*/, Promise.resolve("".concat(configPath)).then(function (s) { return require(s); }).then(function (p) {
                                        return {
                                            pkg: pkg,
                                            config: p.default,
                                            configPath: configPath,
                                        };
                                    })];
                            });
                        }); }))];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
// Initial config
var rootConfig = {
    testRegex: "(/test/.*\\.test\\.(js|cjs))$",
    verbose: true,
    // Detect debug mode...
    cache: !node_inspector_1.default.url(),
    testTimeout: node_inspector_1.default.url() ? 30000 : 5000,
    rootDir: rootPkg.getPath(),
};
var initialArgv = {
    $0: node_process_1.default.argv[1],
    _: [],
};
var nonValueArgs = [
    "--runTestsByPath"
];
var skipFlag = false;
for (var _i = 0, _b = node_process_1.default.argv.slice(2); _i < _b.length; _i++) {
    var arg = _b[_i];
    if (skipFlag || nonValueArgs.includes(arg)) {
        skipFlag = false;
        continue;
    }
    var nextArg = node_process_1.default.argv.indexOf(arg) + 1;
    // Transform `process.argv` to `jestConfig` format generically like yargs
    if (arg.startsWith("--")) {
        // If next arg is not a flag and it's a value
        if (node_process_1.default.argv[nextArg] && !node_process_1.default.argv[nextArg].startsWith("-")) {
            initialArgv[arg.slice(2)] = node_process_1.default.argv[nextArg];
            // Skip next arg
            skipFlag = true;
            continue;
        }
        var _c = arg.slice(2).split("="), key = _c[0], value = _c[1];
        initialArgv[key] = value || true;
    }
    else if (arg.startsWith("-")) {
        var _d = arg.slice(1).split("="), key = _d[0], value = _d[1];
        initialArgv[key] = value;
    }
    else {
        initialArgv._.push(arg);
    }
}
var originalWarn = console_manager_1.ConsoleManager.$.warn;
var didCatch = false;
var projects = await Promise.all(await getProjectsConfig());
// Pre validate
var normalizers = projects.map(function (project, index) { return __awaiter(void 0, void 0, void 0, function () {
    var configPath, promise;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                configPath = project.configPath;
                project.config.rootDir = project.pkg.getPath();
                // Since jest does not give simple flexibility without adding custom code,
                console_manager_1.ConsoleManager.$.warn = function () {
                    var _a;
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    args.push("\n" + "cause: file://" + configPath + "\n");
                    (_a = console_manager_1.ConsoleManager.$).error.apply(_a, args);
                };
                promise = (0, jest_config_1.normalize)(rootConfig, initialArgv, configPath, // Jest not favoring this path
                index);
                promise.catch(function (error) {
                    didCatch = true;
                    console_manager_1.ConsoleManager.$.error(error.message, "\n" +
                        "cause: file://" + configPath + "\n");
                });
                return [4 /*yield*/, promise.then(function (normalized) {
                        project.normalized = normalized.options;
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
await Promise.all(normalizers).catch(function () {
    didCatch = true;
});
console_manager_1.ConsoleManager.$.warn = originalWarn;
var jestProjects = projects.map((function (p) {
    if (!p.config.setupFiles) {
        p.config.setupFiles = [];
    }
    // Insert local setup files before the project setup files
    p.config.setupFiles.unshift(node_path_1.default.join(__dirname, "setup.js"));
    if (!p.config.displayName) {
        p.config.displayName = p.pkg.getDisplayName();
    }
    if (!p.config.testRegex && p.normalized.testRegex) {
        p.config.testRegex = p.normalized.testRegex;
    }
    return p.config;
}));
// Hacking jest behavior, since they don't provide "real" flexibility and programmatic usage, but only `runCLI`
if (jestProjects.length === 1) {
    jestProjects.length = 2;
}
if ("string" === typeof initialArgv.reporters) {
    initialArgv.reporters = [initialArgv.reporters];
}
// This will allow to run test by exact name in case gate pragma is not specified, see `setup-react-test-gates`
if (((_a = initialArgv.testNamePattern) === null || _a === void 0 ? void 0 : _a.length) && !initialArgv.testNamePattern.includes("[")) {
    var patternStart = initialArgv.testNamePattern.split(" ", 1)[0];
    initialArgv.testNamePattern = patternStart + "( \\[.*\\])?" +
        initialArgv.testNamePattern.substring(patternStart.length);
}
if (!didCatch) {
    /**
     * initialArgv overrides jestProjects
     */
    await (0, core_1.runCLI)(initialArgv, jestProjects);
}
