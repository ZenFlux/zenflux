"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
/**
 * Given any node return the first leaf node without children.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {DOMElement|DOMTextNode}
 */
function getLeafNode(node) {
    while (node && node.firstChild) {
        node = node.firstChild;
    }
    return node;
}
/**
 * Get the next sibling within a container. This will walk up the
 * DOM if a node's siblings have been exhausted.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {?DOMElement|DOMTextNode}
 */
function getSiblingNode(node) {
    while (node) {
        if (node.nextSibling) {
            return node.nextSibling;
        }
        node = node.parentNode;
    }
}
/**
 * Get object describing the nodes which contain characters at offset.
 *
 * @param {DOMElement|DOMTextNode} root
 * @param {number} offset
 * @return {?object}
 */
function getNodeForCharacterOffset(root, offset) {
    var _a;
    var node = getLeafNode(root);
    var nodeStart = 0;
    var nodeEnd = 0;
    while (node) {
        if (node.nodeType === HTMLNodeType_1.TEXT_NODE) {
            nodeEnd = nodeStart + (((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0);
            if (nodeStart <= offset && nodeEnd >= offset) {
                return {
                    node: node,
                    offset: offset - nodeStart
                };
            }
            nodeStart = nodeEnd;
        }
        node = getLeafNode(getSiblingNode(node));
    }
}
exports.default = getNodeForCharacterOffset;
