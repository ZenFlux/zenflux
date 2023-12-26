/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */
import { reactReconciler } from "@zenflux/react-reconciler";

import createReactNoop from "@zenflux/react-noop-renderer/src/create-react-noop";

export const {
    _Scheduler,
    getChildren,
    dangerouslyGetChildren,
    getPendingChildren,
    dangerouslyGetPendingChildren,
    getOrCreateRootContainer,
    createRoot,
    createLegacyRoot,
    getChildrenAsJSX,
    getPendingChildrenAsJSX,
    getSuspenseyThingStatus,
    resolveSuspenseyThing,
    resetSuspenseyThingCache,
    createPortal,
    render,
    renderLegacySyncRoot,
    renderToRootWithID,
    unmountRootWithID,
    findInstance,
    flushNextYield,
    startTrackingHostCounters,
    stopTrackingHostCounters,
    expire,
    flushExpired,
    batchedUpdates,
    deferredUpdates,
    discreteUpdates,
    idleUpdates,
    flushSync,
    flushPassiveEffects,

    // Not found in original
    // act,
    dumpTree,
    getRoot,
    // TODO: Remove this after callers migrate to alternatives.
    unstable_runWithPriority
} = await createReactNoop( reactReconciler, // reconciler
    true // useMutation
);
