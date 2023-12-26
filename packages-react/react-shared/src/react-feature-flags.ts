/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactFeatureFlags.js
 */

declare global {
    namespace globalThis {
        var __REACT_FEATURE_FLAGS__: Record<string, boolean>;
    }
}

// Added by ZenFlux
global.__REACT_FEATURE_FLAGS__ = {
    enableComponentStackLocations: true,
    enableClientRenderFallbackOnTextMismatch: true,
    enableFormActions: true,
    enableAsyncActions: true,
    enableSchedulerDebugging: false,
    disableSchedulerTimeoutInWorkLoop: false,
    enableDeferRootSchedulingToMicrotask: true,
    enableSuspenseCallback: false,
    enableScopeAPI: false,
    enableCreateEventHandleAPI: false,
    enableLegacyFBSupport: false,
    enableCache: true,
    enableLegacyCache: __EXPERIMENTAL__,
    enableCacheElement: __EXPERIMENTAL__,
    enableFetchInstrumentation: true,
    enableBinaryFlight: __EXPERIMENTAL__,
    enableTaint: __EXPERIMENTAL__,
    enablePostpone: __EXPERIMENTAL__,
    enableTransitionTracing: false,
    enableLazyContextPropagation: false,
    enableLegacyHidden: false,
    enableSuspenseAvoidThisFallback: false,
    enableSuspenseAvoidThisFallbackFizz: false,
    enableCPUSuspense: __EXPERIMENTAL__,
    enableHostSingletons: true,
    enableFloat: true,
    enableUseMemoCacheHook: __EXPERIMENTAL__,
    enableUseEffectEventHook: __EXPERIMENTAL__,
    enableFizzExternalRuntime: true,
    alwaysThrottleRetries: true,
    useMicrotasksForSchedulingInFabric: false,
    passChildrenWhenCloningPersistedNodes: false,
    enableUseDeferredValueInitialArg: __EXPERIMENTAL__,
    createRootStrictEffectsByDefault: false,
    disableModulePatternComponents: false,
    disableLegacyContext: false,
    enableUseRefAccessWarning: false,
    forceConcurrentByDefaultForTesting: false,
    enableUnifiedSyncLane: __EXPERIMENTAL__,
    allowConcurrentByDefault: false,
    disableCommentsAsDOMContainers: true,
    disableJavaScriptURLs: false,
    enableTrustedTypesIntegration: false,
    disableInputAttributeSyncing: false,
    disableIEWorkarounds: __EXPERIMENTAL__,
    enableFilterEmptyStringAttributesDOM: __EXPERIMENTAL__,
    enableCustomElementPropertySupport: __EXPERIMENTAL__,
    disableTextareaChildren: false,
    enableSchedulingProfiler: __PROFILE__,
    debugRenderPhaseSideEffectsForStrictMode: __DEV__,
    replayFailedUnitOfWorkWithInvokeGuardedCallback: __DEV__,
    enableProfilerTimer: __PROFILE__,
    enableProfilerCommitHooks: __PROFILE__,
    enableProfilerNestedUpdatePhase: __PROFILE__,
    enableDebugTracing: false,
    enableUpdaterTracking: __PROFILE__,
    enableServerContext: __EXPERIMENTAL__,
    enableGetInspectorDataForInstanceInProduction: false,
    enableProfilerNestedUpdateScheduledHook: false,
    consoleManagedByDevToolsDuringStrictMode: true,
    useModernStrictMode: false,
    enableDO_NOT_USE_disableStrictPassiveEffect: false,
    ... ( global.__REACT_FEATURE_FLAGS__ || {} ),
};

// -----------------------------------------------------------------------------
// Land or remove (zero effort)
//
// Flags that can likely be deleted or landed without consequences
// -----------------------------------------------------------------------------
export const enableComponentStackLocations = global.__REACT_FEATURE_FLAGS__.enableComponentStackLocations;

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
export const enableClientRenderFallbackOnTextMismatch = global.__REACT_FEATURE_FLAGS__.enableClientRenderFallbackOnTextMismatch;
export const enableFormActions = global.__REACT_FEATURE_FLAGS__.enableFormActions;
export const enableAsyncActions = global.__REACT_FEATURE_FLAGS__.enableAsyncActions;

// Not sure if www still uses this. We don't have a replacement but whatever we
// replace it with will likely be different than what's already there, so we
// probably should just delete it as long as nothing in www relies on it.
export const enableSchedulerDebugging = global.__REACT_FEATURE_FLAGS__.enableSchedulerDebugging;

// Need to remove didTimeout argument from Scheduler before landing
export const disableSchedulerTimeoutInWorkLoop = global.__REACT_FEATURE_FLAGS__.disableSchedulerTimeoutInWorkLoop;

