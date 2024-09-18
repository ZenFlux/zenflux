"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentSuspenseInstance = void 0;
var ReactDOMFizzInstructionSetShared_1 = require("@zenflux/react-dom-bindings/src/server/fizz-instruction-set/ReactDOMFizzInstructionSetShared");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
var react_fiber_config_dom_suspense_data_flags_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-suspense-data-flags");
// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
function getParentSuspenseInstance(targetInstance) {
    var node = targetInstance.previousSibling;
    // Skip past all nodes within this suspense boundary.
    // There might be nested nodes so we need to keep track of how
    // deep we are and only break out when we're back on top.
    var depth = 0;
    while (node) {
        if (node.nodeType === HTMLNodeType_1.COMMENT_NODE) {
            var data = node.data;
            if (data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_START_DATA || data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_FALLBACK_START_DATA || data === ReactDOMFizzInstructionSetShared_1.SUSPENSE_PENDING_START_DATA) {
                if (depth === 0) {
                    return node;
                }
                else {
                    depth--;
                }
            }
            else if (data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_END_DATA) {
                depth++;
            }
        }
        node = node.previousSibling;
    }
    return null;
}
exports.getParentSuspenseInstance = getParentSuspenseInstance;
