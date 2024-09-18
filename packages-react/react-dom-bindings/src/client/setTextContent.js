"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
/**
 * Set the textContent property of a node. For text updates, it's faster
 * to set the `nodeValue` of the Text node directly instead of using
 * `.textContent` which will remove the existing node and create a new one.
 *
 * @param {DOMElement} node
 * @param {string} text
 * @internal
 */
function setTextContent(node, text) {
    if (text) {
        var firstChild = node.firstChild;
        if (firstChild && firstChild === node.lastChild && firstChild.nodeType === HTMLNodeType_1.TEXT_NODE) {
            firstChild.nodeValue = text;
            return;
        }
    }
    node.textContent = text;
}
exports.default = setTextContent;