// This will break some internal tests at Meta so we need to gate this until
// those can be fixed.
export const enableDeferRootSchedulingToMicrotask = global.__REACT_FEATURE_FLAGS__.enableDeferRootSchedulingToMicrotask;

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
export const enableSuspenseCallback = global.__REACT_FEATURE_FLAGS__.enableSuspenseCallback;

// Experimental Scope support.
export const enableScopeAPI = global.__REACT_FEATURE_FLAGS__.enableScopeAPI;

// Experimental Create Event Handle API.
export const enableCreateEventHandleAPI = global.__REACT_FEATURE_FLAGS__.enableCreateEventHandleAPI;

// Support legacy Primer support on internal FB www
export const enableLegacyFBSupport = global.__REACT_FEATURE_FLAGS__.enableLegacyFBSupport;

// -----------------------------------------------------------------------------
// Ongoing experiments
//
// These are features that we're either actively exploring or are reasonably
// likely to include in an upcoming release.
// -----------------------------------------------------------------------------
export const enableCache = global.__REACT_FEATURE_FLAGS__.enableCache;
export const enableLegacyCache = global.__REACT_FEATURE_FLAGS__.enableLegacyCache;
export const enableCacheElement = global.__REACT_FEATURE_FLAGS__.enableCacheElement;
export const enableFetchInstrumentation = global.__REACT_FEATURE_FLAGS__.enableFetchInstrumentation;
export const enableBinaryFlight = global.__REACT_FEATURE_FLAGS__.enableBinaryFlight;
export const enableTaint = global.__REACT_FEATURE_FLAGS__.enableTaint;
export const enablePostpone = global.__REACT_FEATURE_FLAGS__.enablePostpone;
export const enableTransitionTracing = global.__REACT_FEATURE_FLAGS__.enableTransitionTracing;

// No known bugs, but needs performance testing
export const enableLazyContextPropagation = global.__REACT_FEATURE_FLAGS__.enableLazyContextPropagation;

// FB-only usage. The new API has different semantics.
export const enableLegacyHidden = global.__REACT_FEATURE_FLAGS__.enableLegacyHidden;

// Enables unstable_avoidThisFallback feature in Fiber
export const enableSuspenseAvoidThisFallback = global.__REACT_FEATURE_FLAGS__.enableSuspenseAvoidThisFallback;

// Enables unstable_avoidThisFallback feature in Fizz
export const enableSuspenseAvoidThisFallbackFizz = global.__REACT_FEATURE_FLAGS__.enableSuspenseAvoidThisFallbackFizz;
export const enableCPUSuspense = global.__REACT_FEATURE_FLAGS__.enableCPUSuspense;
export const enableHostSingletons = global.__REACT_FEATURE_FLAGS__.enableHostSingletons;
export const enableFloat = global.__REACT_FEATURE_FLAGS__.enableFloat;

// Enables unstable_useMemoCache hook, intended as a compilation target for
// auto-memoization.
export const enableUseMemoCacheHook = global.__REACT_FEATURE_FLAGS__.enableUseMemoCacheHook;
export const enableUseEffectEventHook = global.__REACT_FEATURE_FLAGS__.enableUseEffectEventHook;

// Test in www before enabling in open source.
// Enables DOM-server to stream its instruction set as data-attributes
// (handled with an MutationObserver) instead of inline-scripts
export const enableFizzExternalRuntime = global.__REACT_FEATURE_FLAGS__.enableFizzExternalRuntime;
export const alwaysThrottleRetries = global.__REACT_FEATURE_FLAGS__.alwaysThrottleRetries;
export const useMicrotasksForSchedulingInFabric = global.__REACT_FEATURE_FLAGS__.useMicrotasksForSchedulingInFabric;
export const passChildrenWhenCloningPersistedNodes = global.__REACT_FEATURE_FLAGS__.passChildrenWhenCloningPersistedNodes;
export const enableUseDeferredValueInitialArg = global.__REACT_FEATURE_FLAGS__.enableUseDeferredValueInitialArg;

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
export const createRootStrictEffectsByDefault = global.__REACT_FEATURE_FLAGS__.createRootStrictEffectsByDefault;
export const disableModulePatternComponents = global.__REACT_FEATURE_FLAGS__.disableModulePatternComponents;
export const disableLegacyContext = global.__REACT_FEATURE_FLAGS__.disableLegacyContext;
export const enableUseRefAccessWarning = global.__REACT_FEATURE_FLAGS__.enableUseRefAccessWarning;

