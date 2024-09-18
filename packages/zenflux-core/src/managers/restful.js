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
exports.Restful = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Responsible for manging restful commands which are wrappers for HTTP requests.
 */
var commands_1 = require("@z-core/managers/commands");
var http_1 = require("@z-core/clients/http");
var interfaces_1 = require("@z-core/interfaces");
var Restful = /** @class */ (function (_super) {
    __extends(Restful, _super);
    function Restful(Config) {
        var _this = _super.call(this) || this;
        Restful.client = new http_1.Http(Config.baseURL, Config.requestInit);
        return _this;
    }
    Restful.getName = function () {
        return "ZenFlux/Core/Managers/Restful";
    };
    Restful.prototype.getClient = function () {
        return Restful.client;
    };
    Restful.prototype.get = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        this.currentHttpMethod = interfaces_1.E_HTTP_METHOD_TYPE.GET;
        return _super.prototype.run.call(this, command, args, options);
    };
    Restful.prototype.update = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        this.currentHttpMethod = interfaces_1.E_HTTP_METHOD_TYPE.PATCH;
        return _super.prototype.run.call(this, command, args, options);
    };
    Restful.prototype.delete = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        this.currentHttpMethod = interfaces_1.E_HTTP_METHOD_TYPE.DELETE;
        return _super.prototype.run.call(this, command, args, options);
    };
    Restful.prototype.create = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        this.currentHttpMethod = interfaces_1.E_HTTP_METHOD_TYPE.POST;
        return _super.prototype.run.call(this, command, args, options);
    };
    Restful.prototype.runInstance = function (command, args, options) {
        if (args === void 0) { args = {}; }
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var newArgs, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.currentHttpMethod) {
                            throw new Error("Cannot run directly use one of the http methods: \"get\", \"update\", \"delete, \"create");
                        }
                        newArgs = {
                            type: this.currentHttpMethod,
                            args: {
                                query: {},
                                data: {},
                            },
                        };
                        if (interfaces_1.E_HTTP_METHOD_TYPE.GET === this.currentHttpMethod) {
                            newArgs.args.query = args;
                        }
                        else {
                            newArgs.args.data = args;
                        }
                        _a = args;
                        return [4 /*yield*/, _super.prototype.runInstance.call(this, command, newArgs, options)];
                    case 1:
                        _a.result = _b.sent();
                        // Clear method type.
                        this.currentHttpMethod = interfaces_1.E_HTTP_METHOD_TYPE.__EMPTY__;
                        return [2 /*return*/, args.result];
                }
            });
        });
    };
    /**
     * Handlers on return true will swallow the request.
     */
    Restful.prototype.setHandler = function (type, callback) {
        switch (type) {
            case interfaces_1.E_RESPONSE_HANDLER_TYPE.ERROR_HANDLER:
                Restful.client.setErrorHandler(callback);
                break;
            case interfaces_1.E_RESPONSE_HANDLER_TYPE.RESPONSE_FILTER:
                Restful.client.setResponseFilter(callback);
                break;
            case interfaces_1.E_RESPONSE_HANDLER_TYPE.RESPONSE_HANDLER:
                Restful.client.setResponseHandler(callback);
                break;
            default:
                throw new Error("Unknown handler type: '".concat(type, "'"));
        }
    };
    return Restful;
}(commands_1.Commands));
exports.Restful = Restful;
