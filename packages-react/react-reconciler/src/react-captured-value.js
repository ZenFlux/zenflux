"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCapturedValue = exports.createCapturedValueAtFiber = void 0;
var react_fiber_component_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-component-stack");
function createCapturedValueAtFiber(value, source) {
    // If the value is an error, call this function immediately after it is thrown
    // so the stack is accurate.
    return {
        value: value,
        source: source,
        stack: (0, react_fiber_component_stack_1.getStackByFiberInDevAndProd)(source),
        digest: null
    };
}
exports.createCapturedValueAtFiber = createCapturedValueAtFiber;
function createCapturedValue(value, digest, stack) {
    return {
        value: value,
        source: null,
        stack: stack != null ? stack : null,
        digest: digest != null ? digest : null
    };
}
exports.createCapturedValue = createCapturedValue;
