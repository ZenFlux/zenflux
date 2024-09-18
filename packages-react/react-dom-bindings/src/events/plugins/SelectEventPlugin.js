"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEvents = exports.registerEvents = void 0;
var execution_environment_1 = require("@zenflux/react-shared/src/execution-environment");
var shallow_equal_1 = require("@zenflux/react-shared/src/shallow-equal");
var SyntheticEvent_1 = require("@zenflux/react-dom-bindings/src/events/SyntheticEvent");
var isTextInputElement_1 = require("@zenflux/react-dom-bindings/src/events/isTextInputElement");
var EventRegistry_1 = require("@zenflux/react-dom-bindings/src/events/EventRegistry");
var getActiveElement_1 = require("@zenflux/react-dom-bindings/src/client/getActiveElement");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var ReactInputSelection_1 = require("@zenflux/react-dom-bindings/src/client/ReactInputSelection");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
var react_dom_plugin_event_system_accumulate_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-accumulate");
var skipSelectionChangeEvent = execution_environment_1.canUseDOM && "documentMode" in document && document.documentMode <= 11;
function registerEvents() {
    (0, EventRegistry_1.registerTwoPhaseEvent)("onSelect", ["focusout", "contextmenu", "dragend", "focusin", "keydown", "keyup", "mousedown", "mouseup", "selectionchange"]);
}
exports.registerEvents = registerEvents;
var activeElement = null;
var activeElementInst = null;
var lastSelection = null;
var mouseDown = false;
/**
 * Get an object which is a unique representation of the current selection.
 *
 * The return value will not be consistent across nodes or browsers, but
 * two identical selections on the same node will return identical objects.
 */
function getSelection(node) {
    if ("selectionStart" in node && (0, ReactInputSelection_1.hasSelectionCapabilities)(node)) {
        return {
            start: node.selectionStart,
            end: node.selectionEnd
        };
    }
    else {
        var win = node.ownerDocument && node.ownerDocument.defaultView || window;
        var selection = win.getSelection();
        return {
            anchorNode: selection.anchorNode,
            anchorOffset: selection.anchorOffset,
            focusNode: selection.focusNode,
            focusOffset: selection.focusOffset
        };
    }
}
/**
 * Get document associated with the event target.
 */
function getEventTargetDocument(eventTarget) {
    return eventTarget.window === eventTarget ? eventTarget.document : eventTarget.nodeType === HTMLNodeType_1.DOCUMENT_NODE ? eventTarget : eventTarget.ownerDocument;
}
/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @param {object} nativeEventTarget
 * @return {?SyntheticEvent}
 */
function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
    // Ensure we have the right element, and that the user is not dragging a
    // selection (this matches native `select` event behavior). In HTML5, select
    // fires only on input and textarea thus if there's no focused element we
    // won't dispatch.
    var doc = getEventTargetDocument(nativeEventTarget);
    if (mouseDown || activeElement == null || activeElement !== (0, getActiveElement_1.default)(doc)) {
        return;
    }
    // Only fire when selection has actually changed.
    var currentSelection = getSelection(activeElement);
    if (!lastSelection || !(0, shallow_equal_1.default)(lastSelection, currentSelection)) {
        lastSelection = currentSelection;
        var listeners = (0, react_dom_plugin_event_system_accumulate_1.accumulateTwoPhaseListeners)(activeElementInst, "onSelect");
        if (listeners.length > 0) {
            var event_1 = new SyntheticEvent_1.SyntheticEvent("onSelect", "select", null, nativeEvent, nativeEventTarget);
            dispatchQueue.push({
                event: event_1,
                listeners: listeners
            });
            event_1.target = activeElement;
        }
    }
}
/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    var targetNode = targetInst ? (0, ReactDOMComponentTree_1.getNodeFromInstance)(targetInst) : window;
    switch (domEventName) {
        // Track the input node that has focus.
        case "focusin":
            if ((0, isTextInputElement_1.default)(targetNode) || targetNode.contentEditable === "true") {
                activeElement = targetNode;
                activeElementInst = targetInst;
                lastSelection = null;
            }
            break;
        case "focusout":
            activeElement = null;
            activeElementInst = null;
            lastSelection = null;
            break;
        // Don't fire the event while the user is dragging. This matches the
        // semantics of the native select event.
        case "mousedown":
            mouseDown = true;
            break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
            mouseDown = false;
            constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
            break;
        // Chrome and IE fire non-standard event when selection is changed (and
        // sometimes when it hasn't). IE's event fires out of order with respect
        // to key and input events on deletion, so we discard it.
        //
        // Firefox doesn't support selectionchange, so check selection status
        // after each key entry. The selection changes after keydown and before
        // keyup, but we check on keydown as well in the case of holding down a
        // key, when multiple keydown events are fired but only one keyup is.
        // This is also our approach for IE handling, for the reason above.
        case "selectionchange":
            if (skipSelectionChangeEvent) {
                break;
            }
        // falls through
        case "keydown":
        case "keyup":
            constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
    }
}
exports.extractEvents = extractEvents;
