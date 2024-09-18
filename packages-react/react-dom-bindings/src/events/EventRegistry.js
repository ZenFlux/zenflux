"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDirectEvent = exports.registerTwoPhaseEvent = exports.possibleRegistrationNames = exports.registrationNameDependencies = exports.allNativeEvents = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
exports.allNativeEvents = new Set();
if (react_feature_flags_1.enableCreateEventHandleAPI) {
    exports.allNativeEvents.add("beforeblur");
    exports.allNativeEvents.add("afterblur");
}
/**
 * Mapping from registration name to event name
 */
exports.registrationNameDependencies = {};
/**
 * Mapping from lowercase registration names to the properly cased version,
 * used to warn in the case of missing event handlers. Available
 * only in __DEV__.
 * @type {Object}
 */
exports.possibleRegistrationNames = __DEV__ ? {} : null;
// Trust the developer to only use possibleRegistrationNames in __DEV__
function registerTwoPhaseEvent(registrationName, dependencies) {
    registerDirectEvent(registrationName, dependencies);
    registerDirectEvent(registrationName + "Capture", dependencies);
}
exports.registerTwoPhaseEvent = registerTwoPhaseEvent;
function registerDirectEvent(registrationName, dependencies) {
    if (__DEV__) {
        if (exports.registrationNameDependencies[registrationName]) {
            console.error("EventRegistry: More than one plugin attempted to publish the same " + "registration name, `%s`.", registrationName);
        }
    }
    exports.registrationNameDependencies[registrationName] = dependencies;
    if (__DEV__) {
        var lowerCasedName = registrationName.toLowerCase();
        exports.possibleRegistrationNames[lowerCasedName] = registrationName;
        if (registrationName === "onDoubleClick") {
            exports.possibleRegistrationNames.ondblclick = registrationName;
        }
    }
    for (var i = 0; i < dependencies.length; i++) {
        exports.allNativeEvents.add(dependencies[i]);
    }
}
exports.registerDirectEvent = registerDirectEvent;
