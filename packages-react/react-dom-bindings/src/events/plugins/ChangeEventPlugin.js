"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEvents = exports.registerEvents = void 0;
var execution_environment_1 = require("@zenflux/react-shared/src/execution-environment");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var EventRegistry_1 = require("@zenflux/react-dom-bindings/src/events/EventRegistry");
var SyntheticEvent_1 = require("@zenflux/react-dom-bindings/src/events/SyntheticEvent");
var isTextInputElement_1 = require("@zenflux/react-dom-bindings/src/events/isTextInputElement");
var getEventTarget_1 = require("@zenflux/react-dom-bindings/src/events/getEventTarget");
var isEventSupported_1 = require("@zenflux/react-dom-bindings/src/events/isEventSupported");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var inputValueTracking_1 = require("@zenflux/react-dom-bindings/src/client/inputValueTracking");
var ReactDOMInput_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMInput");
var ReactDOMControlledComponent_1 = require("@zenflux/react-dom-bindings/src/events/ReactDOMControlledComponent");
var ReactDOMUpdateBatching_1 = require("@zenflux/react-dom-bindings/src/events/ReactDOMUpdateBatching");
var isCustomElement_1 = require("@zenflux/react-dom-bindings/src/shared/isCustomElement");
var react_dom_plugin_event_system_accumulate_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-accumulate");
var react_dom_plugin_event_system_process_dispatch_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-process-dispatch");
function registerEvents() {
    (0, EventRegistry_1.registerTwoPhaseEvent)("onChange", ["change", "click", "focusin", "focusout", "input", "keydown", "keyup", "selectionchange"]);
}
exports.registerEvents = registerEvents;
function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
    // Flag this event loop as needing state restore.
    (0, ReactDOMControlledComponent_1.enqueueStateRestore)(target);
    var listeners = (0, react_dom_plugin_event_system_accumulate_1.accumulateTwoPhaseListeners)(inst, "onChange");
    if (listeners.length > 0) {
        var event_1 = new SyntheticEvent_1.SyntheticEvent("onChange", "change", null, nativeEvent, target);
        dispatchQueue.push({
            event: event_1,
            listeners: listeners
        });
    }
}
/**
 * For IE shims
 */
