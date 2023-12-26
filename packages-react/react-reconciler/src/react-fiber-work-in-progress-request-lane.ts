import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import {
    NoLane, NoLanes,
    OffscreenLane,
    SyncLane
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { isHydrating } from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";

import { isExecutionContextRenderDeactivate } from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";

import {
    getWorkInProgressDeferredLane,
    getWorkInProgressRootRenderLanes,
    setWorkInProgressDeferredLane
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";

import { getCurrentUpdatePriority } from "@zenflux/react-reconciler/src/react-event-priorities";
import { peekEntangledActionLane } from "@zenflux/react-reconciler/src/react-fiber-async-action";
import { includesSomeLane, pickArbitraryLane } from "@zenflux/react-reconciler/src/react-fiber-lane";

import { NoTransition, requestCurrentTransition } from "@zenflux/react-reconciler/src/react-fiber-transition";

import { requestTransitionLane } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler";

import type { Fiber, Lane } from "@zenflux/react-shared/src/react-internal-types";

const {
    getCurrentEventPriority,
} = globalThis.__RECONCILER__CONFIG__;

const {
    ReactCurrentBatchConfig,
} = ReactSharedInternals;

export function requestDeferredLane(): Lane {
    if ( getWorkInProgressDeferredLane() === NoLane ) {
        // If there are multiple useDeferredValue hooks in the same render, the
        // tasks that they spawn should all be batched together, so they should all
        // receive the same lane.
        // Check the priority of the current render to decide the priority of the
        // deferred task.
        // OffscreenLane is used for prerendering, but we also use OffscreenLane
        // for incremental hydration. It's given the lowest priority because the
        // initial HTML is the same as the final UI. But useDeferredValue during
        // hydration is an exception — we need to upgrade the UI to the final
        // value. So if we're currently hydrating, we treat it like a transition.
        const isPrerendering = includesSomeLane( getWorkInProgressRootRenderLanes(), OffscreenLane ) && ! isHydrating();

        if ( isPrerendering ) {
            // There's only one OffscreenLane, so if it contains deferred work, we
            // should just reschedule using the same lane.
            setWorkInProgressDeferredLane( OffscreenLane );
        } else {
            // Everything else is spawned as a transition.
            setWorkInProgressDeferredLane( requestTransitionLane() );
        }
    }

    return getWorkInProgressDeferredLane();
}

export function requestUpdateLane( fiber: Fiber ): Lane {
    // Special cases
    const mode = fiber.mode;

    if ( ( mode & TypeOfMode.ConcurrentMode ) === TypeOfMode.NoMode ) {
        return ( SyncLane as Lane );
    } else if ( isExecutionContextRenderDeactivate() && getWorkInProgressRootRenderLanes() !== NoLanes ) {
        // This is a render phase update. These are not officially supported. The
        // old behavior is to give this the same "thread" (lanes) as
        // whatever is currently rendering. So if you call `setState` on a component
        // that happens later in the same render, it will flush. Ideally, we want to
        // remove the special case and treat them as if they came from an
        // interleaved event. Regardless, this pattern is not officially supported.
        // This behavior is only a fallback. The flag only exists until we can roll
        // out the setState warning, since existing code might accidentally rely on
        // the current behavior.
        return pickArbitraryLane( getWorkInProgressRootRenderLanes() );
    }

    const isTransition = requestCurrentTransition() !== NoTransition;

    if ( isTransition ) {
        if ( __DEV__ && ReactCurrentBatchConfig.transition !== null ) {
            const transition = ReactCurrentBatchConfig.transition;

            if ( ! transition._updatedFibers ) {
                transition._updatedFibers = new Set();
            }

            transition._updatedFibers.add( fiber );
        }

        const actionScopeLane = peekEntangledActionLane();
        return actionScopeLane !== NoLane ? // We're inside an async action scope. Reuse the same lane.
            actionScopeLane : // We may or may not be inside an async action scope. If we are, this
            // is the first update in that scope. Either way, we need to get a
            // fresh transition lane.
            requestTransitionLane();
    }

    // Updates originating inside certain React methods, like flushSync, have
    // their priority set by tracking it with a context variable.
    //
    // The opaque type returned by the host config is internally a lane, so we can
    // use that directly.
    // TODO: Move this type conversion to the event priority module.
    const updateLane: Lane = ( getCurrentUpdatePriority() as any );

    if ( updateLane !== NoLane ) {
        return updateLane;
    }

    // This update originated outside React. Ask the host environment for an
    // appropriate priority, based on the type of event.
    //
    // The opaque type returned by the host config is internally a lane, so we can
    // use that directly.
    // TODO: Move this type conversion to the event priority module.
    const eventLane: Lane = ( getCurrentEventPriority() as any );
    return eventLane;
}
