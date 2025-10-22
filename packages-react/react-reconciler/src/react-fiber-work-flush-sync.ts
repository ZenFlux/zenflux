import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { LegacyRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import {
    activateBatchedExecutionContext,
    getExecutionContext,
    isExecutionContextRenderOrCommitActivate, setExecutionContext
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import { ReactFiberWorkOnRootShared } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-shared";
import {
    flushPassiveEffects,
    getRootWithPendingPassiveEffectsSafe,
    hasRootWithPendingPassiveEffects
} from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";

import {
    DiscreteEventPriority,
    getCurrentUpdatePriority,
    setCurrentUpdatePriority
} from "@zenflux/react-reconciler/src/react-event-priorities";

const {
    ReactCurrentBatchConfig,
} = ReactSharedInternals;

// Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.

// declare function flushSync<R>( fn: () => R ): R;

// declare function flushSync( arg0: void ): void;

export function flushSync<R>( fn: ( () => R ) | void ): R | void {
    // In legacy mode, we flush pending passive effects at the beginning of the
    // next event, not at the end of the previous one.
    if (
        hasRootWithPendingPassiveEffects() &&
        getRootWithPendingPassiveEffectsSafe().tag === LegacyRoot &&
        isExecutionContextRenderOrCommitActivate()
    ) {
        flushPassiveEffects();
    }

    const prevExecutionContext = getExecutionContext();

    activateBatchedExecutionContext();

    const prevTransition = ReactCurrentBatchConfig.transition;
    const previousPriority = getCurrentUpdatePriority();

    try {
        ReactCurrentBatchConfig.transition = null;
        setCurrentUpdatePriority( DiscreteEventPriority );

        if ( fn ) {
            return fn();
        } else {
            return undefined;
        }
    } finally {
        setCurrentUpdatePriority( previousPriority );
        ReactCurrentBatchConfig.transition = prevTransition;
        setExecutionContext( prevExecutionContext );

        // Flush the immediate callbacks that were scheduled during this batch.
        // Note that this will happen even if batchedUpdates is higher up
        // the stack.
        if ( isExecutionContextRenderOrCommitActivate() ) {
            ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
        }
    }
}
