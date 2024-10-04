
import type { Fiber } from "@zenflux/react-shared/src/react-internal-types/fiber";

import type { FormStatus } from "@zenflux/react-dom-bindings/src/shared/ReactDOMFormActions";

export type TransitionTracingCallbacks = {
    onTransitionStart?: ( transitionName: string, startTime: number ) => void;
    onTransitionProgress?: ( transitionName: string, startTime: number, currentTime: number, pending: Array<{
        name: null | string;
    }> ) => void;
    onTransitionIncomplete?: ( transitionName: string, startTime: number, deletions: Array<{
        type: string;
        name?: string | null;
        endTime: number;
    }> ) => void;
    onTransitionComplete?: ( transitionName: string, startTime: number, endTime: number ) => void;
    onMarkerProgress?: ( transitionName: string, marker: string, startTime: number, currentTime: number, pending: Array<{
        name: null | string;
    }> ) => void;
    onMarkerIncomplete?: ( transitionName: string, marker: string, startTime: number, deletions: Array<{
        type: string;
        name?: string | null;
        endTime: number;
    }> ) => void;
    onMarkerComplete?: ( transitionName: string, marker: string, startTime: number, endTime: number ) => void;
};

export type TransitionStatus = FormStatus;

export type Transition = {
    name: string;
    startTime: number;
};
export type BatchConfigTransition = {
    name?: string;
    startTime?: number;
    _updatedFibers?: Set<Fiber>;
};

export type TransitionAbort = {
    reason: "error" | "unknown" | "marker" | "suspense";
    name?: string | null;
};
