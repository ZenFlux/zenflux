"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.zGlobalGetConfigPath = exports.zGlobalPathsGet = exports.zGlobalInitPaths = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_path_1 = require("node:path");
var node_os_1 = require("node:os");
var definitions_1 = require("@zenflux/cli/src/modules/npm/definitions");
var zenflux_1 = require("@zenflux/cli/src/definitions/zenflux");
var shared = {
    paths: {
        // Depends on the cli self
        cli: ((_b = (_a = global.__ZENFLUX_CLI__) === null || _a === void 0 ? void 0 : _a.paths) === null || _b === void 0 ? void 0 : _b.cli) || "",
        workspace: "",
        projects: [],
        etc: "",
        workspaceEtc: "",
        verdaccio: "",
        verdaccioConfig: "",
        verdaccioStorage: "",
        verdaccioHtpasswd: "",
        npmRc: "",
    }
};
function zGlobalInitPaths(args) {
    var etcPath = node_path_1.default.resolve(node_os_1.default.homedir(), zenflux_1.DEFAULT_Z_ETC_FOLDER), workspaceEtcPath = node_path_1.default.resolve(etcPath, args.workspaceName), verdaccioPath = node_path_1.default.resolve(workspaceEtcPath, zenflux_1.DEFAULT_Z_VERDACCIO_FOLDER);
    if (!args.projectsPaths) {
        args.projectsPaths = [args.cwd];
    }
    global.__ZENFLUX_CLI__.paths = Object.freeze({
        // Chain path to the cli
        cli: global.__ZENFLUX_CLI__.paths.cli,
        workspace: args.workspacePath || "",
        projects: args.projectsPaths,
        etc: etcPath,
        workspaceEtc: workspaceEtcPath,
        verdaccio: verdaccioPath,
        verdaccioConfig: node_path_1.default.resolve(verdaccioPath, zenflux_1.DEFAULT_Z_VERDACCIO_CONFIG_FILE),
        verdaccioStorage: node_path_1.default.resolve(verdaccioPath, zenflux_1.DEFAULT_Z_VERDACCIO_STORAGE_FOLDER),
        verdaccioHtpasswd: node_path_1.default.resolve(verdaccioPath, zenflux_1.DEFAULT_Z_VERDACCIO_HTPASSWD_FILE),
        npmRc: node_path_1.default.resolve(workspaceEtcPath, definitions_1.DEFAULT_NPM_RC_FILE),
    });
    return global.__ZENFLUX_CLI__.paths;
}
exports.zGlobalInitPaths = zGlobalInitPaths;
function zGlobalPathsGet() {
    return global.__ZENFLUX_CLI__.paths;
}
exports.zGlobalPathsGet = zGlobalPathsGet;
function zGlobalGetConfigPath(project, configFileName) {
    if (configFileName === void 0) { configFileName = zenflux_1.DEFAULT_Z_CONFIG_FILE; }
    // Find the project path
    var projectPath = zGlobalPathsGet().projects.find(function (projectPath) { return projectPath === project; });
    if (!projectPath) {
        throw new Error("Project '".concat(project, "' not found"));
    }
    return node_path_1.default.resolve(projectPath, configFileName);
}
exports.zGlobalGetConfigPath = zGlobalGetConfigPath;
// Since commands are loaded dynamically, it should use the same node context
global.__ZENFLUX_CLI__ = Object.assign({}, 
// Can be injected from the outside
global.__ZENFLUX_CLI__, shared);
