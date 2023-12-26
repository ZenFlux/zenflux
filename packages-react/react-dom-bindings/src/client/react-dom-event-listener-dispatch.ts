import {
    ContinuousEventPriority,
    DiscreteEventPriority,
    getCurrentUpdatePriority,
    setCurrentUpdatePriority
} from "@zenflux/react-reconciler/src/react-event-priorities";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { dispatchEventEx } from "@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch-ex";

import type { EventSystemFlags} from "@zenflux/react-dom-bindings/src/events/EventSystemFlags";
import type { AnyNativeEvent } from "@zenflux/react-dom-bindings/src/events/PluginModuleType";
import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";

const {
    ReactCurrentBatchConfig
} = ReactSharedInternals;

export function dispatchDiscreteEvent( domEventName: DOMEventName, eventSystemFlags: EventSystemFlags, container: EventTarget, nativeEvent: AnyNativeEvent ) {
    const previousPriority = getCurrentUpdatePriority();
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = null;

    try {
        setCurrentUpdatePriority( DiscreteEventPriority );
        dispatchEventEx( domEventName, eventSystemFlags, container, nativeEvent );
    } finally {
        setCurrentUpdatePriority( previousPriority );
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}

export function dispatchContinuousEvent( domEventName: DOMEventName, eventSystemFlags: EventSystemFlags, container: EventTarget, nativeEvent: AnyNativeEvent ) {
    const previousPriority = getCurrentUpdatePriority();
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = null;

    try {
        setCurrentUpdatePriority( ContinuousEventPriority );
        dispatchEventEx( domEventName, eventSystemFlags, container, nativeEvent );
    } finally {
        setCurrentUpdatePriority( previousPriority );
        ReactCurrentBatchConfig.transition = prevTransition;
    }
}

