"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwindInterruptedWork = exports.unwindWork = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_fiber_tracing_marker_component_1 = require("@zenflux/react-reconciler/src/react-fiber-tracing-marker-component");
var react_fiber_host_context_1 = require("@zenflux/react-reconciler/src/react-fiber-host-context");
var react_fiber_suspense_context_1 = require("@zenflux/react-reconciler/src/react-fiber-suspense-context");
var react_fiber_hidden_context_1 = require("@zenflux/react-reconciler/src/react-fiber-hidden-context");
var react_fiber_hydration_context_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_fiber_tree_context_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-context");
var react_fiber_transition_1 = require("@zenflux/react-reconciler/src/react-fiber-transition");
var react_fiber_context_1 = require("@zenflux/react-reconciler/src/react-fiber-context");
var react_fiber_cache_component_provider_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component-provider");
function unwindWork(current, workInProgress, renderLanes) {
    // Note: This intentionally doesn't check if we're hydrating because comparing
    // to the current tree provider fiber is just as fast and less error-prone.
    // Ideally we would have a special version of the work loop only
    // for hydration.
    (0, react_fiber_tree_context_1.popTreeContext)(workInProgress);
    switch (workInProgress.tag) {
        case work_tags_1.WorkTag.ClassComponent: {
            var Component = workInProgress.type;
            if ((0, react_fiber_context_1.isContextProvider)(Component)) {
                (0, react_fiber_context_1.popContext)(workInProgress);
            }
            var flags = workInProgress.flags;
            if (flags & fiber_flags_1.FiberFlags.ShouldCapture) {
                workInProgress.flags = flags & ~fiber_flags_1.FiberFlags.ShouldCapture | fiber_flags_1.FiberFlags.DidCapture;
                if (react_feature_flags_1.enableProfilerTimer && (workInProgress.mode & type_of_mode_1.TypeOfMode.ProfileMode) !== type_of_mode_1.TypeOfMode.NoMode) {
                    (0, react_profile_timer_1.transferActualDuration)(workInProgress);
                }
                return workInProgress;
            }
            return null;
        }
        case work_tags_1.WorkTag.HostRoot: {
            var root = workInProgress.stateNode;
            if (react_feature_flags_1.enableCache) {
                var cache = workInProgress.memoizedState.cache;
                (0, react_fiber_cache_component_provider_1.popCacheProvider)(workInProgress, cache);
            }
            if (react_feature_flags_1.enableTransitionTracing) {
                (0, react_fiber_tracing_marker_component_1.popRootMarkerInstance)(workInProgress);
            }
            (0, react_fiber_transition_1.popRootTransition)(workInProgress, root, renderLanes);
            (0, react_fiber_host_context_1.popHostContainer)(workInProgress);
            (0, react_fiber_context_1.popTopLevelContextObject)(workInProgress);
            var flags = workInProgress.flags;
            if ((flags & fiber_flags_1.FiberFlags.ShouldCapture) !== fiber_flags_1.FiberFlags.NoFlags && (flags & fiber_flags_1.FiberFlags.DidCapture) === fiber_flags_1.FiberFlags.NoFlags) {
                // There was an error during render that wasn't captured by a suspense
                // boundary. Do a second pass on the root to unmount the children.
                workInProgress.flags = flags & ~fiber_flags_1.FiberFlags.ShouldCapture | fiber_flags_1.FiberFlags.DidCapture;
                return workInProgress;
            }
            // We unwound to the root without completing it. Exit.
            return null;
        }
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent: {
            // TODO: popHydrationState
            (0, react_fiber_host_context_1.popHostContext)(workInProgress);
            return null;
        }
        case work_tags_1.WorkTag.SuspenseComponent: {
            (0, react_fiber_suspense_context_1.popSuspenseHandler)(workInProgress);
            var suspenseState = workInProgress.memoizedState;
            if (suspenseState !== null && suspenseState.dehydrated !== null) {
                if (workInProgress.alternate === null) {
                    throw new Error("Threw in newly mounted dehydrated component. This is likely a bug in " + "React. Please file an issue.");
                }
                (0, react_fiber_hydration_context_1.resetHydrationState)();
            }
            var flags = workInProgress.flags;
            if (flags & fiber_flags_1.FiberFlags.ShouldCapture) {
                workInProgress.flags = flags & ~fiber_flags_1.FiberFlags.ShouldCapture | fiber_flags_1.FiberFlags.DidCapture;
                // Captured a suspense effect. Re-render the boundary.
                if (react_feature_flags_1.enableProfilerTimer && (workInProgress.mode & type_of_mode_1.TypeOfMode.ProfileMode) !== type_of_mode_1.TypeOfMode.NoMode) {
                    (0, react_profile_timer_1.transferActualDuration)(workInProgress);
                }
                return workInProgress;
            }
            return null;
        }
        case work_tags_1.WorkTag.SuspenseListComponent: {
            (0, react_fiber_suspense_context_1.popSuspenseListContext)(workInProgress);
            // SuspenseList doesn't actually catch anything. It should've been
            // caught by a nested boundary. If not, it should bubble through.
            return null;
        }
        case work_tags_1.WorkTag.HostPortal:
            (0, react_fiber_host_context_1.popHostContainer)(workInProgress);
            return null;
        case work_tags_1.WorkTag.ContextProvider:
            var context = workInProgress.type._context;
            (0, react_fiber_new_context_1.popProvider)(context, workInProgress);
            return null;
        case work_tags_1.WorkTag.OffscreenComponent:
        case work_tags_1.WorkTag.LegacyHiddenComponent: {
            (0, react_fiber_suspense_context_1.popSuspenseHandler)(workInProgress);
            (0, react_fiber_hidden_context_1.popHiddenContext)(workInProgress);
            (0, react_fiber_transition_1.popTransition)(workInProgress, current);
            var flags = workInProgress.flags;
            if (flags & fiber_flags_1.FiberFlags.ShouldCapture) {
                workInProgress.flags = flags & ~fiber_flags_1.FiberFlags.ShouldCapture | fiber_flags_1.FiberFlags.DidCapture;
                // Captured a suspense effect. Re-render the boundary.
                if (react_feature_flags_1.enableProfilerTimer && (workInProgress.mode & type_of_mode_1.TypeOfMode.ProfileMode) !== type_of_mode_1.TypeOfMode.NoMode) {
                    (0, react_profile_timer_1.transferActualDuration)(workInProgress);
                }
                return workInProgress;
            }
            return null;
        }
        case work_tags_1.WorkTag.CacheComponent:
            if (react_feature_flags_1.enableCache) {
                var cache = workInProgress.memoizedState.cache;
                (0, react_fiber_cache_component_provider_1.popCacheProvider)(workInProgress, cache);
            }
            return null;
        case work_tags_1.WorkTag.TracingMarkerComponent:
            if (react_feature_flags_1.enableTransitionTracing) {
                if (workInProgress.stateNode !== null) {
                    (0, react_fiber_tracing_marker_component_1.popMarkerInstance)(workInProgress);
                }
            }
            return null;
        default:
            return null;
    }
}
exports.unwindWork = unwindWork;
function unwindInterruptedWork(current, interruptedWork, renderLanes) {
    // Note: This intentionally doesn't check if we're hydrating because comparing
    // to the current tree provider fiber is just as fast and less error-prone.
    // Ideally we would have a special version of the work loop only
    // for hydration.
    (0, react_fiber_tree_context_1.popTreeContext)(interruptedWork);
    switch (interruptedWork.tag) {
        case work_tags_1.WorkTag.ClassComponent: {
            var childContextTypes = interruptedWork.type.childContextTypes;
            if (childContextTypes !== null && childContextTypes !== undefined) {
                (0, react_fiber_context_1.popContext)(interruptedWork);
            }
            break;
        }
        case work_tags_1.WorkTag.HostRoot: {
            var root = interruptedWork.stateNode;
            if (react_feature_flags_1.enableCache) {
                var cache = interruptedWork.memoizedState.cache;
                (0, react_fiber_cache_component_provider_1.popCacheProvider)(interruptedWork, cache);
            }
            if (react_feature_flags_1.enableTransitionTracing) {
                (0, react_fiber_tracing_marker_component_1.popRootMarkerInstance)(interruptedWork);
            }
            (0, react_fiber_transition_1.popRootTransition)(interruptedWork, root, renderLanes);
            (0, react_fiber_host_context_1.popHostContainer)(interruptedWork);
            (0, react_fiber_context_1.popTopLevelContextObject)(interruptedWork);
            break;
        }
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent: {
            (0, react_fiber_host_context_1.popHostContext)(interruptedWork);
            break;
        }
        case work_tags_1.WorkTag.HostPortal:
            (0, react_fiber_host_context_1.popHostContainer)(interruptedWork);
            break;
        case work_tags_1.WorkTag.SuspenseComponent:
            (0, react_fiber_suspense_context_1.popSuspenseHandler)(interruptedWork);
            break;
        case work_tags_1.WorkTag.SuspenseListComponent:
            (0, react_fiber_suspense_context_1.popSuspenseListContext)(interruptedWork);
            break;
        case work_tags_1.WorkTag.ContextProvider:
            var context = interruptedWork.type._context;
            (0, react_fiber_new_context_1.popProvider)(context, interruptedWork);
            break;
        case work_tags_1.WorkTag.OffscreenComponent:
        case work_tags_1.WorkTag.LegacyHiddenComponent:
            (0, react_fiber_suspense_context_1.popSuspenseHandler)(interruptedWork);
            (0, react_fiber_hidden_context_1.popHiddenContext)(interruptedWork);
            (0, react_fiber_transition_1.popTransition)(interruptedWork, current);
            break;
        case work_tags_1.WorkTag.CacheComponent:
            if (react_feature_flags_1.enableCache) {
                var cache = interruptedWork.memoizedState.cache;
                (0, react_fiber_cache_component_provider_1.popCacheProvider)(interruptedWork, cache);
            }
            break;
        case work_tags_1.WorkTag.TracingMarkerComponent:
            if (react_feature_flags_1.enableTransitionTracing) {
                var instance = interruptedWork.stateNode;
                if (instance !== null) {
                    (0, react_fiber_tracing_marker_component_1.popMarkerInstance)(interruptedWork);
                }
            }
            break;
        default:
            break;
    }
}
exports.unwindInterruptedWork = unwindInterruptedWork;
