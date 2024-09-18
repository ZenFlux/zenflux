"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markStateUpdateScheduled = exports.markForceUpdateScheduled = exports.markRenderScheduled = exports.markRenderStopped = exports.markRenderYielded = exports.markRenderStarted = exports.markPassiveEffectsStopped = exports.markPassiveEffectsStarted = exports.markLayoutEffectsStopped = exports.markLayoutEffectsStarted = exports.markComponentSuspended = exports.markComponentErrored = exports.markComponentLayoutEffectUnmountStopped = exports.markComponentLayoutEffectUnmountStarted = exports.markComponentLayoutEffectMountStopped = exports.markComponentLayoutEffectMountStarted = exports.markComponentPassiveEffectUnmountStopped = exports.markComponentPassiveEffectUnmountStarted = exports.markComponentPassiveEffectMountStopped = exports.markComponentPassiveEffectMountStarted = exports.markComponentRenderStopped = exports.markComponentRenderStarted = exports.markCommitStopped = exports.markCommitStarted = exports.setIsStrictModeForDevtools = exports.onCommitUnmount = exports.onPostCommitRoot = exports.onCommitRoot = exports.onScheduleRoot = exports.injectInternals = exports.isDevToolsPresent = void 0;
var react_scheduler_1 = require("@zenflux/react-scheduler");
var console_patching_dev_1 = require("@zenflux/react-shared/src/console-patching-dev");
var console_with_stack_dev_1 = require("@zenflux/react-shared/src/console-with-stack-dev");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var rendererID = null;
var injectedHook = null;
var injectedProfilingHooks = null;
var hasLoggedError = false;
exports.isDevToolsPresent = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined";
function injectInternals(internals) {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined") {
        // No DevTools
        return false;
    }
    var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook.isDisabled) {
        // This isn't a real property on the hook, but it can be set to opt out
        // of DevTools integration and associated warnings and logs.
        // https://github.com/facebook/react/issues/3877
        return true;
    }
    if (!hook.supportsFiber) {
        if (__DEV__) {
            console.error("The installed version of React DevTools is too old and will not work " + "with the current version of React. Please update React DevTools. " + "https://reactjs.org/link/react-devtools");
        }
        // DevTools exists, even though it doesn't support Fiber.
        return true;
    }
    try {
        if (react_feature_flags_1.enableSchedulingProfiler) {
            // Conditionally inject these hooks only if Timeline profiler is supported by this build.
            // This gives DevTools a way to feature detect that isn't tied to version number
            // (since profiling and timeline are controlled by different feature flags).
            internals = __assign(__assign({}, internals), { getLaneLabelMap: getLaneLabelMap, injectProfilingHooks: injectProfilingHooks });
        }
        rendererID = hook.inject(internals);
        // We have successfully injected, so now it is safe to set up hooks.
        injectedHook = hook;
    }
    catch (err) {
        // Catch all errors because it is unsafe to throw during initialization.
        if (__DEV__) {
            console.error("React instrumentation encountered an error: %s.", err);
        }
    }
    if (hook.checkDCE) {
        // This is the real DevTools.
        return true;
    }
    else {
        // This is likely a hook installed by Fast Refresh runtime.
        return false;
    }
}
exports.injectInternals = injectInternals;
function onScheduleRoot(root, children) {
    if (__DEV__) {
        if (injectedHook && typeof injectedHook.onScheduleFiberRoot === "function") {
            try {
                injectedHook.onScheduleFiberRoot(rendererID, root, children);
            }
            catch (err) {
                if (__DEV__ && !hasLoggedError) {
                    hasLoggedError = true;
                    console.error("React instrumentation encountered an error: %s", err);
                }
            }
        }
    }
}
exports.onScheduleRoot = onScheduleRoot;
function onCommitRoot(root, eventPriority) {
    if (injectedHook && typeof injectedHook.onCommitFiberRoot === "function") {
        try {
            var didError = (root.current.flags & fiber_flags_1.FiberFlags.DidCapture) === fiber_flags_1.FiberFlags.DidCapture;
            if (react_feature_flags_1.enableProfilerTimer) {
                var schedulerPriority = void 0;
                switch (eventPriority) {
                    case react_event_priorities_1.DiscreteEventPriority:
                        schedulerPriority = react_scheduler_1.unstable_ImmediatePriority;
                        break;
                    case react_event_priorities_1.ContinuousEventPriority:
                        schedulerPriority = react_scheduler_1.unstable_UserBlockingPriority;
                        break;
                    case react_event_priorities_1.DefaultEventPriority:
                        schedulerPriority = react_scheduler_1.unstable_NormalPriority;
                        break;
                    case react_event_priorities_1.IdleEventPriority:
                        schedulerPriority = react_scheduler_1.unstable_IdlePriority;
                        break;
                    default:
                        schedulerPriority = react_scheduler_1.unstable_NormalPriority;
                        break;
                }
                injectedHook.onCommitFiberRoot(rendererID, root, schedulerPriority, didError);
            }
            else {
                injectedHook.onCommitFiberRoot(rendererID, root, undefined, didError);
            }
        }
        catch (err) {
            if (__DEV__) {
                if (!hasLoggedError) {
                    hasLoggedError = true;
                    console.error("React instrumentation encountered an error: %s", err);
                }
            }
        }
    }
}
exports.onCommitRoot = onCommitRoot;
function onPostCommitRoot(root) {
    if (injectedHook && typeof injectedHook.onPostCommitFiberRoot === "function") {
        try {
            injectedHook.onPostCommitFiberRoot(rendererID, root);
        }
        catch (err) {
            if (__DEV__) {
                if (!hasLoggedError) {
                    hasLoggedError = true;
                    console.error("React instrumentation encountered an error: %s", err);
                }
            }
        }
    }
}
exports.onPostCommitRoot = onPostCommitRoot;
function onCommitUnmount(fiber) {
    if (injectedHook && typeof injectedHook.onCommitFiberUnmount === "function") {
        try {
            injectedHook.onCommitFiberUnmount(rendererID, fiber);
        }
        catch (err) {
            if (__DEV__) {
                if (!hasLoggedError) {
                    hasLoggedError = true;
                    console.error("React instrumentation encountered an error: %s", err);
                }
            }
        }
    }
}
exports.onCommitUnmount = onCommitUnmount;
function setIsStrictModeForDevtools(newIsStrictMode) {
    if (react_feature_flags_1.consoleManagedByDevToolsDuringStrictMode && react_scheduler_1.isTestEnvironment) {
        // if ( typeof log === "function" ) {
        // We're in a test because Scheduler.log only exists
        // in SchedulerMock. To reduce the noise in strict mode tests,
        // suppress warnings and disable scheduler yielding during the double render
        (0, react_scheduler_1.unstable_setDisableYieldValue)(newIsStrictMode);
        (0, console_with_stack_dev_1.setSuppressWarning)(newIsStrictMode);
        // }
        if (injectedHook && typeof injectedHook.setStrictMode === "function") {
            try {
                injectedHook.setStrictMode(rendererID, newIsStrictMode);
            }
            catch (err) {
                if (__DEV__) {
                    if (!hasLoggedError) {
                        hasLoggedError = true;
                        console.error("React instrumentation encountered an error: %s", err);
                    }
                }
            }
        }
    }
    else {
        if (newIsStrictMode) {
            (0, console_patching_dev_1.disableLogs)();
        }
        else {
            (0, console_patching_dev_1.reenableLogs)();
        }
    }
}
exports.setIsStrictModeForDevtools = setIsStrictModeForDevtools;
// Profiler API hooks
function injectProfilingHooks(profilingHooks) {
    injectedProfilingHooks = profilingHooks;
}
function getLaneLabelMap() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        var map = new Map();
        var lane = 1;
        for (var index = 0; index < fiber_lane_constants_1.TotalLanes; index++) {
            var label = (0, fiber_lane_constants_1.getLabelForLane)(lane);
            map.set(lane, label);
            lane *= 2;
        }
        return map;
    }
    else {
        return null;
    }
}
function markCommitStarted(lanes) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStarted === "function") {
            injectedProfilingHooks.markCommitStarted(lanes);
        }
    }
}
exports.markCommitStarted = markCommitStarted;
function markCommitStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStopped === "function") {
            injectedProfilingHooks.markCommitStopped();
        }
    }
}
exports.markCommitStopped = markCommitStopped;
function markComponentRenderStarted(fiber) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentRenderStarted === "function") {
            injectedProfilingHooks.markComponentRenderStarted(fiber);
        }
    }
}
exports.markComponentRenderStarted = markComponentRenderStarted;
function markComponentRenderStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentRenderStopped === "function") {
            injectedProfilingHooks.markComponentRenderStopped();
        }
    }
}
exports.markComponentRenderStopped = markComponentRenderStopped;
function markComponentPassiveEffectMountStarted(fiber) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStarted === "function") {
            injectedProfilingHooks.markComponentPassiveEffectMountStarted(fiber);
        }
    }
}
exports.markComponentPassiveEffectMountStarted = markComponentPassiveEffectMountStarted;
function markComponentPassiveEffectMountStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStopped === "function") {
            injectedProfilingHooks.markComponentPassiveEffectMountStopped();
        }
    }
}
exports.markComponentPassiveEffectMountStopped = markComponentPassiveEffectMountStopped;
function markComponentPassiveEffectUnmountStarted(fiber) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStarted === "function") {
            injectedProfilingHooks.markComponentPassiveEffectUnmountStarted(fiber);
        }
    }
}
exports.markComponentPassiveEffectUnmountStarted = markComponentPassiveEffectUnmountStarted;
function markComponentPassiveEffectUnmountStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStopped === "function") {
            injectedProfilingHooks.markComponentPassiveEffectUnmountStopped();
        }
    }
}
exports.markComponentPassiveEffectUnmountStopped = markComponentPassiveEffectUnmountStopped;
function markComponentLayoutEffectMountStarted(fiber) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStarted === "function") {
            injectedProfilingHooks.markComponentLayoutEffectMountStarted(fiber);
        }
    }
}
exports.markComponentLayoutEffectMountStarted = markComponentLayoutEffectMountStarted;
function markComponentLayoutEffectMountStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStopped === "function") {
            injectedProfilingHooks.markComponentLayoutEffectMountStopped();
        }
    }
}
exports.markComponentLayoutEffectMountStopped = markComponentLayoutEffectMountStopped;
function markComponentLayoutEffectUnmountStarted(fiber) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStarted === "function") {
            injectedProfilingHooks.markComponentLayoutEffectUnmountStarted(fiber);
        }
    }
}
exports.markComponentLayoutEffectUnmountStarted = markComponentLayoutEffectUnmountStarted;
function markComponentLayoutEffectUnmountStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStopped === "function") {
            injectedProfilingHooks.markComponentLayoutEffectUnmountStopped();
        }
    }
}
exports.markComponentLayoutEffectUnmountStopped = markComponentLayoutEffectUnmountStopped;
function markComponentErrored(fiber, thrownValue, lanes) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentErrored === "function") {
            injectedProfilingHooks.markComponentErrored(fiber, thrownValue, lanes);
        }
    }
}
exports.markComponentErrored = markComponentErrored;
function markComponentSuspended(fiber, wakeable, lanes) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentSuspended === "function") {
            injectedProfilingHooks.markComponentSuspended(fiber, wakeable, lanes);
        }
    }
}
exports.markComponentSuspended = markComponentSuspended;
function markLayoutEffectsStarted(lanes) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStarted === "function") {
            injectedProfilingHooks.markLayoutEffectsStarted(lanes);
        }
    }
}
exports.markLayoutEffectsStarted = markLayoutEffectsStarted;
function markLayoutEffectsStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStopped === "function") {
            injectedProfilingHooks.markLayoutEffectsStopped();
        }
    }
}
exports.markLayoutEffectsStopped = markLayoutEffectsStopped;
function markPassiveEffectsStarted(lanes) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStarted === "function") {
            injectedProfilingHooks.markPassiveEffectsStarted(lanes);
        }
    }
}
exports.markPassiveEffectsStarted = markPassiveEffectsStarted;
function markPassiveEffectsStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStopped === "function") {
            injectedProfilingHooks.markPassiveEffectsStopped();
        }
    }
}
exports.markPassiveEffectsStopped = markPassiveEffectsStopped;
function markRenderStarted(lanes) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStarted === "function") {
            injectedProfilingHooks.markRenderStarted(lanes);
        }
    }
}
exports.markRenderStarted = markRenderStarted;
function markRenderYielded() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderYielded === "function") {
            injectedProfilingHooks.markRenderYielded();
        }
    }
}
exports.markRenderYielded = markRenderYielded;
function markRenderStopped() {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStopped === "function") {
            injectedProfilingHooks.markRenderStopped();
        }
    }
}
exports.markRenderStopped = markRenderStopped;
function markRenderScheduled(lane) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderScheduled === "function") {
            injectedProfilingHooks.markRenderScheduled(lane);
        }
    }
}
exports.markRenderScheduled = markRenderScheduled;
function markForceUpdateScheduled(fiber, lane) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markForceUpdateScheduled === "function") {
            injectedProfilingHooks.markForceUpdateScheduled(fiber, lane);
        }
    }
}
exports.markForceUpdateScheduled = markForceUpdateScheduled;
function markStateUpdateScheduled(fiber, lane) {
    if (react_feature_flags_1.enableSchedulingProfiler) {
        if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markStateUpdateScheduled === "function") {
            injectedProfilingHooks.markStateUpdateScheduled(fiber, lane);
        }
    }
}
exports.markStateUpdateScheduled = markStateUpdateScheduled;