var activeElement = null;
var activeElementInst = null;
/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem) {
    var nodeName = elem.nodeName && elem.nodeName.toLowerCase();
    return nodeName === "select" || nodeName === "input" && elem.type === "file";
}
function manualDispatchChangeEvent(nativeEvent) {
    var dispatchQueue = [];
    createAndAccumulateChangeEvent(dispatchQueue, activeElementInst, nativeEvent, (0, getEventTarget_1.default)(nativeEvent));
    // If change and propertychange bubbled, we'd just bind to it like all the
    // other events and have it go through ReactBrowserEventEmitter. Since it
    // doesn't, we manually listen for the events and so we have to enqueue and
    // process the abstract event manually.
    //
    // Batching is necessary here in order to ensure that all event handlers run
    // before the next rerender (including event handlers attached to ancestor
    // elements instead of directly on the input). Without this, controlled
    // components don't work properly in conjunction with event bubbling because
    // the component is rerendered and the value reverted before all the event
    // handlers can run. See https://github.com/facebook/react/issues/708.
    (0, ReactDOMUpdateBatching_1.batchedUpdates)(runEventInBatch, dispatchQueue);
}
function runEventInBatch(dispatchQueue) {
    (0, react_dom_plugin_event_system_process_dispatch_1.processDispatchQueue)(dispatchQueue, 0);
}
function getInstIfValueChanged(targetInst) {
    var targetNode = (0, ReactDOMComponentTree_1.getNodeFromInstance)(targetInst);
    if ((0, inputValueTracking_1.updateValueIfChanged)(targetNode)) {
        return targetInst;
    }
}
function getTargetInstForChangeEvent(domEventName, targetInst) {
    if (domEventName === "change") {
        return targetInst;
    }
}
/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (execution_environment_1.canUseDOM) {
    // IE9 claims to support the input event but fails to trigger it when
    // deleting text, so we ignore its input events.
    // @ts-ignore
    isInputEventSupported = (0, isEventSupported_1.default)("input") && (!document.documentMode || document.documentMode > 9);
}
/**
 * (For IE <=9) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
function startWatchingForValueChange(target, targetInst) {
    activeElement = target;
    activeElementInst = targetInst;
    activeElement.attachEvent("onpropertychange", handlePropertyChange);
}
/**
 * (For IE <=9) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
function stopWatchingForValueChange() {
    if (!activeElement) {
        return;
    }
    activeElement.detachEvent("onpropertychange", handlePropertyChange);
    activeElement = null;
    activeElementInst = null;
}
/**
 * (For IE <=9) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
function handlePropertyChange(nativeEvent) {
    if (nativeEvent.propertyName !== "value") {
        return;
    }
    if (getInstIfValueChanged(activeElementInst)) {
        manualDispatchChangeEvent(nativeEvent);
    }
}
function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
    if (domEventName === "focusin") {
        // In IE9, propertychange fires for most input events but is buggy and
        // doesn't fire when text is deleted, but conveniently, selectionchange
        // appears to fire in all of the remaining cases so we catch those and
        // forward the event if the value has changed
        // In either case, we don't want to call the event handler if the value
        // is changed from JS so we redefine a setter for `.value` that updates
        // our activeElementValue variable, allowing us to ignore those changes
        //
        // stopWatching() should be a noop here but we call it just in case we
        // missed a blur event somehow.
        stopWatchingForValueChange();
        startWatchingForValueChange(target, targetInst);
    }
    else if (domEventName === "focusout") {
        stopWatchingForValueChange();
    }
}
// For IE8 and IE9.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTargetInstForInputEventPolyfill(domEventName, targetInst) {
    if (domEventName === "selectionchange" || domEventName === "keyup" || domEventName === "keydown") {
        // On the selectionchange event, the target is just document which isn't
        // helpful for us so just check activeElement instead.
        //
        // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
        // propertychange on the first input event after setting `value` from a
        // script and fires only keydown, keypress, keyup. Catching keyup usually
        // gets it and catching keydown lets us fire an event for the first
        // keystroke if user does a key repeat (it'll be a little delayed: right
        // before the second keystroke). Other input methods (e.g., paste) seem to
        // fire selectionchange normally.
        return getInstIfValueChanged(activeElementInst);
    }
}
/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem) {
    // Use the `click` event to detect changes to checkbox and radio inputs.
    // This approach works across all browsers, whereas `change` does not fire
    // until `blur` in IE8.
    var nodeName = elem.nodeName;
    return nodeName && nodeName.toLowerCase() === "input" && (elem.type === "checkbox" || elem.type === "radio");
}
function getTargetInstForClickEvent(domEventName, targetInst) {
    if (domEventName === "click") {
        return getInstIfValueChanged(targetInst);
    }
}
function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
    if (domEventName === "input" || domEventName === "change") {
        return getInstIfValueChanged(targetInst);
    }
}
function handleControlledInputBlur(node, props) {
    if (node.type !== "number") {
        return;
    }
    if (!react_feature_flags_1.disableInputAttributeSyncing) {
        var isControlled = props.value != null;
        if (isControlled) {
            // If controlled, assign the value attribute to the current value on blur
            (0, ReactDOMInput_1.setDefaultValue)(node, "number", node.value);
        }
    }
}
/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    var targetNode = targetInst ? (0, ReactDOMComponentTree_1.getNodeFromInstance)(targetInst) : window;
    var getTargetInstFunc, handleEventFunc;
    // @ts-ignore
    if (shouldUseChangeEvent(targetNode)) {
        getTargetInstFunc = getTargetInstForChangeEvent;
    }
    else if ((0, isTextInputElement_1.default)(targetNode)) {
        if (isInputEventSupported) {
            getTargetInstFunc = getTargetInstForInputOrChangeEvent;
        }
        else {
            getTargetInstFunc = getTargetInstForInputEventPolyfill;
            handleEventFunc = handleEventsForInputEventPolyfill;
        }
    }
    else if (shouldUseClickEvent(targetNode)) {
        getTargetInstFunc = getTargetInstForClickEvent;
    }
    else if (react_feature_flags_1.enableCustomElementPropertySupport && targetInst && (0, isCustomElement_1.default)(targetInst.elementType, targetInst.memoizedProps)) {
        getTargetInstFunc = getTargetInstForChangeEvent;
    }
    if (getTargetInstFunc) {
        var inst = getTargetInstFunc(domEventName, targetInst);
        if (inst) {
            createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, nativeEventTarget);
            return;
        }
    }
    if (handleEventFunc) {
        // @ts-ignore
        handleEventFunc(domEventName, targetNode, targetInst);
    }
    // When blurring, set the value attribute for number inputs
    if (domEventName === "focusout" && targetInst) {
        // These props aren't necessarily the most current but we warn for changing
        // between controlled and uncontrolled, so it doesn't matter and the previous
        // code was also broken for changes.
        var props = targetInst.memoizedProps;
        handleControlledInputBlur(targetNode, props);
    }
}
exports.extractEvents = extractEvents;
