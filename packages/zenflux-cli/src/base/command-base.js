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
exports.CommandBase = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_process_1 = require("node:process");
var node_path_1 = require("node:path");
var node_util_1 = require("node:util");
var workspace_1 = require("@zenflux/utils/src/workspace");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var global_1 = require("@zenflux/cli/src/core/global");
var workspace_2 = require("@zenflux/cli/src/core/workspace");
var CommandBase = /** @class */ (function () {
    function CommandBase(args, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var _a, _b, _c;
        this.args = args;
        this.options = options;
        this.initPathsArgs = {
            cwd: node_process_1.default.cwd(),
            workspaceName: (0, workspace_2.zWorkspaceGetRootPackageName)({ silent: true }),
            workspacePath: node_path_1.default.dirname((0, workspace_1.zFindRootPackageJsonPath)({ silent: true })),
        };
        options.name = (_a = options.name) !== null && _a !== void 0 ? _a : this.constructor.name;
        if (args.includes("--help")) {
            this.showHelp(options.name);
            return;
        }
        this.initializePromise = (_c = (_b = this.initialize) === null || _b === void 0 ? void 0 : _b.call(this)) !== null && _c !== void 0 ? _c : Promise.resolve();
        this.initializePromise.then(function () {
            // Allow to override paths in the child class.
            _this.paths = (0, global_1.zGlobalInitPaths)(_this.initPathsArgs);
        });
    }
    CommandBase.prototype.showHelp = function (name, optionsText) {
        if (name === void 0) { name = this.options.name; }
        if (optionsText === void 0) { optionsText = "options"; }
        console_manager_1.ConsoleManager.$.log("Usage: ".concat(node_util_1.default.inspect(name), " ").concat(optionsText, ":"));
    };
    ;
    CommandBase.prototype.run = function (shouldRunImpl) {
        if (shouldRunImpl === void 0) { shouldRunImpl = true; }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.args.includes("--help")) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.initializePromise];
                    case 1:
                        _b.sent();
                        _a = shouldRunImpl;
                        if (!_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.runImpl()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        _a;
                        return [2 /*return*/, true];
                }
            });
        });
    };
    return CommandBase;
}());
exports.CommandBase = CommandBase;