// Enables time slicing for updates that aren't wrapped in startTransition.
export const forceConcurrentByDefaultForTesting = global.__REACT_FEATURE_FLAGS__.forceConcurrentByDefaultForTesting;
export const enableUnifiedSyncLane = global.__REACT_FEATURE_FLAGS__.enableUnifiedSyncLane;

// Adds an opt-in to time slicing for updates that aren't wrapped in startTransition.
export const allowConcurrentByDefault = global.__REACT_FEATURE_FLAGS__.allowConcurrentByDefault;

// -----------------------------------------------------------------------------
// React DOM Chopping Block
//
// Similar to main Chopping Block but only flags related to React DOM. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------
// Disable support for comment nodes as React DOM containers. Already disabled
// in open source, but www codebase still relies on it. Need to remove.
export const disableCommentsAsDOMContainers = global.__REACT_FEATURE_FLAGS__.disableCommentsAsDOMContainers;

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = global.__REACT_FEATURE_FLAGS__.disableJavaScriptURLs;
export const enableTrustedTypesIntegration = global.__REACT_FEATURE_FLAGS__.enableTrustedTypesIntegration;

// Prevent the value and checked attributes from syncing with their related
// DOM properties
export const disableInputAttributeSyncing = global.__REACT_FEATURE_FLAGS__.disableInputAttributeSyncing;

// Remove IE and MsApp specific workarounds for innerHTML
export const disableIEWorkarounds = global.__REACT_FEATURE_FLAGS__.disableIEWorkarounds;

// Filter certain DOM attributes (e.g. src, href) if their values are empty
// strings. This prevents e.g. <img src=""> from making an unnecessary HTTP
// request for certain browsers.
export const enableFilterEmptyStringAttributesDOM = global.__REACT_FEATURE_FLAGS__.enableFilterEmptyStringAttributesDOM;

// Changes the behavior for rendering custom elements in both server rendering
// and client rendering, mostly to allow JSX attributes to apply to the custom
// element's object properties instead of only HTML attributes.
// https://github.com/facebook/react/issues/11347
export const enableCustomElementPropertySupport = global.__REACT_FEATURE_FLAGS__.enableCustomElementPropertySupport;

// Disables children for <textarea> elements
export const disableTextareaChildren = global.__REACT_FEATURE_FLAGS__.disableTextareaChildren;

// -----------------------------------------------------------------------------
// Debugging and DevTools
// -----------------------------------------------------------------------------
// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
export const enableSchedulingProfiler = global.__REACT_FEATURE_FLAGS__.enableSchedulingProfiler;

// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.
export const debugRenderPhaseSideEffectsForStrictMode = global.__REACT_FEATURE_FLAGS__.debugRenderPhaseSideEffectsForStrictMode;

// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = global.__REACT_FEATURE_FLAGS__.replayFailedUnitOfWorkWithInvokeGuardedCallback;

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = global.__REACT_FEATURE_FLAGS__.enableProfilerTimer;

// Record durations for commit and passive effects phases.
export const enableProfilerCommitHooks = global.__REACT_FEATURE_FLAGS__.enableProfilerCommitHooks;

// Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".
export const enableProfilerNestedUpdatePhase = global.__REACT_FEATURE_FLAGS__.enableProfilerNestedUpdatePhase;

// Adds verbose console logging for e.g. state updates, suspense, and work loop
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.
export const enableDebugTracing = global.__REACT_FEATURE_FLAGS__.enableDebugTracing;

// Track which Fiber(s) schedule render work.
export const enableUpdaterTracking = global.__REACT_FEATURE_FLAGS__.enableUpdaterTracking;
export const enableServerContext = global.__REACT_FEATURE_FLAGS__.enableServerContext;

// Internal only.
export const enableGetInspectorDataForInstanceInProduction = global.__REACT_FEATURE_FLAGS__.enableGetInspectorDataForInstanceInProduction;

// Profiler API accepts a function to be called when a nested update is scheduled.
// This callback accepts the component type (class instance or function) the update is scheduled for.
export const enableProfilerNestedUpdateScheduledHook = global.__REACT_FEATURE_FLAGS__.enableProfilerNestedUpdateScheduledHook;
export const consoleManagedByDevToolsDuringStrictMode = global.__REACT_FEATURE_FLAGS__.consoleManagedByDevToolsDuringStrictMode;

// Modern <StrictMode /> behaviour aligns more with what components
// components will encounter in production, especially when used With <Offscreen />.
// TODO: clean up legacy <StrictMode /> once tests pass WWW.
export const useModernStrictMode = global.__REACT_FEATURE_FLAGS__.useModernStrictMode;
export const enableDO_NOT_USE_disableStrictPassiveEffect = global.__REACT_FEATURE_FLAGS__.enableDO_NOT_USE_disableStrictPassiveEffect;
