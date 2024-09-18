"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRefreshHandler = exports.getRefreshHandler = exports.isRefreshHandler = exports.refresherHandler = exports.resolveForwardRefForHotReloading = exports.resolveClassForHotReloading = exports.resolveFunctionForHotReloading = void 0;
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var resolveFamily = null;
function resolveFunctionForHotReloading(type) {
    if (__DEV__) {
        if (resolveFamily === null) {
            // Hot reloading is disabled.
            return type;
        }
        var family = resolveFamily(type);
        if (family === undefined) {
            return type;
        }
        // Use the latest known implementation.
        return family.current;
    }
    else {
        return type;
    }
}
exports.resolveFunctionForHotReloading = resolveFunctionForHotReloading;
function resolveClassForHotReloading(type) {
    // No implementation differences.
    return resolveFunctionForHotReloading(type);
}
exports.resolveClassForHotReloading = resolveClassForHotReloading;
function resolveForwardRefForHotReloading(type) {
    if (__DEV__) {
        if (resolveFamily === null) {
            // Hot reloading is disabled.
            return type;
        }
        var family = resolveFamily(type);
        if (family === undefined) {
            // Check if we're dealing with a real forwardRef. Don't want to crash early.
            if (type !== null && type !== undefined && typeof type.render === "function") {
                // ForwardRef is special because its resolved .type is an object,
                // but it's possible that we only have its inner render function in the map.
                // If that inner render function is different, we'll build a new forwardRef type.
                var currentRender = resolveFunctionForHotReloading(type.render);
                if (type.render !== currentRender) {
                    var syntheticType = {
                        $$typeof: react_symbols_1.REACT_FORWARD_REF_TYPE,
                        render: currentRender
                    };
                    if (type.displayName !== undefined) {
                        syntheticType.displayName = type.displayName;
                    }
                    return syntheticType;
                }
            }
            return type;
        }
        // Use the latest known implementation.
        return family.current;
    }
    else {
        return type;
    }
}
exports.resolveForwardRefForHotReloading = resolveForwardRefForHotReloading;
function refresherHandler(type) {
    return resolveFamily(type);
}
exports.refresherHandler = refresherHandler;
function isRefreshHandler() {
    return !!resolveFamily;
}
exports.isRefreshHandler = isRefreshHandler;
function getRefreshHandler() {
    return resolveFamily;
}
exports.getRefreshHandler = getRefreshHandler;
var setRefreshHandler = function (handler) {
    if (__DEV__) {
        resolveFamily = handler;
    }
};
exports.setRefreshHandler = setRefreshHandler;
