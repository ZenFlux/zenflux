"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactFeatureFlags.js
 */
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
exports.debugRenderPhaseSideEffectsForStrictMode = exports.enableSchedulingProfiler = exports.disableTextareaChildren = exports.enableCustomElementPropertySupport = exports.enableFilterEmptyStringAttributesDOM = exports.disableIEWorkarounds = exports.disableInputAttributeSyncing = exports.enableTrustedTypesIntegration = exports.disableJavaScriptURLs = exports.disableCommentsAsDOMContainers = exports.allowConcurrentByDefault = exports.enableUnifiedSyncLane = exports.forceConcurrentByDefaultForTesting = exports.enableUseRefAccessWarning = exports.disableLegacyContext = exports.disableModulePatternComponents = exports.createRootStrictEffectsByDefault = exports.enableUseDeferredValueInitialArg = exports.passChildrenWhenCloningPersistedNodes = exports.useMicrotasksForSchedulingInFabric = exports.alwaysThrottleRetries = exports.enableFizzExternalRuntime = exports.enableUseEffectEventHook = exports.enableUseMemoCacheHook = exports.enableFloat = exports.enableHostSingletons = exports.enableCPUSuspense = exports.enableSuspenseAvoidThisFallbackFizz = exports.enableSuspenseAvoidThisFallback = exports.enableLegacyHidden = exports.enableLazyContextPropagation = exports.enableTransitionTracing = exports.enablePostpone = exports.enableTaint = exports.enableBinaryFlight = exports.enableFetchInstrumentation = exports.enableCacheElement = exports.enableLegacyCache = exports.enableCache = exports.enableLegacyFBSupport = exports.enableCreateEventHandleAPI = exports.enableScopeAPI = exports.enableSuspenseCallback = exports.enableDeferRootSchedulingToMicrotask = exports.disableSchedulerTimeoutInWorkLoop = exports.enableSchedulerDebugging = exports.enableAsyncActions = exports.enableFormActions = exports.enableClientRenderFallbackOnTextMismatch = exports.enableComponentStackLocations = void 0;
exports.enableDO_NOT_USE_disableStrictPassiveEffect = exports.useModernStrictMode = exports.consoleManagedByDevToolsDuringStrictMode = exports.enableProfilerNestedUpdateScheduledHook = exports.enableGetInspectorDataForInstanceInProduction = exports.enableServerContext = exports.enableUpdaterTracking = exports.enableDebugTracing = exports.enableProfilerNestedUpdatePhase = exports.enableProfilerCommitHooks = exports.enableProfilerTimer = exports.replayFailedUnitOfWorkWithInvokeGuardedCallback = void 0;
// Added by ZenFlux
global.__REACT_FEATURE_FLAGS__ = __assign({ enableComponentStackLocations: true, enableClientRenderFallbackOnTextMismatch: true, enableFormActions: true, enableAsyncActions: true, enableSchedulerDebugging: false, disableSchedulerTimeoutInWorkLoop: false, enableDeferRootSchedulingToMicrotask: true, enableSuspenseCallback: false, enableScopeAPI: false, enableCreateEventHandleAPI: false, enableLegacyFBSupport: false, enableCache: true, enableLegacyCache: __EXPERIMENTAL__, enableCacheElement: __EXPERIMENTAL__, enableFetchInstrumentation: true, enableBinaryFlight: __EXPERIMENTAL__, enableTaint: __EXPERIMENTAL__, enablePostpone: __EXPERIMENTAL__, enableTransitionTracing: false, enableLazyContextPropagation: false, enableLegacyHidden: false, enableSuspenseAvoidThisFallback: false, enableSuspenseAvoidThisFallbackFizz: false, enableCPUSuspense: __EXPERIMENTAL__, enableHostSingletons: true, enableFloat: true, enableUseMemoCacheHook: __EXPERIMENTAL__, enableUseEffectEventHook: __EXPERIMENTAL__, enableFizzExternalRuntime: true, alwaysThrottleRetries: true, useMicrotasksForSchedulingInFabric: false, passChildrenWhenCloningPersistedNodes: false, enableUseDeferredValueInitialArg: __EXPERIMENTAL__, createRootStrictEffectsByDefault: false, disableModulePatternComponents: false, disableLegacyContext: false, enableUseRefAccessWarning: false, forceConcurrentByDefaultForTesting: false, enableUnifiedSyncLane: __EXPERIMENTAL__, allowConcurrentByDefault: false, disableCommentsAsDOMContainers: true, disableJavaScriptURLs: false, enableTrustedTypesIntegration: false, disableInputAttributeSyncing: false, disableIEWorkarounds: __EXPERIMENTAL__, enableFilterEmptyStringAttributesDOM: __EXPERIMENTAL__, enableCustomElementPropertySupport: __EXPERIMENTAL__, disableTextareaChildren: false, enableSchedulingProfiler: __PROFILE__, debugRenderPhaseSideEffectsForStrictMode: __DEV__, replayFailedUnitOfWorkWithInvokeGuardedCallback: __DEV__, enableProfilerTimer: __PROFILE__, enableProfilerCommitHooks: __PROFILE__, enableProfilerNestedUpdatePhase: __PROFILE__, enableDebugTracing: false, enableUpdaterTracking: __PROFILE__, enableServerContext: __EXPERIMENTAL__, enableGetInspectorDataForInstanceInProduction: false, enableProfilerNestedUpdateScheduledHook: false, consoleManagedByDevToolsDuringStrictMode: true, useModernStrictMode: false, enableDO_NOT_USE_disableStrictPassiveEffect: false }, (global.__REACT_FEATURE_FLAGS__ || {}));
// -----------------------------------------------------------------------------
// Land or remove (zero effort)
//
// Flags that can likely be deleted or landed without consequences
// -----------------------------------------------------------------------------
exports.enableComponentStackLocations = global.__REACT_FEATURE_FLAGS__.enableComponentStackLocations;
// -----------------------------------------------------------------------------
// Kill-switch
//
// Flags that exist solely to turn off a change in case it causes a regression
// when it rolls out to prod. We should remove these as soon as possible.
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Land or remove (moderate effort)
//
// Flags that can be probably deleted or landed, but might require extra effort
// like migrating internal callers or performance testing.
// -----------------------------------------------------------------------------
// TODO: Finish rolling out in www
exports.enableClientRenderFallbackOnTextMismatch = global.__REACT_FEATURE_FLAGS__.enableClientRenderFallbackOnTextMismatch;
exports.enableFormActions = global.__REACT_FEATURE_FLAGS__.enableFormActions;
exports.enableAsyncActions = global.__REACT_FEATURE_FLAGS__.enableAsyncActions;
// Not sure if www still uses this. We don't have a replacement but whatever we
// replace it with will likely be different than what's already there, so we
// probably should just delete it as long as nothing in www relies on it.
exports.enableSchedulerDebugging = global.__REACT_FEATURE_FLAGS__.enableSchedulerDebugging;
// Need to remove didTimeout argument from Scheduler before landing
exports.disableSchedulerTimeoutInWorkLoop = global.__REACT_FEATURE_FLAGS__.disableSchedulerTimeoutInWorkLoop;
// This will break some internal tests at Meta so we need to gate this until
// those can be fixed.
exports.enableDeferRootSchedulingToMicrotask = global.__REACT_FEATURE_FLAGS__.enableDeferRootSchedulingToMicrotask;
// -----------------------------------------------------------------------------
// Slated for removal in the future (significant effort)
//
// These are experiments that didn't work out, and never shipped, but we can't
// delete from the codebase until we migrate internal callers.
// -----------------------------------------------------------------------------
// Add a callback property to suspense to notify which promises are currently
// in the update queue. This allows reporting and tracing of what is causing
// the user to see a loading state.
//
// Also allows hydration callbacks to fire when a dehydrated boundary gets
// hydrated or deleted.
//
// This will eventually be replaced by the Transition Tracing proposal.
exports.enableSuspenseCallback = global.__REACT_FEATURE_FLAGS__.enableSuspenseCallback;
// Experimental Scope support.
exports.enableScopeAPI = global.__REACT_FEATURE_FLAGS__.enableScopeAPI;
// Experimental Create Event Handle API.
exports.enableCreateEventHandleAPI = global.__REACT_FEATURE_FLAGS__.enableCreateEventHandleAPI;
// Support legacy Primer support on internal FB www
exports.enableLegacyFBSupport = global.__REACT_FEATURE_FLAGS__.enableLegacyFBSupport;
// -----------------------------------------------------------------------------
// Ongoing experiments
//
// These are features that we're either actively exploring or are reasonably
// likely to include in an upcoming release.
// -----------------------------------------------------------------------------
exports.enableCache = global.__REACT_FEATURE_FLAGS__.enableCache;
exports.enableLegacyCache = global.__REACT_FEATURE_FLAGS__.enableLegacyCache;
exports.enableCacheElement = global.__REACT_FEATURE_FLAGS__.enableCacheElement;
exports.enableFetchInstrumentation = global.__REACT_FEATURE_FLAGS__.enableFetchInstrumentation;
exports.enableBinaryFlight = global.__REACT_FEATURE_FLAGS__.enableBinaryFlight;
exports.enableTaint = global.__REACT_FEATURE_FLAGS__.enableTaint;
exports.enablePostpone = global.__REACT_FEATURE_FLAGS__.enablePostpone;
exports.enableTransitionTracing = global.__REACT_FEATURE_FLAGS__.enableTransitionTracing;
// No known bugs, but needs performance testing
exports.enableLazyContextPropagation = global.__REACT_FEATURE_FLAGS__.enableLazyContextPropagation;
// FB-only usage. The new API has different semantics.
exports.enableLegacyHidden = global.__REACT_FEATURE_FLAGS__.enableLegacyHidden;
// Enables unstable_avoidThisFallback feature in Fiber
exports.enableSuspenseAvoidThisFallback = global.__REACT_FEATURE_FLAGS__.enableSuspenseAvoidThisFallback;
// Enables unstable_avoidThisFallback feature in Fizz
exports.enableSuspenseAvoidThisFallbackFizz = global.__REACT_FEATURE_FLAGS__.enableSuspenseAvoidThisFallbackFizz;
exports.enableCPUSuspense = global.__REACT_FEATURE_FLAGS__.enableCPUSuspense;
exports.enableHostSingletons = global.__REACT_FEATURE_FLAGS__.enableHostSingletons;
exports.enableFloat = global.__REACT_FEATURE_FLAGS__.enableFloat;
// Enables unstable_useMemoCache hook, intended as a compilation target for
// auto-memoization.
exports.enableUseMemoCacheHook = global.__REACT_FEATURE_FLAGS__.enableUseMemoCacheHook;
exports.enableUseEffectEventHook = global.__REACT_FEATURE_FLAGS__.enableUseEffectEventHook;
// Test in www before enabling in open source.
// Enables DOM-server to stream its instruction set as data-attributes
// (handled with an MutationObserver) instead of inline-scripts
exports.enableFizzExternalRuntime = global.__REACT_FEATURE_FLAGS__.enableFizzExternalRuntime;
exports.alwaysThrottleRetries = global.__REACT_FEATURE_FLAGS__.alwaysThrottleRetries;
exports.useMicrotasksForSchedulingInFabric = global.__REACT_FEATURE_FLAGS__.useMicrotasksForSchedulingInFabric;
exports.passChildrenWhenCloningPersistedNodes = global.__REACT_FEATURE_FLAGS__.passChildrenWhenCloningPersistedNodes;
exports.enableUseDeferredValueInitialArg = global.__REACT_FEATURE_FLAGS__.enableUseDeferredValueInitialArg;
// -----------------------------------------------------------------------------
// Chopping Block
//
// Planned feature deprecations and breaking changes. Sorted roughly in order of
// when we plan to enable them.
// -----------------------------------------------------------------------------
// This flag enables Strict Effects by default. We're not turning this on until
// after 18 because it requires migration work. Recommendation is to use
// <StrictMode /> to gradually upgrade components.
// If TRUE, trees rendered with createRoot will be StrictEffectsMode.
// If FALSE, these trees will be StrictLegacyMode.
exports.createRootStrictEffectsByDefault = global.__REACT_FEATURE_FLAGS__.createRootStrictEffectsByDefault;
exports.disableModulePatternComponents = global.__REACT_FEATURE_FLAGS__.disableModulePatternComponents;
exports.disableLegacyContext = global.__REACT_FEATURE_FLAGS__.disableLegacyContext;
exports.enableUseRefAccessWarning = global.__REACT_FEATURE_FLAGS__.enableUseRefAccessWarning;
// Enables time slicing for updates that aren't wrapped in startTransition.
exports.forceConcurrentByDefaultForTesting = global.__REACT_FEATURE_FLAGS__.forceConcurrentByDefaultForTesting;
exports.enableUnifiedSyncLane = global.__REACT_FEATURE_FLAGS__.enableUnifiedSyncLane;
// Adds an opt-in to time slicing for updates that aren't wrapped in startTransition.
exports.allowConcurrentByDefault = global.__REACT_FEATURE_FLAGS__.allowConcurrentByDefault;
// -----------------------------------------------------------------------------
// React DOM Chopping Block
//
// Similar to main Chopping Block but only flags related to React DOM. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------
// Disable support for comment nodes as React DOM containers. Already disabled
// in open source, but www codebase still relies on it. Need to remove.
exports.disableCommentsAsDOMContainers = global.__REACT_FEATURE_FLAGS__.disableCommentsAsDOMContainers;
// Disable javascript: URL strings in href for XSS protection.
exports.disableJavaScriptURLs = global.__REACT_FEATURE_FLAGS__.disableJavaScriptURLs;
exports.enableTrustedTypesIntegration = global.__REACT_FEATURE_FLAGS__.enableTrustedTypesIntegration;
// Prevent the value and checked attributes from syncing with their related
// DOM properties
exports.disableInputAttributeSyncing = global.__REACT_FEATURE_FLAGS__.disableInputAttributeSyncing;
// Remove IE and MsApp specific workarounds for innerHTML
exports.disableIEWorkarounds = global.__REACT_FEATURE_FLAGS__.disableIEWorkarounds;
// Filter certain DOM attributes (e.g. src, href) if their values are empty
// strings. This prevents e.g. <img src=""> from making an unnecessary HTTP
// request for certain browsers.
exports.enableFilterEmptyStringAttributesDOM = global.__REACT_FEATURE_FLAGS__.enableFilterEmptyStringAttributesDOM;
// Changes the behavior for rendering custom elements in both server rendering
// and client rendering, mostly to allow JSX attributes to apply to the custom
// element's object properties instead of only HTML attributes.
// https://github.com/facebook/react/issues/11347
exports.enableCustomElementPropertySupport = global.__REACT_FEATURE_FLAGS__.enableCustomElementPropertySupport;
// Disables children for <textarea> elements
exports.disableTextareaChildren = global.__REACT_FEATURE_FLAGS__.disableTextareaChildren;
// -----------------------------------------------------------------------------
// Debugging and DevTools
// -----------------------------------------------------------------------------
// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
exports.enableSchedulingProfiler = global.__REACT_FEATURE_FLAGS__.enableSchedulingProfiler;
// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.
exports.debugRenderPhaseSideEffectsForStrictMode = global.__REACT_FEATURE_FLAGS__.debugRenderPhaseSideEffectsForStrictMode;
// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
exports.replayFailedUnitOfWorkWithInvokeGuardedCallback = global.__REACT_FEATURE_FLAGS__.replayFailedUnitOfWorkWithInvokeGuardedCallback;
// Gather advanced timing metrics for Profiler subtrees.
exports.enableProfilerTimer = global.__REACT_FEATURE_FLAGS__.enableProfilerTimer;
// Record durations for commit and passive effects phases.
exports.enableProfilerCommitHooks = global.__REACT_FEATURE_FLAGS__.enableProfilerCommitHooks;
// Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".
exports.enableProfilerNestedUpdatePhase = global.__REACT_FEATURE_FLAGS__.enableProfilerNestedUpdatePhase;
// Adds verbose console logging for e.g. state updates, suspense, and work loop
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.
exports.enableDebugTracing = global.__REACT_FEATURE_FLAGS__.enableDebugTracing;
// Track which Fiber(s) schedule render work.
exports.enableUpdaterTracking = global.__REACT_FEATURE_FLAGS__.enableUpdaterTracking;
exports.enableServerContext = global.__REACT_FEATURE_FLAGS__.enableServerContext;
// Internal only.
exports.enableGetInspectorDataForInstanceInProduction = global.__REACT_FEATURE_FLAGS__.enableGetInspectorDataForInstanceInProduction;
// Profiler API accepts a function to be called when a nested update is scheduled.
// This callback accepts the component type (class instance or function) the update is scheduled for.
exports.enableProfilerNestedUpdateScheduledHook = global.__REACT_FEATURE_FLAGS__.enableProfilerNestedUpdateScheduledHook;
exports.consoleManagedByDevToolsDuringStrictMode = global.__REACT_FEATURE_FLAGS__.consoleManagedByDevToolsDuringStrictMode;
// Modern <StrictMode /> behaviour aligns more with what components
// components will encounter in production, especially when used With <Offscreen />.
// TODO: clean up legacy <StrictMode /> once tests pass WWW.
exports.useModernStrictMode = global.__REACT_FEATURE_FLAGS__.useModernStrictMode;
exports.enableDO_NOT_USE_disableStrictPassiveEffect = global.__REACT_FEATURE_FLAGS__.enableDO_NOT_USE_disableStrictPassiveEffect;
