"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentIdContext = void 0;
var react_1 = require("react");
var createErrorMessage = function (functionName) { return "ComponentCommandContext.Provider is not set. Using default ".concat(functionName, " function."); };
// An internal context used by `use-commands`
exports.ComponentIdContext = react_1.default.createContext({
    isSet: false,
    getNameUnique: function () {
        throw new Error(createErrorMessage("getUniqueName"));
    },
    getComponentName: function () {
        throw new Error(createErrorMessage("getComponentName"));
    },
    getComponentRef: function () {
        throw new Error(createErrorMessage("getComponentRef"));
    }
});
