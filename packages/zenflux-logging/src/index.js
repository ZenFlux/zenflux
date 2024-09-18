"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@zenflux/core");
var logger_1 = require("@z-logging/modules/logger");
// Attach logger module to the core
core_1.default.classes.Logger = logger_1.Logger;
