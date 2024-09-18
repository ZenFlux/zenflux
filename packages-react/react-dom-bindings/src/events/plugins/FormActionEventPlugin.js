"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchReplayedFormAction = exports.extractEvents = void 0;
var react_fiber_reconciler_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var SyntheticEvent_1 = require("@zenflux/react-dom-bindings/src/events/SyntheticEvent");
/**
 * This plugin invokes action functions on forms, inputs and buttons if
 * the form doesn't prevent default.
 */
function extractEvents(dispatchQueue, domEventName, maybeTargetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    if (domEventName !== "submit") {
        return;
    }
    if (!maybeTargetInst || maybeTargetInst.stateNode !== nativeEventTarget) {
        // If we're inside a parent root that itself is a parent of this root, then
        // its deepest target won't be the actual form that's being submitted.
        return;
    }
    var formInst = maybeTargetInst;
    var form = nativeEventTarget;
    var action = (0, ReactDOMComponentTree_1.getFiberCurrentPropsFromNode)(form).action;
    var submitter = nativeEvent.submitter;
    var submitterAction;
    if (submitter) {
        var submitterProps = (0, ReactDOMComponentTree_1.getFiberCurrentPropsFromNode)(submitter);
        submitterAction = submitterProps ? submitterProps.formAction : submitter.getAttribute("formAction");
        if (submitterAction != null) {
            // The submitter overrides the form action.
            action = submitterAction;
            // If the action is a function, we don't want to pass its name
            // value to the FormData since it's controlled by the server.
            submitter = null;
        }
    }
    if (typeof action !== "function") {
        return;
    }
    var event = new SyntheticEvent_1.SyntheticEvent("action", "action", null, nativeEvent, nativeEventTarget);
    function submitForm() {
        if (nativeEvent.defaultPrevented) {
            // We let earlier events to prevent the action from submitting.
            return;
        }
        // Prevent native navigation.
        event.preventDefault();
        var formData;
        if (submitter) {
            // The submitter's value should be included in the FormData.
            // It should be in the document order in the form.
            // Since the FormData constructor invokes the formdata event it also
            // needs to be available before that happens so after construction it's too
            // late. We use a temporary fake node for the duration of this event.
            // TODO: FormData takes a second argument that it's the submitter but this
            // is fairly new so not all browsers support it yet. Switch to that technique
            // when available.
            var temp = submitter.ownerDocument.createElement("input");
            temp.name = submitter.name;
            temp.value = submitter.value;
            submitter.parentNode.insertBefore(temp, submitter);
            formData = new FormData(form);
            temp.parentNode.removeChild(temp);
        }
        else {
            formData = new FormData(form);
        }
        var pendingState = {
            pending: true,
            data: formData,
            method: form.method,
            action: action
        };
        if (__DEV__) {
            Object.freeze(pendingState);
        }
        (0, react_fiber_reconciler_1.startHostTransition)(formInst, pendingState, action, formData);
    }
    dispatchQueue.push({
        event: event,
        listeners: [{
                instance: null,
                listener: submitForm,
                currentTarget: form
            }]
    });
}
exports.extractEvents = extractEvents;
function dispatchReplayedFormAction(formInst, form, action, formData) {
    var pendingState = {
        pending: true,
        data: formData,
        method: form.method,
        action: action
    };
    if (__DEV__) {
        Object.freeze(pendingState);
    }
    (0, react_fiber_reconciler_1.startHostTransition)(formInst, pendingState, action, formData);
}
exports.dispatchReplayedFormAction = dispatchReplayedFormAction;
