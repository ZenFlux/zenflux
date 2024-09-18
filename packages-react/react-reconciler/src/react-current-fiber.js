"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIsRendering = exports.setIsRendering = exports.getCurrentFiber = exports.setCurrentFiber = exports.resetCurrentFiber = exports.getCurrentFiberOwnerNameInDevOrNull = exports.isRendering = exports.current = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_component_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-component-stack");
var ReactDebugCurrentFrame = react_shared_internals_1.default.ReactDebugCurrentFrame;
exports.current = null;
exports.isRendering = false;
function getCurrentFiberOwnerNameInDevOrNull() {
    if (__DEV__) {
        if (exports.current === null) {
            return null;
        }
        var owner = exports.current._debugOwner;
        if (owner !== null && typeof owner !== "undefined") {
            return (0, react_get_component_name_from_fiber_1.default)(owner);
        }
    }
    return null;
}
exports.getCurrentFiberOwnerNameInDevOrNull = getCurrentFiberOwnerNameInDevOrNull;
function getCurrentFiberStackInDev() {
    if (__DEV__) {
        if (exports.current === null) {
            return "";
        }
        // Safe because if current fiber exists, we are reconciling,
        // and it is guaranteed to be the work-in-progress version.
        return (0, react_fiber_component_stack_1.getStackByFiberInDevAndProd)(exports.current);
    }
    return "";
}
function resetCurrentFiber() {
    if (__DEV__) {
        ReactDebugCurrentFrame.getCurrentStack = null;
        exports.current = null;
        exports.isRendering = false;
    }
}
exports.resetCurrentFiber = resetCurrentFiber;
function setCurrentFiber(fiber) {
    if (__DEV__) {
        ReactDebugCurrentFrame.getCurrentStack = fiber === null ? null : getCurrentFiberStackInDev;
        exports.current = fiber;
        exports.isRendering = false;
    }
}
exports.setCurrentFiber = setCurrentFiber;
function getCurrentFiber() {
    if (__DEV__) {
        return exports.current;
    }
    return null;
}
exports.getCurrentFiber = getCurrentFiber;
function setIsRendering(rendering) {
    if (__DEV__) {
        exports.isRendering = rendering;
    }
}
exports.setIsRendering = setIsRendering;
function getIsRendering() {
    if (__DEV__) {
        return exports.isRendering;
    }
}
exports.getIsRendering = getIsRendering;
