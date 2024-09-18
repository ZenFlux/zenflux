"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internal = exports.restful = exports.controllers = exports.commands = exports.destroy = exports.initialize = exports.afterInitializeCallbacks = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
var commands_1 = require("@z-core/managers/commands");
var controllers_1 = require("@z-core/managers/controllers");
var restful_1 = require("@z-core/managers/restful");
var internal_1 = require("@z-core/managers/internal");
exports.afterInitializeCallbacks = [];
function initialize(config) {
    exports.commands = new commands_1.Commands();
    exports.controllers = new controllers_1.Controllers();
    exports.restful = new restful_1.Restful(config);
    exports.internal = new internal_1.Internal();
}
exports.initialize = initialize;
function destroy() {
    exports.commands = {};
    exports.controllers = {};
    exports.restful = {};
    exports.internal = {};
}
exports.destroy = destroy;
exports.commands = {};
exports.controllers = {};
exports.restful = {};
exports.internal = {};
