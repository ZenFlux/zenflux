import {
    enableCache,
    enableProfilerCommitHooks,
    enableProfilerTimer,
    enableSuspenseCallback,
    enableTransitionTracing,
    enableUpdaterTracking,
} from "@zenflux/react-shared/src/react-feature-flags";

import { NoLane, NoLanes, TotalLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { ConcurrentRoot, LegacyRoot } from "@zenflux/react-reconciler/src/react-reconciler-constants";

import { createCache, retainCache } from "@zenflux/react-reconciler/src/react-fiber-cache-component";

import { createHostRootFiber } from "@zenflux/react-reconciler/src/react-fiber";
import { createLaneMap, NoTimestamp } from "@zenflux/react-reconciler/src/react-fiber-lane";
import { initializeUpdateQueue } from "@zenflux/react-reconciler/src/react-fiber-class-update-queue";

import type { RootTag } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import type { Container } from "@zenflux/react-reconciler/src/react-fiber-config";
import type { ReactFormState, ReactNodeList } from "@zenflux/react-shared/src/react-types";

import type {
    Cache,
    FiberRoot,
    SuspenseHydrationCallbacks,
    TransitionTracingCallbacks
} from "@zenflux/react-shared/src/react-internal-types";

const {
    noTimeout
} = globalThis.__RECONCILER__CONFIG__;

export type RootState = {
    element: any;
    isDehydrated: boolean;
    cache: Cache;
};

function FiberRootNode( this: any, containerInfo: any, // $FlowFixMe[missing-local-annot]
                        tag: number, hydrate: any, identifierPrefix: any, onRecoverableError: any, formState: ReactFormState<any, any> | null ) {
    // @ts-ignore
    const self: any = this;

    self.tag = tag;
    self.containerInfo = containerInfo;
    self.pendingChildren = null;
    self.current = null;
    self.pingCache = null;
    self.finishedWork = null;
    self.timeoutHandle = noTimeout;
    self.cancelPendingCommit = null;
    self.context = null;
    self.pendingContext = null;
    self.next = null;
    self.callbackNode = null;
    self.callbackPriority = NoLane;
    self.expirationTimes = createLaneMap( NoTimestamp );
    self.pendingLanes = NoLanes;
    self.suspendedLanes = NoLanes;
    self.pingedLanes = NoLanes;
    self.expiredLanes = NoLanes;
    self.finishedLanes = NoLanes;
    self.errorRecoveryDisabledLanes = NoLanes;
    self.shellSuspendCounter = 0;
    self.entangledLanes = NoLanes;
    self.entanglements = createLaneMap( NoLanes );
    self.hiddenUpdates = createLaneMap( null );
    self.identifierPrefix = identifierPrefix;
    self.onRecoverableError = onRecoverableError;

    if ( enableCache ) {
        self.pooledCache = null;
        self.pooledCacheLanes = NoLanes;
    }

    if ( enableSuspenseCallback ) {
        self.hydrationCallbacks = null;
    }

    self.formState = formState;
    self.incompleteTransitions = new Map();

    // TODO: Something is wrong here
    // if ( enableTransitionTracing ) {
    //     self.transitionCallbacks = null;
    //     const transitionLanesMap: any[] = self.transitionLanes = [];
    //
    //     for ( let i = 0 ; i < TotalLanes ; i++ ) {
    //         transitionLanesMap.push( null );
    //     }
    // }

    if ( enableProfilerTimer && enableProfilerCommitHooks ) {
        self.effectDuration = 0;
        self.passiveEffectDuration = 0;
    }

    // TODO: Something is wrong here
    if ( enableUpdaterTracking ) {
        self.memoizedUpdaters = new Set();
        const pendingUpdatersLaneMap = self.pendingUpdatersLaneMap = [];

        for ( let i = 0 ; i < TotalLanes ; i++ ) {
            // @ts-ignore
            pendingUpdatersLaneMap.push( new Set() );
        }
    }

    if ( __DEV__ ) {
        switch ( tag ) {
            case ConcurrentRoot:
                self._debugRootType = hydrate ? "hydrateRoot()" : "createRoot()";
                break;

            case LegacyRoot:
                self._debugRootType = hydrate ? "hydrate()" : "render()";
                break;
        }
    }
}

export function createFiberRoot<TContainer = Container>(
    containerInfo: TContainer,
    tag: RootTag,
    hydrate: boolean,
    initialChildren: ReactNodeList,
    hydrationCallbacks: null | SuspenseHydrationCallbacks,
    isStrictMode: boolean,
    concurrentUpdatesByDefaultOverride: null | boolean, // TODO: We have several of these arguments that are conceptually part of the
    // host config, but because they are passed in at runtime, we have to thread
    // them through the root constructor. Perhaps we should put them all into a
    // single type, like a DynamicHostConfig that is defined by the renderer.
    identifierPrefix: string,
    onRecoverableError: null | ( ( error: Error ) => void ),
    transitionCallbacks: null | TransitionTracingCallbacks,
    formState: ReactFormState<any, any> | null ): FiberRoot {
    // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
    // @ts-ignore
    const root: FiberRoot = ( new FiberRootNode( containerInfo, tag, hydrate, identifierPrefix, onRecoverableError, formState ) as any );

    if ( enableSuspenseCallback ) {
        root.hydrationCallbacks = hydrationCallbacks;
    }

    if ( enableTransitionTracing ) {
        root.transitionCallbacks = transitionCallbacks;
    }

    // Cyclic construction. This cheats the type system right now because
    // stateNode is any.
    const uninitializedFiber = createHostRootFiber( tag, isStrictMode, concurrentUpdatesByDefaultOverride );
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;

    if ( enableCache ) {
        const initialCache = createCache();
        retainCache( initialCache );
        // The pooledCache is a fresh cache instance that is used temporarily
        // for newly mounted boundaries during a render. In general, the
        // pooledCache is always cleared from the root at the end of a render:
        // it is either released when render commits, or moved to an Offscreen
        // component if rendering suspends. Because the lifetime of the pooled
        // cache is distinct from the main memoizedState.cache, it must be
        // retained separately.
        root.pooledCache = initialCache;
        retainCache( initialCache );
        const initialState: RootState = {
            element: initialChildren,
            isDehydrated: hydrate,
            cache: initialCache
        };
        uninitializedFiber.memoizedState = initialState;
    } else {
        const initialState: RootState = {
            element: initialChildren,
            isDehydrated: hydrate,
            cache: ( null as any ) // not enabled yet

        };
        uninitializedFiber.memoizedState = initialState;
    }

    initializeUpdateQueue( uninitializedFiber );
    return root;
}
