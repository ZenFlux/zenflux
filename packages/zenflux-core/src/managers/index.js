"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Internal = exports.Restful = exports.Controllers = exports.Commands = void 0;
/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
var commands_1 = require("@z-core/managers/commands");
Object.defineProperty(exports, "Commands", { enumerable: true, get: function () { return commands_1.Commands; } });
var controllers_1 = require("@z-core/managers/controllers");
Object.defineProperty(exports, "Controllers", { enumerable: true, get: function () { return controllers_1.Controllers; } });
var restful_1 = require("@z-core/managers/restful");
Object.defineProperty(exports, "Restful", { enumerable: true, get: function () { return restful_1.Restful; } });
var internal_1 = require("@z-core/managers/internal");
Object.defineProperty(exports, "Internal", { enumerable: true, get: function () { return internal_1.Internal; } });
