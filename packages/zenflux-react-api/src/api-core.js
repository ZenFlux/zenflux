"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APICore = void 0;
var api_component_1 = require("@zenflux/react-api/src/api-component");
var APICore = /** @class */ (function () {
    function APICore(baseURL) {
        this.baseURL = baseURL;
        this.modules = {};
        api_component_1.APIComponent.setAPI(this);
    }
    APICore.prototype.getModule = function (module) {
        var moduleName = module.getName();
        if (!this.modules[moduleName]) {
            throw new Error("API module ".concat(moduleName, " not registered"));
        }
        return this.modules[moduleName];
    };
    APICore.prototype.fetch = function (method, route, args, handler) {
        var url = new URL("".concat(this.baseURL, "/").concat(route));
        for (var key in args) {
            url.pathname = url.pathname.replace(":".concat(key), args[key]);
        }
        var promise = globalThis.fetch(url.toString(), {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
            body: method === "GET" ? undefined : JSON.stringify(args),
        });
        return promise.then(handler);
    };
    APICore.prototype.register = function (module) {
        var moduleName = module.getName();
        if (this.modules[moduleName]) {
            // TODO: Enable when hot reloading is implemented
            // throw new Error(`API module ${moduleName} already registered`);
        }
        this.modules[moduleName] = new module(this);
    };
    Object.defineProperty(APICore.prototype, "Component", {
        get: function () {
            return api_component_1.APIComponent;
        },
        enumerable: false,
        configurable: true
    });
    return APICore;
}());
exports.APICore = APICore;
