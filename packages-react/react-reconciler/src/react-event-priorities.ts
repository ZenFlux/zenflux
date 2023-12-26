import {
    DefaultLane,
    getHighestPriorityLane,
    IdleLane,
    includesNonIdleWork,
    InputContinuousLane,
    NoLane,
    SyncLane
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import type {
    Lane,
    Lanes
} from "@zenflux/react-shared/src/react-internal-types";

export type EventPriority = Lane;

// TODO: Convert to enum
export const DiscreteEventPriority: EventPriority = SyncLane;
export const ContinuousEventPriority: EventPriority = InputContinuousLane;
export const DefaultEventPriority: EventPriority = DefaultLane;
export const IdleEventPriority: EventPriority = IdleLane;

let currentUpdatePriority: EventPriority = NoLane;

export function getCurrentUpdatePriority(): EventPriority {
    return currentUpdatePriority;
}

export function setCurrentUpdatePriority( newPriority: EventPriority ) {
    currentUpdatePriority = newPriority;
}

export function runWithPriority<T>( priority: EventPriority, fn: () => T ): T {
    const previousPriority = currentUpdatePriority;

    try {
        currentUpdatePriority = priority;
        return fn();
    } finally {
        currentUpdatePriority = previousPriority;
    }
}

export function higherEventPriority( a: EventPriority, b: EventPriority ): EventPriority {
    return a !== 0 && a < b ? a : b;
}

export function lowerEventPriority( a: EventPriority, b: EventPriority ): EventPriority {
    return a === 0 || a > b ? a : b;
}

export function isHigherEventPriority( a: EventPriority, b: EventPriority ): boolean {
    return a !== 0 && a < b;
}

export function lanesToEventPriority( lanes: Lanes ): EventPriority {
    const lane = getHighestPriorityLane( lanes );

    if ( ! isHigherEventPriority( DiscreteEventPriority, lane ) ) {
        return DiscreteEventPriority;
    }

    if ( ! isHigherEventPriority( ContinuousEventPriority, lane ) ) {
        return ContinuousEventPriority;
    }

    if ( includesNonIdleWork( lane ) ) {
        return DefaultEventPriority;
    }

    return IdleEventPriority;
}
