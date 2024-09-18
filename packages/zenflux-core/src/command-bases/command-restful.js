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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRestful = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Each rest command should represent a final REST endpoint.
 */
var command_base_1 = require("@z-core/command-bases/command-base");
var errors_1 = require("@z-core/errors");
var managers = require("@z-core/managers/export");
var CommandRestful = /** @class */ (function (_super) {
    __extends(CommandRestful, _super);
    function CommandRestful() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CommandRestful.getName = function () {
        return "ZenFlux/Core/CommandBases/CommandRestful";
    };
    /**
     * Override this method is required to determine endpoint and magic query params.
     *
     * @example
     * ```
     * args = { query: { id: 1 }  };
     * getEndpoint() = '/api/v1/users/{id}';
     * result = '/api/v1/users/1';
     * ```
     */
    CommandRestful.prototype.getEndpoint = function () {
        throw new errors_1.ForceMethodImplementation(this, "getEndpoint");
    };
    CommandRestful.prototype.apply = function (args, options) {
        if (args === void 0) { args = this.args; }
        if (options === void 0) { options = this.options; }
        var endpoint = this.applyEndpointFormat(this.getEndpoint(), args);
        return managers.restful.getClient().fetch(endpoint, managers.restful.currentHttpMethod, args || null);
    };
    CommandRestful.prototype.applyEndpointFormat = function (endpoint, data) {
        if (data === void 0) { data = {}; }
        // Replace query with `magic` placeholders.
        if (endpoint.includes("{")) {
            endpoint = endpoint.split("/").map(function (endpointPart) {
                var match = endpointPart.match("\\{(.*?)\\}");
                if ((match === null || match === void 0 ? void 0 : match.length) && "undefined" !== typeof data[match[1]]) {
                    return data[match[1]];
                }
                return endpointPart;
            }).join("/");
        }
        return endpoint;
    };
    return CommandRestful;
}(command_base_1.CommandBase));
exports.CommandRestful = CommandRestful;
