"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSelection = exports.getSelection = exports.restoreSelection = exports.getSelectionInformation = exports.hasSelectionCapabilities = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var getActiveElement_1 = require("@zenflux/react-dom-bindings/src/client/getActiveElement");
var ReactDOMSelection_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMSelection");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
function isTextNode(node) {
    return node && node.nodeType === HTMLNodeType_1.TEXT_NODE;
}
function containsNode(outerNode, innerNode) {
    if (!outerNode || !innerNode) {
        return false;
    }
    else if (outerNode === innerNode) {
        return true;
    }
    else if (isTextNode(outerNode)) {
        return false;
    }
    else if (isTextNode(innerNode)) {
        return containsNode(outerNode, innerNode.parentNode);
    }
    else if ("contains" in outerNode) {
        return outerNode.contains(innerNode);
    }
    else if (outerNode.compareDocumentPosition) {
        return !!(outerNode.compareDocumentPosition(innerNode) & 16);
    }
    else {
        return false;
    }
}
function isInDocument(node) {
    return node && node.ownerDocument && containsNode(node.ownerDocument.documentElement, node);
}
function isSameOriginFrame(iframe) {
    try {
        // Accessing the contentDocument of a HTMLIframeElement can cause the browser
        // to throw, e.g. if it has a cross-origin src attribute.
        // Safari will show an error in the console when the access results in "Blocked a frame with origin". e.g:
        // iframe.contentDocument.defaultView;
        // A safety way is to access one of the cross origin properties: Window or Location
        // Which might result in "SecurityError" DOM Exception and it is compatible to Safari.
        // https://html.spec.whatwg.org/multipage/browsers.html#integration-with-idl
        // @ts-ignore
        return typeof iframe.contentWindow.location.href === "string";
    }
    catch (err) {
        return false;
    }
}
function getActiveElementDeep() {
    var win = window;
    var element = (0, getActiveElement_1.default)();
    while (element instanceof win.HTMLIFrameElement) {
        if (isSameOriginFrame(element)) {
            win = element.contentWindow;
        }
        else {
            return element;
        }
        element = (0, getActiveElement_1.default)(win.document);
    }
    return element;
}
/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
/**
 * @hasSelectionCapabilities: we get the element types that support selection
 * from https://html.spec.whatwg.org/#do-not-apply, looking at `selectionStart`
 * and `selectionEnd` rows.
 */
function hasSelectionCapabilities(elem) {
    var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
    return nodeName && (nodeName === "input" && (elem.type === "text" || elem.type === "search" || elem.type === "tel" || elem.type === "url" || elem.type === "password") || nodeName === "textarea" || elem.contentEditable === "true");
}
exports.hasSelectionCapabilities = hasSelectionCapabilities;
function getSelectionInformation() {
    var focusedElem = getActiveElementDeep();
    return {
        focusedElem: focusedElem,
        selectionRange: hasSelectionCapabilities(focusedElem) ? getSelection(focusedElem) : null
    };
}
exports.getSelectionInformation = getSelectionInformation;
/**
 * @restoreSelection: If any selection information was potentially lost,
 * restore it. This is useful when performing operations that could remove dom
 * nodes and place them back in, resulting in focus being lost.
 */
function restoreSelection(priorSelectionInformation) {
    var curFocusedElem = getActiveElementDeep();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem && isInDocument(priorFocusedElem)) {
        if (priorSelectionRange !== null && hasSelectionCapabilities(priorFocusedElem)) {
            setSelection(priorFocusedElem, priorSelectionRange);
        }
        // Focusing a node can change the scroll position, which is undesirable
        var ancestors = [];
        var ancestor = priorFocusedElem;
        // @ts-ignore
        while (ancestor = ancestor.parentNode) {
            if ((ancestor === null || ancestor === void 0 ? void 0 : ancestor.nodeType) === HTMLNodeType_1.ELEMENT_NODE) {
                ancestors.push({
                    element: ancestor,
                    left: ancestor.scrollLeft,
                    top: ancestor.scrollTop
                });
            }
        }
        if (typeof priorFocusedElem.focus === "function") {
            priorFocusedElem.focus();
        }
        for (var i = 0; i < ancestors.length; i++) {
            var info = ancestors[i];
            info.element.scrollLeft = info.left;
            info.element.scrollTop = info.top;
        }
    }
}
exports.restoreSelection = restoreSelection;
/**
 * @getSelection: Gets the selection bounds of a focused textarea, input or
 * contentEditable node.
 * -@input: Look up selection bounds of this input
 * -@return {start: selectionStart, end: selectionEnd}
 */
function getSelection(input) {
    var selection;
    if ("selectionStart" in input) {
        // Modern browser with input or textarea.
        selection = {
            start: input.selectionStart,
            end: input.selectionEnd
        };
    }
    else {
        // Content editable or old IE textarea.
        selection = (0, ReactDOMSelection_1.getOffsets)(input);
    }
    return selection || {
        start: 0,
        end: 0
    };
}
exports.getSelection = getSelection;
/**
 * @setSelection: Sets the selection bounds of a textarea or input and focuses
 * the input.
 * -@input     Set selection bounds of this input or textarea
 * -@offsets   Object of same form that is returned from get*
 */
function setSelection(input, offsets) {
    var start = offsets.start;
    var end = offsets.end;
    if (end === undefined) {
        end = start;
    }
    if ("selectionStart" in input) {
        input.selectionStart = start;
        input.selectionEnd = Math.min(end, input.value.length);
    }
    else {
        (0, ReactDOMSelection_1.setOffsets)(input, offsets);
    }
}
exports.setSelection = setSelection;
