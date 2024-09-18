"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passiveBrowserEventsSupported = void 0;
var execution_environment_1 = require("@zenflux/react-shared/src/execution-environment");
exports.passiveBrowserEventsSupported = false;
// Check if browser support events with passive listeners
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
if (execution_environment_1.canUseDOM) {
    try {
        var options = {};
        Object.defineProperty(options, "passive", {
            get: function () {
                exports.passiveBrowserEventsSupported = true;
            }
        });
        // @ts-ignore
        window.addEventListener("test", options, options);
        // @ts-ignore
        window.removeEventListener("test", options, options);
    }
    catch (e) {
        exports.passiveBrowserEventsSupported = false;
    }
}
