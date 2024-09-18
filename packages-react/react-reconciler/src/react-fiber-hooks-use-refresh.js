"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRefresh = exports.mountRefresh = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_work_in_progress_request_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-request-lane");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
function mountRefresh() {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    var refresh = hook.memoizedState = refreshCache.bind(null, react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber);
    return refresh;
}
exports.mountRefresh = mountRefresh;
function updateRefresh() {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    return hook.memoizedState;
}
exports.updateRefresh = updateRefresh;
function refreshCache(fiber, seedKey, seedValue) {
    if (!react_feature_flags_1.enableCache) {
        return;
    }
    // TODO: Does Cache work in legacy mode? Should decide and write a test.
    // TODO: Consider warning if the refresh is at discrete priority, or if we
    // otherwise suspect that it wasn't batched properly.
    var provider = fiber.return;
    while (provider !== null) {
        switch (provider.tag) {
            case work_tags_1.WorkTag.CacheComponent:
            case work_tags_1.WorkTag.HostRoot: {
                // Schedule an update on the cache boundary to trigger a refresh.
                var lane = (0, react_fiber_work_in_progress_request_lane_1.requestUpdateLane)(provider);
                var refreshUpdate = (0, react_fiber_class_update_queue_1.createUpdate)(lane);
                var root = (0, react_fiber_class_update_queue_1.enqueueUpdate)(provider, refreshUpdate, lane);
                if (root !== null) {
                    (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, provider, lane);
                    (0, react_fiber_class_update_queue_1.entangleTransitions)(root, provider, lane);
                }
                // TODO: If a refresh never commits, the new cache created here must be
                // released. A simple case is start refreshing a cache boundary, but then
                // unmount that boundary before the refresh completes.
                var seededCache = (0, react_fiber_cache_component_1.createCache)();
                if (seedKey !== null && seedKey !== undefined && root !== null) {
                    if (react_feature_flags_1.enableLegacyCache) {
                        // Seed the cache with the value passed by the caller. This could be
                        // from a server mutation, or it could be a streaming response.
                        seededCache.data.set(seedKey, seedValue);
                    }
                    else {
                        if (__DEV__) {
                            console.error("The seed argument is not enabled outside experimental channels.");
                        }
                    }
                }
                var payload = {
                    cache: seededCache
                };
                refreshUpdate.payload = payload;
                return;
            }
        }
        provider = provider.return;
    } // TODO: Warn if unmounted?
}
