"use strict";
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
var affiliate_program_png_1 = require("@zenflux/app-budget-allocation/assets/affiliate-program.png");
var test_png_1 = require("@zenflux/app-budget-allocation/assets/test.png");
var storage = window.localStorage;
function initializeStorage() {
    storage.clear();
    if (storage.getItem("__DEFAULT_STORAGE__") === null) {
        storage.setItem("__DEFAULT_STORAGE__", "true");
        storage.setItem("/v1/channels/free-reviews", JSON.stringify({
            key: "free-reviews",
            meta: {
                id: "free-reviews",
                name: "Free Reviews",
                icon: test_png_1.default,
                createdAt: 0,
            },
            allocation: "equal",
            baseline: "0",
            frequency: "annually",
            breaks: [],
        }));
        storage.setItem("/v1/channels/paid-reviews", JSON.stringify({
            key: "paid-reviews",
            meta: {
                id: "paid-reviews",
                name: "Paid Reviews",
                icon: affiliate_program_png_1.default,
                createdAt: 1,
            },
            allocation: "equal",
            baseline: "0",
            frequency: "annually",
            breaks: [],
        }));
    }
}
initializeStorage();
function isObject(item) {
    return (item && typeof item === "object" && !Array.isArray(item));
}
function deepMerge(target, source) {
    var output = __assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(function (key) {
            if (isObject(source[key]) && key in target) {
                output[key] = deepMerge(target[key], source[key]);
            }
            else {
                output[key] = source[key];
            }
        });
    }
    return output;
}
globalThis.fetch = function (input, init) {
    var url = typeof input === "string" ? new URL(input) : input instanceof URL ? input : new URL(input.url);
    var path = url.pathname;
    var method = (init === null || init === void 0 ? void 0 : init.method) || "GET";
    console.log("API: ".concat(method, " ").concat(path));
    var baseInit = {};
    var act = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, items_1, key, sortedItems_1, data, currentData, newData;
        return __generator(this, function (_a) {
            if (method === "GET") {
                data = storage.getItem(path);
                if (!data) {
                    items_1 = {};
                    for (key in storage) {
                        if (key.startsWith(path)) {
                            items_1[key] = JSON.parse(storage.getItem(key) || "{}");
                        }
                    }
                    sortedItems_1 = {};
                    // Sort by meta.createdAt
                    Object.keys(items_1).sort(function (a, b) {
                        var aCreatedAt = items_1[a].meta.createdAt;
                        var bCreatedAt = items_1[b].meta.createdAt;
                        return aCreatedAt - bCreatedAt;
                    }).forEach(function (key) {
                        sortedItems_1[key] = items_1[key];
                    });
                    return [2 /*return*/, Promise.resolve(new Response(JSON.stringify(Object.values(sortedItems_1)), baseInit))];
                }
                return [2 /*return*/, Promise.resolve(new Response(data || "{}", baseInit))];
            }
            else if (method === "POST" || method === "PUT") {
                data = (init === null || init === void 0 ? void 0 : init.body) || "";
                currentData = storage.getItem(path) || "{}";
                if (typeof data !== "string") {
                    return [2 /*return*/, Promise.reject(new Error("Data at ".concat(path, " is not a string")))];
                }
                newData = JSON.stringify(deepMerge(JSON.parse(currentData), JSON.parse(data)));
                storage.setItem(path, newData);
                return [2 /*return*/, Promise.resolve(new Response(data, baseInit))];
            }
            else if (method === "DELETE") {
                storage.removeItem(path);
                return [2 /*return*/, Promise.resolve(new Response("{\"ok\": true}", baseInit))];
            }
            else {
                return [2 /*return*/, Promise.reject(new Error("Method ".concat(method, " not implemented")))];
            }
            return [2 /*return*/];
        });
    }); };
    return act();
};
