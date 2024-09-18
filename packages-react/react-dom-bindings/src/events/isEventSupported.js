"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var execution_environment_1 = require("@zenflux/react-shared/src/execution-environment");
/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix) {
    if (!execution_environment_1.canUseDOM) {
        return false;
    }
    var eventName = "on" + eventNameSuffix;
    var isSupported = (eventName in document);
    if (!isSupported) {
        var element = document.createElement("div");
        element.setAttribute(eventName, "return;");
        isSupported = typeof element[eventName] === "function";
    }
    return isSupported;
}
exports.default = isEventSupported;
