import is from "@zenflux/react-shared/src/object-is";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";

import {
    includesBlockingLane,
    SyncLane
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { enqueueConcurrentRenderForLane } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import {
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";
import {
    ReactFiberHooksCurrent,
    ReactFiberHooksFlags,
    ReactFiberHooksInfra
} from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import {
    createEffectInstance,
    mountEffect,
    pushEffect,
    updateEffect
} from "@zenflux/react-reconciler/src/react-fiber-hooks-use-effect";
import { isHydrating } from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";

import {
    getWorkInProgressRoot,
    getWorkInProgressRootRenderLanes
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import {
    markWorkInProgressReceivedUpdate
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update";

import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";

import type { Fiber, FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

import type { StoreConsistencyCheck, StoreInstance } from "@zenflux/react-shared/src/react-internal-types/store";

import type { FunctionComponentUpdateQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

function updateStoreInstance<T>( fiber: Fiber, inst: StoreInstance<T>, nextSnapshot: T, getSnapshot: () => T ): void {
    // These are updated in the passive phase
    inst.value = nextSnapshot;
    inst.getSnapshot = getSnapshot;

    // Something may have been mutated in between render and commit. This could
    // have been in an event that fired before the passive effects, or it could
    // have been in a layout effect. In that case, we would have used the old
    // snapsho and getSnapshot values to bail out. We need to check one more time.
    if ( checkIfSnapshotChanged( inst ) ) {
        // Force a re-render.
        forceStoreRerender( fiber );
    }
}

function checkIfSnapshotChanged<T>( inst: StoreInstance<T> ): boolean {
    const latestGetSnapshot = inst.getSnapshot;
    const prevValue = inst.value;

    try {
        const nextValue = latestGetSnapshot();
        return ! is( prevValue, nextValue );
    } catch ( error ) {
        return true;
    }
}

function forceStoreRerender( fiber: Fiber ) {
    const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

    if ( root !== null ) {
        scheduleUpdateOnFiber( root, fiber, SyncLane );
    }
}

function pushStoreConsistencyCheck<T>( fiber: Fiber, getSnapshot: () => T, renderedSnapshot: T ): void {
    fiber.flags |= FiberFlags.StoreConsistency;
    const check: StoreConsistencyCheck<T> = {
        getSnapshot,
        value: renderedSnapshot
    };
    let componentUpdateQueue: null | FunctionComponentUpdateQueue = ( ReactFiberHooksCurrent.renderingFiber.updateQueue as any );

    if ( componentUpdateQueue === null ) {
        componentUpdateQueue = ReactFiberHooksInfra.createFunctionComponentUpdateQueue();
        ReactFiberHooksCurrent.renderingFiber.updateQueue = ( componentUpdateQueue as any );
        componentUpdateQueue.stores = [ check ];
    } else {
        const stores = componentUpdateQueue.stores;

        if ( stores === null ) {
            componentUpdateQueue.stores = [ check ];
        } else {
            stores.push( check );
        }
    }
}

function subscribeToStore<T>( fiber: Fiber, inst: StoreInstance<T>, subscribe: ( arg0: () => void ) => () => void ): any {
    const handleStoreChange = () => {
        // The store changed. Check if the snapshot changed since the last time we
        // read from the store.
        if ( checkIfSnapshotChanged( inst ) ) {
            // Force a re-render.
            forceStoreRerender( fiber );
        }
    };

    // Subscribe to the store and return a clean-up function.
    return subscribe( handleStoreChange );
}

export function mountSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
    const fiber = ReactFiberHooksCurrent.renderingFiber;
    const hook = mountWorkInProgressHook();
    let nextSnapshot;
    const _isHydrating = isHydrating();

    if ( _isHydrating ) {
        if ( getServerSnapshot === undefined ) {
            throw new Error( "Missing getServerSnapshot, which is required for " + "server-rendered content. Will revert to client rendering." );
        }

        nextSnapshot = getServerSnapshot();

        if ( __DEV__ ) {
            if ( ! ReactFiberHooksFlags.didWarnUncachedGetSnapshot ) {
                if ( nextSnapshot !== getServerSnapshot() ) {
                    console.error( "The result of getServerSnapshot should be cached to avoid an infinite loop" );
                    ReactFiberHooksFlags.didWarnUncachedGetSnapshot = true;
                }
            }
        }
    } else {
        nextSnapshot = getSnapshot();

        if ( __DEV__ ) {
            if ( ! ReactFiberHooksFlags.didWarnUncachedGetSnapshot ) {
                const cachedSnapshot = getSnapshot();

                if ( ! is( nextSnapshot, cachedSnapshot ) ) {
                    console.error( "The result of getSnapshot should be cached to avoid an infinite loop" );
                    ReactFiberHooksFlags.didWarnUncachedGetSnapshot = true;
                }
            }
        }

        // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.
        //
        // We won't do this if we're hydrating server-rendered content, because if
        // the content is stale, it's already visible anyway. Instead we'll patch
        // it up in a passive effect.
        const root: FiberRoot | null = getWorkInProgressRoot();

        if ( root === null ) {
            throw new Error( "Expected a work-in-progress root. This is a bug in React. Please file an issue." );
        }

        const rootRenderLanes = getWorkInProgressRootRenderLanes();

        if ( ! includesBlockingLane( root, rootRenderLanes ) ) {
            pushStoreConsistencyCheck( fiber, getSnapshot, nextSnapshot );
        }
    }

    // Read the current snapshot from the store on every render. This breaks the
    // normal rules of React, and only works because store updates are
    // always synchronous.
    hook.memoizedState = nextSnapshot;
    const inst: StoreInstance<T> = {
        value: nextSnapshot,
        getSnapshot
    };
    hook.queue = inst;
    // Schedule an effect to subscribe to the store.
    mountEffect( subscribeToStore.bind( null, fiber, inst, subscribe ), [ subscribe ] );
    // Schedule an effect to update the mutable instance fields. We will update
    // this whenever subscribe, getSnapshot, or value changes. Because there's no
    // clean-up function, and we track the deps correctly, we can call pushEffect
    // directly, without storing any additional state. For the same reason, we
    // don't need to set a static flag, either.
    fiber.flags |= FiberFlags.Passive;
    pushEffect( HookFlags.HasEffect | HookFlags.Passive, updateStoreInstance.bind( null, fiber, inst, nextSnapshot, getSnapshot ), createEffectInstance(), null );
    return nextSnapshot;
}

export function updateSyncExternalStore<T>( subscribe: ( arg0: () => void ) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T ): T {
    const fiber = ReactFiberHooksCurrent.renderingFiber;
    const hook = updateWorkInProgressHook();
    // Read the current snapshot from the store on every render. This breaks the
    // normal rules of React, and only works because store updates are
    // always synchronous.
    let nextSnapshot;

    const _isHydrating = isHydrating();

    if ( _isHydrating ) {
        // Needed for strict mode double render
        if ( getServerSnapshot === undefined ) {
            throw new Error( "Missing getServerSnapshot, which is required for " + "server-rendered content. Will revert to client rendering." );
        }

        nextSnapshot = getServerSnapshot();
    } else {
        nextSnapshot = getSnapshot();

        if ( __DEV__ ) {
            if ( ! ReactFiberHooksFlags.didWarnUncachedGetSnapshot ) {
                const cachedSnapshot = getSnapshot();

                if ( ! is( nextSnapshot, cachedSnapshot ) ) {
                    console.error( "The result of getSnapshot should be cached to avoid an infinite loop" );
                    ReactFiberHooksFlags.didWarnUncachedGetSnapshot = true;
                }
            }
        }
    }

    const prevSnapshot = ( ReactFiberHooksCurrent.hook || hook ).memoizedState;
    const snapshotChanged = ! is( prevSnapshot, nextSnapshot );

    if ( snapshotChanged ) {
        hook.memoizedState = nextSnapshot;
        markWorkInProgressReceivedUpdate();
    }

    const inst = hook.queue;
    updateEffect( subscribeToStore.bind( null, fiber, inst, subscribe ), [ subscribe ] );

    // Whenever getSnapshot or subscribe changes, we need to check in the
    // commit phase if there was an interleaved mutation. In concurrent mode
    // this can happen all the time, but even in synchronous mode, an earlier
    // effect may have mutated the store.
    if ( inst.getSnapshot !== getSnapshot || snapshotChanged || // Check if the subscribe function changed. We can save some memory by
        // checking whether we scheduled a subscription effect above.
        ReactFiberHooksCurrent.workInProgressHook !== null && ReactFiberHooksCurrent.workInProgressHook.memoizedState.tag & HookFlags.HasEffect ) {
        fiber.flags |= FiberFlags.Passive;
        pushEffect( HookFlags.HasEffect | HookFlags.Passive, updateStoreInstance.bind( null, fiber, inst, nextSnapshot, getSnapshot ), createEffectInstance(), null );
        // Unless we're rendering a blocking lane, schedule a consistency check.
        // Right before committing, we will walk the tree and check if any of the
        // stores were mutated.
        const root: FiberRoot | null = getWorkInProgressRoot();

        if ( root === null ) {
            throw new Error( "Expected a work-in-progress root. This is a bug in React. Please file an issue." );
        }

        if ( ! _isHydrating && ! includesBlockingLane( root, ReactFiberHooksCurrent.renderLanes ) ) {
            pushStoreConsistencyCheck( fiber, getSnapshot, nextSnapshot );
        }
    }

    return nextSnapshot;
}

