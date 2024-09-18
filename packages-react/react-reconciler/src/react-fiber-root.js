"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiberRoot = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_reconciler_constants_1 = require("@zenflux/react-reconciler/src/react-reconciler-constants");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var noTimeout = globalThis.__RECONCILER__CONFIG__.noTimeout;
function FiberRootNode(containerInfo, // $FlowFixMe[missing-local-annot]
tag, hydrate, identifierPrefix, onRecoverableError, formState) {
    // @ts-ignore
    var self = this;
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
    self.callbackPriority = fiber_lane_constants_1.NoLane;
    self.expirationTimes = (0, react_fiber_lane_1.createLaneMap)(react_fiber_lane_1.NoTimestamp);
    self.pendingLanes = fiber_lane_constants_1.NoLanes;
    self.suspendedLanes = fiber_lane_constants_1.NoLanes;
    self.pingedLanes = fiber_lane_constants_1.NoLanes;
    self.expiredLanes = fiber_lane_constants_1.NoLanes;
    self.finishedLanes = fiber_lane_constants_1.NoLanes;
    self.errorRecoveryDisabledLanes = fiber_lane_constants_1.NoLanes;
    self.shellSuspendCounter = 0;
    self.entangledLanes = fiber_lane_constants_1.NoLanes;
    self.entanglements = (0, react_fiber_lane_1.createLaneMap)(fiber_lane_constants_1.NoLanes);
    self.hiddenUpdates = (0, react_fiber_lane_1.createLaneMap)(null);
    self.identifierPrefix = identifierPrefix;
    self.onRecoverableError = onRecoverableError;
    if (react_feature_flags_1.enableCache) {
        self.pooledCache = null;
        self.pooledCacheLanes = fiber_lane_constants_1.NoLanes;
    }
    if (react_feature_flags_1.enableSuspenseCallback) {
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
    if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerCommitHooks) {
        self.effectDuration = 0;
        self.passiveEffectDuration = 0;
    }
    // TODO: Something is wrong here
    if (react_feature_flags_1.enableUpdaterTracking) {
        self.memoizedUpdaters = new Set();
        var pendingUpdatersLaneMap = self.pendingUpdatersLaneMap = [];
        for (var i = 0; i < fiber_lane_constants_1.TotalLanes; i++) {
            // @ts-ignore
            pendingUpdatersLaneMap.push(new Set());
        }
    }
    if (__DEV__) {
        switch (tag) {
            case react_reconciler_constants_1.ConcurrentRoot:
                self._debugRootType = hydrate ? "hydrateRoot()" : "createRoot()";
                break;
            case react_reconciler_constants_1.LegacyRoot:
                self._debugRootType = hydrate ? "hydrate()" : "render()";
                break;
        }
    }
}
function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, // TODO: We have several of these arguments that are conceptually part of the
// host config, but because they are passed in at runtime, we have to thread
// them through the root constructor. Perhaps we should put them all into a
// single type, like a DynamicHostConfig that is defined by the renderer.
identifierPrefix, onRecoverableError, transitionCallbacks, formState) {
    // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
    // @ts-ignore
    var root = new FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onRecoverableError, formState);
    if (react_feature_flags_1.enableSuspenseCallback) {
        root.hydrationCallbacks = hydrationCallbacks;
    }
    if (react_feature_flags_1.enableTransitionTracing) {
        root.transitionCallbacks = transitionCallbacks;
    }
    // Cyclic construction. This cheats the type system right now because
    // stateNode is any.
    var uninitializedFiber = (0, react_fiber_1.createHostRootFiber)(tag, isStrictMode, concurrentUpdatesByDefaultOverride);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    if (react_feature_flags_1.enableCache) {
        var initialCache = (0, react_fiber_cache_component_1.createCache)();
        (0, react_fiber_cache_component_1.retainCache)(initialCache);
        // The pooledCache is a fresh cache instance that is used temporarily
        // for newly mounted boundaries during a render. In general, the
        // pooledCache is always cleared from the root at the end of a render:
        // it is either released when render commits, or moved to an Offscreen
        // component if rendering suspends. Because the lifetime of the pooled
        // cache is distinct from the main memoizedState.cache, it must be
        // retained separately.
        root.pooledCache = initialCache;
        (0, react_fiber_cache_component_1.retainCache)(initialCache);
        var initialState = {
            element: initialChildren,
            isDehydrated: hydrate,
            cache: initialCache
        };
        uninitializedFiber.memoizedState = initialState;
    }
    else {
        var initialState = {
            element: initialChildren,
            isDehydrated: hydrate,
            cache: null // not enabled yet
        };
        uninitializedFiber.memoizedState = initialState;
    }
    (0, react_fiber_class_update_queue_1.initializeUpdateQueue)(uninitializedFiber);
    return root;
}
exports.createFiberRoot = createFiberRoot;
