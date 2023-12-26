import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";

export type DispatchConfig = {
    dependencies?: Array<DOMEventName>;
    phasedRegistrationNames: {
        bubbled: null | string;
        captured: null | string;
    };
    registrationName?: string;
};
type BaseSyntheticEvent = {
    isPersistent: () => boolean;
    isPropagationStopped: () => boolean;
    _dispatchInstances?: null | Array<Fiber | null> | Fiber;
    _dispatchListeners?: null | Array<( ... args: Array<any> ) => any> | ( ( ... args: Array<any> ) => any );
    _targetInst: Fiber;
    nativeEvent: Event;
    target?: unknown;
    relatedTarget?: unknown;
    type: string;
    currentTarget: null | EventTarget;
};
export type KnownReactSyntheticEvent = BaseSyntheticEvent & {
    _reactName: string;
};
export type UnknownReactSyntheticEvent = BaseSyntheticEvent & {
    _reactName: null;
};
export type ReactSyntheticEvent = KnownReactSyntheticEvent | UnknownReactSyntheticEvent;
