import { startHostTransition } from "@zenflux/react-reconciler/src/react-fiber-reconciler";

import { getFiberCurrentPropsFromNode } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import { SyntheticEvent } from "@zenflux/react-dom-bindings/src/events/SyntheticEvent";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

import type { FormStatus } from "@zenflux/react-dom-bindings/src/shared/ReactDOMFormActions";

import type { AnyNativeEvent } from "@zenflux/react-dom-bindings/src/events/PluginModuleType";
import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";
import type { DispatchQueue } from "@zenflux/react-dom-bindings/src/events/DOMPluginEventSystem";
import type { EventSystemFlags } from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";

/**
 * This plugin invokes action functions on forms, inputs and buttons if
 * the form doesn't prevent default.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractEvents( dispatchQueue: DispatchQueue, domEventName: DOMEventName, maybeTargetInst: null | Fiber, nativeEvent: AnyNativeEvent, nativeEventTarget: null | EventTarget, eventSystemFlags: EventSystemFlags, targetContainer: EventTarget ) {
    if ( domEventName !== "submit" ) {
        return;
    }

    if ( ! maybeTargetInst || maybeTargetInst.stateNode !== nativeEventTarget ) {
        // If we're inside a parent root that itself is a parent of this root, then
        // its deepest target won't be the actual form that's being submitted.
        return;
    }

    const formInst = maybeTargetInst;
    const form: HTMLFormElement = ( nativeEventTarget as any );
    let action = ( getFiberCurrentPropsFromNode( form ) as any ).action;
    let submitter: null | HTMLInputElement | HTMLButtonElement = ( nativeEvent as any ).submitter;
    let submitterAction;

    if ( submitter ) {
        const submitterProps = getFiberCurrentPropsFromNode( submitter );
        submitterAction = submitterProps ? ( submitterProps as any ).formAction : submitter.getAttribute( "formAction" );

        if ( submitterAction != null ) {
            // The submitter overrides the form action.
            action = submitterAction;
            // If the action is a function, we don't want to pass its name
            // value to the FormData since it's controlled by the server.
            submitter = null;
        }
    }

    if ( typeof action !== "function" ) {
        return;
    }

    const event = new SyntheticEvent( "action", "action", null, nativeEvent, nativeEventTarget );

    function submitForm() {
        if ( nativeEvent.defaultPrevented ) {
            // We let earlier events to prevent the action from submitting.
            return;
        }

        // Prevent native navigation.
        event.preventDefault();
        let formData;

        if ( submitter ) {
            // The submitter's value should be included in the FormData.
            // It should be in the document order in the form.
            // Since the FormData constructor invokes the formdata event it also
            // needs to be available before that happens so after construction it's too
            // late. We use a temporary fake node for the duration of this event.
            // TODO: FormData takes a second argument that it's the submitter but this
            // is fairly new so not all browsers support it yet. Switch to that technique
            // when available.
            const temp = submitter.ownerDocument.createElement( "input" );
            temp.name = submitter.name;
            temp.value = submitter.value;
            ( submitter.parentNode as any ).insertBefore( temp, submitter );
            formData = new FormData( form );
            ( temp.parentNode as any ).removeChild( temp );
        } else {
            formData = new FormData( form );
        }

        const pendingState: FormStatus = {
            pending: true,
            data: formData,
            method: form.method,
            action: action
        };

        if ( __DEV__ ) {
            Object.freeze( pendingState );
        }

        startHostTransition( formInst, pendingState, action, formData );
    }

    dispatchQueue.push( {
        event,
        listeners: [ {
            instance: null,
            listener: submitForm,
            currentTarget: form
        } ]
    } );
}

export { extractEvents };

export function dispatchReplayedFormAction( formInst: Fiber, form: HTMLFormElement, action: ( arg0: FormData ) => void | Promise<void>, formData: FormData ): void {
    const pendingState: FormStatus = {
        pending: true,
        data: formData,
        method: form.method,
        action: action
    };

    if ( __DEV__ ) {
        Object.freeze( pendingState );
    }

    startHostTransition( formInst, pendingState, action, formData );
}
