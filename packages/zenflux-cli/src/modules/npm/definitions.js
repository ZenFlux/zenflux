"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NPM_RC_PATH = exports.DEFAULT_NPM_REMOTE_REGISTRY_URL = exports.DEFAULT_NPM_RC_FILE = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var os_1 = require("os");
var path_1 = require("path");
exports.DEFAULT_NPM_RC_FILE = ".npmrc";
exports.DEFAULT_NPM_REMOTE_REGISTRY_URL = "https://registry.npmjs.org/";
exports.DEFAULT_NPM_RC_PATH = path_1.default.join(os_1.default.homedir(), exports.DEFAULT_NPM_RC_FILE);
