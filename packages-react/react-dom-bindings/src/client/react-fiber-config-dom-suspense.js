"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSuspenseInstanceRetry = exports.getSuspenseInstanceFallbackErrorDetails = exports.isSuspenseInstanceFallback = exports.isSuspenseInstancePending = exports.getNextHydratableInstanceAfterSuspenseInstance = void 0;
var react_fiber_config_dom_hydrate_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-hydrate");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
var react_fiber_config_dom_suspense_data_flags_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-suspense-data-flags");
function getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance) {
    var node = suspenseInstance.nextSibling;
    // Skip past all nodes within this suspense boundary.
    // There might be nested nodes so we need to keep track of how
    // deep we are and only break out when we're back on top.
    var depth = 0;
    while (node) {
        if (node.nodeType === HTMLNodeType_1.COMMENT_NODE) {
            var data = node.data;
            if (data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_END_DATA) {
                if (depth === 0) {
                    return (0, react_fiber_config_dom_hydrate_1.getNextHydratableSibling)(node);
                }
                else {
                    depth--;
                }
            }
            else if (data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_START_DATA || data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_FALLBACK_START_DATA || data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_PENDING_START_DATA) {
                depth++;
            }
        }
        node = node.nextSibling;
    }
    // TODO: Warn, we didn't find the end comment boundary.
    return null;
}
exports.getNextHydratableInstanceAfterSuspenseInstance = getNextHydratableInstanceAfterSuspenseInstance;
function isSuspenseInstancePending(instance) {
    return instance.data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_PENDING_START_DATA;
}
exports.isSuspenseInstancePending = isSuspenseInstancePending;
function isSuspenseInstanceFallback(instance) {
    return instance.data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_FALLBACK_START_DATA;
}
exports.isSuspenseInstanceFallback = isSuspenseInstanceFallback;
function getSuspenseInstanceFallbackErrorDetails(instance) {
    var dataset = instance.nextSibling && instance.nextSibling.dataset;
    var digest, message, stack;
    if (dataset) {
        digest = dataset.dgst;
        if (__DEV__) {
            message = dataset.msg;
            stack = dataset.stck;
        }
    }
    if (__DEV__) {
        return {
            message: message,
            digest: digest,
            stack: stack
        };
    }
    else {
        // Object gets DCE'd if constructed in tail position and matches callsite destructuring
        return {
            digest: digest
        };
    }
}
exports.getSuspenseInstanceFallbackErrorDetails = getSuspenseInstanceFallbackErrorDetails;
function registerSuspenseInstanceRetry(instance, callback) {
    instance._reactRetry = callback;
}
exports.registerSuspenseInstanceRetry = registerSuspenseInstanceRetry;
