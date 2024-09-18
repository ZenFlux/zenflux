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
exports.Http = void 0;
/**
 * The `Http` class provides a simple wrapper for the Fetch API.
 *
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
var interfaces_1 = require("@z-core/interfaces");
var object_base_1 = require("@z-core/bases/object-base");
// noinspection ExceptionCaughtLocallyJS
var Http = /** @class */ (function (_super) {
    __extends(Http, _super);
    /**
     * Initializes the base class and sets up configuration parameters.
     */
    function Http(apiBaseUrl, requestInit) {
        if (apiBaseUrl === void 0) { apiBaseUrl = "http://localhost"; }
        if (requestInit === void 0) { requestInit = { "credentials": "include" }; }
        var _this = _super.call(this) || this;
        _this.errorHandler = undefined;
        _this.responseFilter = undefined;
        _this.responseHandler = undefined;
        _this.logger = new zCore.classes.Logger(Http);
        _this.logger.startsWith(_this.constructor, { apiBaseUrl: apiBaseUrl });
        _this.apiBaseUrl = apiBaseUrl + "/";
        _this.requestInit = requestInit;
        return _this;
    }
    Http.getName = function () {
        return "ZenFlux/Core/Clients/Http";
    };
    /**
     * Fetches data from the specified path using the given HTTP method and optional request body.
     */
    Http.prototype.fetch = function (path, method, body) {
        var _a, _b;
        if (body === void 0) { body = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var params, headers, fetchPromise, response, data, responseText, e_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.logger.startsWith(this.constructor, { path: path, method: method, body: body });
                        params = Object.assign({}, this.requestInit);
                        headers = {};
                        if (method === interfaces_1.E_HTTP_METHOD_TYPE.GET) {
                            Object.assign(params, { headers: headers });
                        }
                        else {
                            Object.assign(headers, { "Content-Type": "application/json" });
                            Object.assign(params, {
                                method: method,
                                headers: headers,
                                body: JSON.stringify(body),
                            });
                        }
                        fetchPromise = globalThis.fetch(this.apiBaseUrl + path, params);
                        return [4 /*yield*/, fetchPromise];
                    case 1:
                        response = _c.sent();
                        if (!response) {
                            return [2 /*return*/, false];
                        }
                        data = undefined;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 6]);
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        return [4 /*yield*/, response.text()];
                    case 3:
                        responseText = _c.sent();
                        responseText = this.applyResponseFilter(responseText);
                        // TODO: Currently support JSON and plain text.
                        if ((_b = (_a = response.headers) === null || _a === void 0 ? void 0 : _a.get("Content-Type")) === null || _b === void 0 ? void 0 : _b.includes("application/json")) {
                            data = JSON.parse(responseText);
                        }
                        else {
                            data = responseText;
                        }
                        if (this.applyResponseHandler(data)) {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        e_1 = _c.sent();
                        if (this.applyErrorHandler(e_1)) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, Promise.reject(e_1)];
                    case 5:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        this.logger.drop(this.fetch, { path: path }, data);
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Sets the error handler callback for handling errors during fetch requests.
     */
    Http.prototype.setErrorHandler = function (callback) {
        if (this.errorHandler) {
            throw new Error("Error handler already set.");
        }
        this.errorHandler = callback;
    };
    /**
     * Sets the response filter callback for filtering the response text.
     */
    Http.prototype.setResponseFilter = function (callback) {
        if (this.responseFilter) {
            throw new Error("Response filter already set.");
        }
        this.responseFilter = callback;
    };
    /**
     * Sets the response handler callback for handling the response data.
     */
    Http.prototype.setResponseHandler = function (callback) {
        if (this.responseHandler) {
            throw new Error("Response handler already set.");
        }
        this.responseHandler = callback;
    };
    Http.prototype.applyErrorHandler = function (error) {
        return !!this.errorHandler && this.errorHandler(error);
    };
    Http.prototype.applyResponseFilter = function (text) {
        return (this.responseFilter && this.responseFilter(text)) || text;
    };
    Http.prototype.applyResponseHandler = function (text) {
        return !!this.responseHandler && this.responseHandler(text);
    };
    return Http;
}(object_base_1.ObjectBase));
exports.Http = Http;
