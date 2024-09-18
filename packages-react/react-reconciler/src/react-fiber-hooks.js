"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHostTransition = exports.resetHooksAfterThrow = exports.bailoutHooks = exports.checkDidRenderIdHook = exports.transitionAwareHostComponent = exports.renderTransitionAwareHostComponentWithHooks = exports.replaySuspendedComponentWithHooks = exports.renderWithHooks = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_hooks_throw_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-throw");
var react_fiber_hooks_use_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use");
var react_fiber_hooks_use_callback_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-callback");
var react_fiber_hooks_use_debug_value_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-debug-value");
var react_fiber_hooks_use_deferred_value_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-deferred-value");
var react_fiber_hooks_use_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect");
var react_fiber_hooks_use_effect_event_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-effect-event");
var react_fiber_hooks_use_form_state_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-form-state");
var react_fiber_hooks_use_host_transaction_status_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-host-transaction-status");
var react_fiber_hooks_use_id_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-id");
var react_fiber_hooks_use_imperative_handle_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-imperative-handle");
var react_fiber_hooks_use_inseration_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-inseration-effect");
var react_fiber_hooks_use_layout_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-layout-effect");
var react_fiber_hooks_use_memo_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-memo");
var react_fiber_hooks_use_memo_cache_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-memo-cache");
var react_fiber_hooks_use_optimistic_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-optimistic");
var react_fiber_hooks_use_reducer_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-reducer");
var react_fiber_hooks_use_ref_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-ref");
var react_fiber_hooks_use_refresh_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-refresh");
var react_fiber_hooks_use_state_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-state");
var react_fiber_hooks_use_sync_external_store_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-sync-external-store");
var react_fiber_hooks_use_transaction_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-use-transaction");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_thenable_1 = require("@zenflux/react-reconciler/src/react-fiber-thenable");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_receive_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var NoPendingHostTransition = globalThis.__RECONCILER__CONFIG__.NotPendingTransition;
var RE_RENDER_LIMIT = 25;
var ReactCurrentDispatcher = react_shared_internals_1.default.ReactCurrentDispatcher;
if (__DEV__) {
    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutMismatchedHooksForComponent = new Set();
    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutUseWrappedInTryCatch = new Set();
    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutAsyncClientComponent = new Set();
}
function mountHookTypesDev() {
    if (__DEV__) {
        var hookName = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev;
        if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev === null) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev = [hookName];
        }
        else {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev.push(hookName);
        }
    }
}
function updateHookTypesDev() {
    if (__DEV__) {
        var hookName = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev;
        if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev !== null) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev++;
            if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev[react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev] !== hookName) {
                warnOnHookMismatchInDev(hookName);
            }
        }
    }
}
function checkDepsAreArrayDev(deps) {
    if (__DEV__) {
        if (deps !== undefined && deps !== null && !Array.isArray(deps)) {
            // Verify deps, but only on mount to avoid extra checks.
            // It's unlikely their type would change as usually you define them inline.
            console.error("%s received a final argument that is not an array (instead, received `%s`). When " + "specified, the final argument must be an array.", react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev, typeof deps);
        }
    }
}
function warnOnHookMismatchInDev(currentHookName) {
    if (__DEV__) {
        var componentName = (0, react_get_component_name_from_fiber_1.default)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber);
        if (!react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutMismatchedHooksForComponent.has(componentName)) {
            react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutMismatchedHooksForComponent.add(componentName);
            if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev !== null) {
                var table = "";
                var secondColumnStart = 30;
                for (var i = 0; i <= react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev; i++) {
                    var oldHookName = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev[i];
                    var newHookName = i === react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev ? currentHookName : oldHookName;
                    var row = "".concat(i + 1, ". ").concat(oldHookName);
                    // Extra space so second column lines up
                    // lol @ IE not supporting String#repeat
                    while (row.length < secondColumnStart) {
                        row += " ";
                    }
                    row += newHookName + "\n";
                    table += row;
                }
                console.error("React has detected a change in the order of Hooks called by %s. " + "This will lead to bugs and errors if not fixed. " + "For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks\n\n" + "   Previous render            Next render\n" + "   ------------------------------------------------------\n" + "%s" + "   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n", componentName, table);
            }
        }
    }
}
function warnIfAsyncClientComponent(Component, componentDoesIncludeHooks) {
    if (__DEV__) {
        // This dev-only check only works for detecting native async functions,
        // not transpiled ones. There's also a prod check that we use to prevent
        // async client components from crashing the app; the prod one works even
        // for transpiled async functions. Neither mechanism is completely
        // bulletproof but together they cover the most common cases.
        var isAsyncFunction = // $FlowIgnore[method-unbinding]
         Object.prototype.toString.call(Component) === "[object AsyncFunction]";
        if (isAsyncFunction) {
            // Encountered an async Client Component. This is not yet supported,
            // except in certain constrained cases, like during a route navigation.
            var componentName = (0, react_get_component_name_from_fiber_1.default)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber);
            if (!react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutAsyncClientComponent.has(componentName)) {
                react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutAsyncClientComponent.add(componentName);
                // Check if this is a sync update. We use the "root" render lanes here
                // because the "subtree" render lanes may include additional entangled
                // lanes related to revealing previously hidden content.
                var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
                var rootRenderLanes = (0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)();
                if (root !== null && (0, fiber_lane_constants_1.includesBlockingLane)(root, rootRenderLanes)) {
                    console.error("async/await is not yet supported in Client Components, only " + "Server Components. This error is often caused by accidentally " + "adding `'use client'` to a module that was originally written " + "for the server.");
                }
                else {
                    // This is a concurrent (Transition, Retry, etc) render. We don't
                    // warn in these cases.
                    //
                    // However, Async Components are forbidden to include hooks, even
                    // during a transition, so let's check for that here.
                    //
                    // TODO: Add a corresponding warning to Server Components runtime.
                    if (componentDoesIncludeHooks) {
                        console.error("Hooks are not supported inside an async component. This " + "error is often caused by accidentally adding `'use client'` " + "to a module that was originally written for the server.");
                    }
                }
            }
        }
    }
}
function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
    // This is used to perform another render pass. It's used when setState is
    // called during render, and for double invoking components in Strict Mode
    // during development.
    //
    // The state from the previous pass is reused whenever possible. So, state
    // updates that were already processed are not processed again, and memoized
    // functions (`useMemo`) are not invoked again.
    //
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber = workInProgress;
    var numberOfReRenders = 0;
    var children;
    do {
        if (react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass) {
            // It's possible that a use() value depended on a state that was updated in
            // this rerender, so we need to watch for different thenables this time.
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableState = null;
        }
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableIndexCounter = 0;
        react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass = false;
        if (numberOfReRenders >= RE_RENDER_LIMIT) {
            throw new Error("Too many re-renders. React limits the number of renders to prevent " + "an infinite loop.");
        }
        numberOfReRenders += 1;
        if (__DEV__) {
            // Even when hot reloading, allow dependencies to stabilize
            // after first render to prevent infinite render phase updates.
            react_fiber_hooks_shared_1.ReactFiberHooksInfra.ignorePreviousDependencies = false;
        }
        // Start over from the beginning of the list
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook = null;
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = null;
        workInProgress.updateQueue = null;
        if (__DEV__) {
            // Also validate hook order for cascading updates.
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        }
        ReactCurrentDispatcher.current = __DEV__ ? react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender : react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender;
        children = Component(props, secondArg);
    } while (react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass);
    return children;
}
function finishRenderingHooks(current, workInProgress, Component) {
    if (__DEV__) {
        workInProgress._debugHookTypes = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev;
        var componentDoesIncludeHooks = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook !== null || react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableIndexCounter !== 0;
        warnIfAsyncClientComponent(Component, componentDoesIncludeHooks);
    }
    // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrance.
    ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly;
    // This check uses ReactFiberHooksCurrent.hook so that it works the same in DEV and prod bundles.
    // ReactFiberHooksCurrent.hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
    var didRenderTooFewHooks = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook !== null && react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook.next !== null;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes = fiber_lane_constants_1.NoLanes;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber = null;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hook = null;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook = null;
    if (__DEV__) {
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = null;
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev = null;
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        // Confirm that a static flag was not added or removed since the last
        // render. If this fires, it suggests that we incorrectly reset the static
        // flags in some other part of the codebase. This has happened before, for
        // example, in the SuspenseList implementation.
        if (current !== null && (current.flags & fiber_flags_1.FiberFlags.StaticMask) !== (workInProgress.flags & fiber_flags_1.FiberFlags.StaticMask) && // Disable this warning in legacy mode, because legacy Suspense is weird
            // and creates false positives. To make this work in legacy mode, we'd
            // need to mark fibers that commit in an incomplete state, somehow. For
            // now I'll disable the warning that most of the bugs that would trigger
            // it are either exclusive to concurrent mode or exist in both.
            (current.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode) {
            console.error("Internal React error: Expected static flag was missing. Please " + "notify the React team.");
        }
    }
    react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = false;
    // This is reset by checkDidRenderIdHook
    // ReactFiberHooksCurrent.localIdCounter = 0;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableIndexCounter = 0;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableState = null;
    if (didRenderTooFewHooks) {
        throw new Error("Rendered fewer hooks than expected. This may be caused by an accidental " + "early return statement.");
    }
    if (react_feature_flags_1.enableLazyContextPropagation) {
        if (current !== null) {
            if (!(0, react_fiber_work_in_progress_receive_update_1.checkIfWorkInProgressReceivedUpdate)()) {
                // If there were no changes to props or state, we need to check if there
                // was a context change. We didn't already do this because there's no
                // 1:1 correspondence between dependencies and hooks. Although, because
                // there almost always is in the common case (`readContext` is an
                // internal API), we could compare in there. OTOH, we only hit this case
                // if everything else bails out, so on the whole it might be better to
                // keep the comparison out of the common path.
                var currentDependencies = current.dependencies;
                if (currentDependencies !== null && (0, react_fiber_new_context_1.checkIfContextChanged)(currentDependencies)) {
                    (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
                }
            }
        }
    }
    if (__DEV__) {
        if ((0, react_fiber_thenable_1.checkIfUseWrappedInTryCatch)()) {
            var componentName = (0, react_get_component_name_from_fiber_1.default)(workInProgress) || "Unknown";
            if (!react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutUseWrappedInTryCatch.has(componentName) && // This warning also fires if you suspend with `use` inside an
                // async component. Since we warn for that above, we'll silence this
                // second warning by checking here.
                !react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutAsyncClientComponent.has(componentName)) {
                react_fiber_hooks_shared_1.ReactFiberHooksFlags.didWarnAboutUseWrappedInTryCatch.add(componentName);
                console.error("`use` was called from inside a try/catch block. This is not allowed " + "and can lead to unexpected behavior. To handle errors triggered " + "by `use`, wrap your component in a error boundary.");
            }
        }
    }
}
// ---
// Context only
// ---
react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly = {
    readContext: react_fiber_new_context_1.readContext,
    use: react_fiber_hooks_use_1.use,
    useCallback: react_fiber_hooks_throw_1.throwInvalidHookError,
    useContext: react_fiber_hooks_throw_1.throwInvalidHookError,
    useEffect: react_fiber_hooks_throw_1.throwInvalidHookError,
    useImperativeHandle: react_fiber_hooks_throw_1.throwInvalidHookError,
    useInsertionEffect: react_fiber_hooks_throw_1.throwInvalidHookError,
    useLayoutEffect: react_fiber_hooks_throw_1.throwInvalidHookError,
    useMemo: react_fiber_hooks_throw_1.throwInvalidHookError,
    useReducer: react_fiber_hooks_throw_1.throwInvalidHookError,
    useRef: react_fiber_hooks_throw_1.throwInvalidHookError,
    useState: react_fiber_hooks_throw_1.throwInvalidHookError,
    useDebugValue: react_fiber_hooks_throw_1.throwInvalidHookError,
    useDeferredValue: react_fiber_hooks_throw_1.throwInvalidHookError,
    useTransition: react_fiber_hooks_throw_1.throwInvalidHookError,
    useSyncExternalStore: react_fiber_hooks_throw_1.throwInvalidHookError,
    useId: react_fiber_hooks_throw_1.throwInvalidHookError
};
if (react_feature_flags_1.enableCache) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly.useCacheRefresh = react_fiber_hooks_throw_1.throwInvalidHookError;
}
if (react_feature_flags_1.enableUseMemoCacheHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly.useMemoCache = react_fiber_hooks_throw_1.throwInvalidHookError;
}
if (react_feature_flags_1.enableUseEffectEventHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly.useEffectEvent = react_fiber_hooks_throw_1.throwInvalidHookError;
}
if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly.useHostTransitionStatus = react_fiber_hooks_throw_1.throwInvalidHookError;
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly.useFormState = react_fiber_hooks_throw_1.throwInvalidHookError;
}
if (react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly.useOptimistic = react_fiber_hooks_throw_1.throwInvalidHookError;
}
// ---
// On mount
// ---
react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount = {
    readContext: react_fiber_new_context_1.readContext,
    use: react_fiber_hooks_use_1.use,
    useCallback: react_fiber_hooks_use_callback_1.mountCallback,
    useContext: react_fiber_new_context_1.readContext,
    useEffect: react_fiber_hooks_use_effect_1.mountEffect,
    useImperativeHandle: react_fiber_hooks_use_imperative_handle_1.mountImperativeHandle,
    useLayoutEffect: react_fiber_hooks_use_layout_effect_1.mountLayoutEffect,
    useInsertionEffect: react_fiber_hooks_use_inseration_effect_1.mountInsertionEffect,
    useMemo: react_fiber_hooks_use_memo_1.mountMemo,
    useReducer: react_fiber_hooks_use_reducer_1.mountReducer,
    useRef: react_fiber_hooks_use_ref_1.mountRef,
    useState: react_fiber_hooks_use_state_1.mountState,
    useDebugValue: react_fiber_hooks_use_debug_value_1.mountDebugValue,
    useDeferredValue: react_fiber_hooks_use_deferred_value_1.mountDeferredValue,
    useTransition: react_fiber_hooks_use_transaction_1.mountTransition,
    useSyncExternalStore: react_fiber_hooks_use_sync_external_store_1.mountSyncExternalStore,
    useId: react_fiber_hooks_use_id_1.mountId
};
if (react_feature_flags_1.enableCache) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount.useCacheRefresh = react_fiber_hooks_use_refresh_1.mountRefresh;
}
if (react_feature_flags_1.enableUseMemoCacheHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount.useMemoCache = react_fiber_hooks_use_memo_cache_1.useMemoCache;
}
if (react_feature_flags_1.enableUseEffectEventHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount.useEffectEvent = react_fiber_hooks_use_effect_event_1.mountEvent;
}
if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount.useFormState = react_fiber_hooks_use_form_state_1.mountFormState;
}
if (react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount.useOptimistic = react_fiber_hooks_use_optimistic_1.mountOptimistic;
}
// ---
// On update
// ---
react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate = {
    readContext: react_fiber_new_context_1.readContext,
    use: react_fiber_hooks_use_1.use,
    useCallback: react_fiber_hooks_use_callback_1.updateCallback,
    useContext: react_fiber_new_context_1.readContext,
    useEffect: react_fiber_hooks_use_effect_1.updateEffect,
    useImperativeHandle: react_fiber_hooks_use_imperative_handle_1.updateImperativeHandle,
    useInsertionEffect: react_fiber_hooks_use_inseration_effect_1.updateInsertionEffect,
    useLayoutEffect: react_fiber_hooks_use_layout_effect_1.updateLayoutEffect,
    useMemo: react_fiber_hooks_use_memo_1.updateMemo,
    useReducer: react_fiber_hooks_use_reducer_1.updateReducer,
    useRef: react_fiber_hooks_use_ref_1.updateRef,
    useState: react_fiber_hooks_use_state_1.updateState,
    useDebugValue: react_fiber_hooks_use_debug_value_1.updateDebugValue,
    useDeferredValue: react_fiber_hooks_use_deferred_value_1.updateDeferredValue,
    useTransition: react_fiber_hooks_use_transaction_1.updateTransition,
    useSyncExternalStore: react_fiber_hooks_use_sync_external_store_1.updateSyncExternalStore,
    useId: react_fiber_hooks_use_id_1.updateId
};
if (react_feature_flags_1.enableCache) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate.useCacheRefresh = react_fiber_hooks_use_refresh_1.updateRefresh;
}
if (react_feature_flags_1.enableUseMemoCacheHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate.useMemoCache = react_fiber_hooks_use_memo_cache_1.useMemoCache;
}
if (react_feature_flags_1.enableUseEffectEventHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate.useEffectEvent = react_fiber_hooks_use_effect_event_1.updateEvent;
}
if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate.useFormState = react_fiber_hooks_use_form_state_1.updateFormState;
}
if (react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate.useOptimistic = react_fiber_hooks_use_optimistic_1.updateOptimistic;
}
// ---
// On render
// ---
react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender = {
    readContext: react_fiber_new_context_1.readContext,
    use: react_fiber_hooks_use_1.use,
    useCallback: react_fiber_hooks_use_callback_1.updateCallback,
    useContext: react_fiber_new_context_1.readContext,
    useEffect: react_fiber_hooks_use_effect_1.updateEffect,
    useImperativeHandle: react_fiber_hooks_use_imperative_handle_1.updateImperativeHandle,
    useInsertionEffect: react_fiber_hooks_use_inseration_effect_1.updateInsertionEffect,
    useLayoutEffect: react_fiber_hooks_use_layout_effect_1.updateLayoutEffect,
    useMemo: react_fiber_hooks_use_memo_1.updateMemo,
    useReducer: react_fiber_hooks_use_reducer_1.rerenderReducer,
    useRef: react_fiber_hooks_use_ref_1.updateRef,
    useState: react_fiber_hooks_use_state_1.rerenderState,
    useDebugValue: react_fiber_hooks_use_debug_value_1.updateDebugValue,
    useDeferredValue: react_fiber_hooks_use_deferred_value_1.rerenderDeferredValue,
    useTransition: react_fiber_hooks_use_transaction_1.rerenderTransition,
    useSyncExternalStore: react_fiber_hooks_use_sync_external_store_1.updateSyncExternalStore,
    useId: react_fiber_hooks_use_id_1.updateId
};
if (react_feature_flags_1.enableCache) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender.useCacheRefresh = react_fiber_hooks_use_refresh_1.updateRefresh;
}
if (react_feature_flags_1.enableUseMemoCacheHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender.useMemoCache = react_fiber_hooks_use_memo_cache_1.useMemoCache;
}
if (react_feature_flags_1.enableUseEffectEventHook) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender.useEffectEvent = react_fiber_hooks_use_effect_event_1.updateEvent;
}
if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender.useFormState = react_fiber_hooks_use_form_state_1.rerenderFormState;
}
if (react_feature_flags_1.enableAsyncActions) {
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onRerender.useOptimistic = react_fiber_hooks_use_optimistic_1.rerenderOptimistic;
}
if (__DEV__) {
    var warnInvalidContextAccess_1 = function () {
        console.error("Context can only be read while React is rendering. " + "In classes, you can read it in the render method or getDerivedStateFromProps. " + "In function components, you can read it directly in the function body, but not " + "inside Hooks like useReducer() or useMemo().");
    };
    var warnInvalidHookAccess_1 = function () {
        console.error("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. " + "You can only call Hooks at the top level of your React function. " + "For more information, see " + "https://reactjs.org/link/rules-of-hooks");
    };
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount = {
        readContext: function (context) {
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        use: react_fiber_hooks_use_1.use,
        useCallback: function (callback, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return (0, react_fiber_hooks_use_callback_1.mountCallback)(callback, deps);
        },
        useContext: function (context) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useContext";
            mountHookTypesDev();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        useEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return (0, react_fiber_hooks_use_effect_1.mountEffect)(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return (0, react_fiber_hooks_use_imperative_handle_1.mountImperativeHandle)(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return (0, react_fiber_hooks_use_inseration_effect_1.mountInsertionEffect)(create, deps);
        },
        useLayoutEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return (0, react_fiber_hooks_use_layout_effect_1.mountLayoutEffect)(create, deps);
        },
        useMemo: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_memo_1.mountMemo)(create, deps);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useReducer: function (reducer, initialArg, init) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            mountHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_reducer_1.mountReducer)(reducer, initialArg, init);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useRef: function (initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useRef";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_ref_1.mountRef)(initialValue);
        },
        useState: function (initialState) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useState";
            mountHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_state_1.mountState)(initialState);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useDebugValue: function (value, formatterFn) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_debug_value_1.mountDebugValue)(value, formatterFn);
        },
        useDeferredValue: function (value, initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_deferred_value_1.mountDeferredValue)(value, initialValue);
        },
        useTransition: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_transaction_1.mountTransition)();
        },
        useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_sync_external_store_1.mountSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        },
        useId: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useId";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_id_1.mountId)();
        }
    };
    if (react_feature_flags_1.enableCache) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount.useCacheRefresh = function useCacheRefresh() {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_refresh_1.mountRefresh)();
        };
    }
    if (react_feature_flags_1.enableUseMemoCacheHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount.useMemoCache = react_fiber_hooks_use_memo_cache_1.useMemoCache;
    }
    if (react_feature_flags_1.enableUseEffectEventHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount.useEffectEvent = function useEffectEvent(callback) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_effect_event_1.mountEvent)(callback);
        };
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
        function useFormState(action, initialState, permalink) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_form_state_1.mountFormState)(action, initialState, permalink);
        }
        ;
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount.useFormState = useFormState;
    }
    if (react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount.useOptimistic = function useOptimistic(passthrough, reducer) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_optimistic_1.mountOptimistic)(passthrough, reducer);
        };
    }
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes = {
        readContext: function (context) {
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        use: react_fiber_hooks_use_1.use,
        useCallback: function (callback, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_callback_1.mountCallback)(callback, deps);
        },
        useContext: function (context) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useContext";
            updateHookTypesDev();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        useEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_1.mountEffect)(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_imperative_handle_1.mountImperativeHandle)(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_inseration_effect_1.mountInsertionEffect)(create, deps);
        },
        useLayoutEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_layout_effect_1.mountLayoutEffect)(create, deps);
        },
        useMemo: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_memo_1.mountMemo)(create, deps);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useReducer: function (reducer, initialArg, init) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_reducer_1.mountReducer)(reducer, initialArg, init);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useRef: function (initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useRef";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_ref_1.mountRef)(initialValue);
        },
        useState: function (initialState) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useState";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_state_1.mountState)(initialState);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useDebugValue: function (value, formatterFn) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_debug_value_1.mountDebugValue)(value, formatterFn);
        },
        useDeferredValue: function (value, initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_deferred_value_1.mountDeferredValue)(value, initialValue);
        },
        useTransition: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_transaction_1.mountTransition)();
        },
        useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_sync_external_store_1.mountSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        },
        useId: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useId";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_id_1.mountId)();
        }
    };
    if (react_feature_flags_1.enableCache) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useCacheRefresh = function useCacheRefresh() {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_refresh_1.mountRefresh)();
        };
    }
    if (react_feature_flags_1.enableUseMemoCacheHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useMemoCache = react_fiber_hooks_use_memo_cache_1.useMemoCache;
    }
    if (react_feature_flags_1.enableUseEffectEventHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useEffectEvent = function useEffectEvent(callback) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_event_1.mountEvent)(callback);
        };
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
        function useFormState(action, initialState, permalink) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_form_state_1.mountFormState)(action, initialState, permalink);
        }
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useFormState = useFormState;
    }
    if (react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes.useOptimistic = function useOptimistic(passthrough, reducer) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_optimistic_1.mountOptimistic)(passthrough, reducer);
        };
    }
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate = {
        readContext: function (context) {
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        use: react_fiber_hooks_use_1.use,
        useCallback: function (callback, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_callback_1.updateCallback)(callback, deps);
        },
        useContext: function (context) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useContext";
            updateHookTypesDev();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        useEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_1.updateEffect)(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_imperative_handle_1.updateImperativeHandle)(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_inseration_effect_1.updateInsertionEffect)(create, deps);
        },
        useLayoutEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_layout_effect_1.updateLayoutEffect)(create, deps);
        },
        useMemo: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_memo_1.updateMemo)(create, deps);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useReducer: function (reducer, initialArg, init) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_reducer_1.updateReducer)(reducer, initialArg, init);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useRef: function (initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useRef";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_ref_1.updateRef)(initialValue);
        },
        useState: function (initialState) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useState";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_state_1.updateState)(initialState);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useDebugValue: function (value, formatterFn) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_debug_value_1.updateDebugValue)(value, formatterFn);
        },
        useDeferredValue: function (value, initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_deferred_value_1.updateDeferredValue)(value, initialValue);
        },
        useTransition: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_transaction_1.updateTransition)();
        },
        useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_sync_external_store_1.updateSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        },
        useId: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useId";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_id_1.updateId)();
        }
    };
    if (react_feature_flags_1.enableCache) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate.useCacheRefresh = function useCacheRefresh() {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_refresh_1.updateRefresh)();
        };
    }
    if (react_feature_flags_1.enableUseMemoCacheHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate.useMemoCache = react_fiber_hooks_use_memo_cache_1.useMemoCache;
    }
    if (react_feature_flags_1.enableUseEffectEventHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate.useEffectEvent = function useEffectEvent(callback) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_event_1.updateEvent)(callback);
        };
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
        function useFormState(action, initialState, permalink) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_form_state_1.updateFormState)(action, initialState, permalink);
        }
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate.useFormState = useFormState;
    }
    if (react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate.useOptimistic = function useOptimistic(passthrough, reducer) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_optimistic_1.updateOptimistic)(passthrough, reducer);
        };
    }
    react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender = {
        readContext: function (context) {
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        use: react_fiber_hooks_use_1.use,
        useCallback: function (callback, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_callback_1.updateCallback)(callback, deps);
        },
        useContext: function (context) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useContext";
            updateHookTypesDev();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        useEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_1.updateEffect)(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_imperative_handle_1.updateImperativeHandle)(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_inseration_effect_1.updateInsertionEffect)(create, deps);
        },
        useLayoutEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_layout_effect_1.updateLayoutEffect)(create, deps);
        },
        useMemo: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer;
            try {
                return (0, react_fiber_hooks_use_memo_1.updateMemo)(create, deps);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useReducer: function (reducer, initialArg, init) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer;
            try {
                return (0, react_fiber_hooks_use_reducer_1.rerenderReducer)(reducer, initialArg, init);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useRef: function (initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useRef";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_ref_1.updateRef)(initialValue);
        },
        useState: function (initialState) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useState";
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer;
            try {
                return (0, react_fiber_hooks_use_state_1.rerenderState)(initialState);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useDebugValue: function (value, formatterFn) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_debug_value_1.updateDebugValue)(value, formatterFn);
        },
        useDeferredValue: function (value, initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_deferred_value_1.rerenderDeferredValue)(value, initialValue);
        },
        useTransition: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_transaction_1.rerenderTransition)();
        },
        useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_sync_external_store_1.updateSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        },
        useId: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useId";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_id_1.updateId)();
        }
    };
    if (react_feature_flags_1.enableCache) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender.useCacheRefresh = function useCacheRefresh() {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_refresh_1.updateRefresh)();
        };
    }
    if (react_feature_flags_1.enableUseMemoCacheHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender.useMemoCache = react_fiber_hooks_use_memo_cache_1.useMemoCache;
    }
    if (react_feature_flags_1.enableUseEffectEventHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender.useEffectEvent = function useEffectEvent(callback) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_event_1.updateEvent)(callback);
        };
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
        function useFormState(action, initialState, permalink) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_form_state_1.rerenderFormState)(action, initialState, permalink);
        }
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender.useFormState = useFormState;
    }
    if (react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onRerender.useOptimistic = function useOptimistic(passthrough, reducer) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_optimistic_1.rerenderOptimistic)(passthrough, reducer);
        };
    }
    react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount = {
        readContext: function (context) {
            warnInvalidContextAccess_1();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        use: function (usable) {
            warnInvalidHookAccess_1();
            return (0, react_fiber_hooks_use_1.use)(usable);
        },
        useCallback: function (callback, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_callback_1.mountCallback)(callback, deps);
        },
        useContext: function (context) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useContext";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        useEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_effect_1.mountEffect)(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_imperative_handle_1.mountImperativeHandle)(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_inseration_effect_1.mountInsertionEffect)(create, deps);
        },
        useLayoutEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_layout_effect_1.mountLayoutEffect)(create, deps);
        },
        useMemo: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_memo_1.mountMemo)(create, deps);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useReducer: function (reducer, initialArg, init) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_reducer_1.mountReducer)(reducer, initialArg, init);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useRef: function (initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useRef";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_ref_1.mountRef)(initialValue);
        },
        useState: function (initialState) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useState";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount;
            try {
                return (0, react_fiber_hooks_use_state_1.mountState)(initialState);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useDebugValue: function (value, formatterFn) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_debug_value_1.mountDebugValue)(value, formatterFn);
        },
        useDeferredValue: function (value, initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_deferred_value_1.mountDeferredValue)(value, initialValue);
        },
        useTransition: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_transaction_1.mountTransition)();
        },
        useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_sync_external_store_1.mountSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        },
        useId: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useId";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_id_1.mountId)();
        }
    };
    if (react_feature_flags_1.enableCache) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount.useCacheRefresh = function useCacheRefresh() {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_refresh_1.mountRefresh)();
        };
    }
    if (react_feature_flags_1.enableUseMemoCacheHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount.useMemoCache = function (size) {
            warnInvalidHookAccess_1();
            return (0, react_fiber_hooks_use_memo_cache_1.useMemoCache)(size);
        };
    }
    if (react_feature_flags_1.enableUseEffectEventHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount.useEffectEvent = function useEffectEvent(callback) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_effect_event_1.mountEvent)(callback);
        };
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
        function useFormState(action, initialState, permalink) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_form_state_1.mountFormState)(action, initialState, permalink);
        }
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount.useFormState = useFormState;
    }
    if (react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount.useOptimistic = function useOptimistic(passthrough, reducer) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            warnInvalidHookAccess_1();
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_optimistic_1.mountOptimistic)(passthrough, reducer);
        };
    }
    react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate = {
        readContext: function (context) {
            warnInvalidContextAccess_1();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        use: function (usable) {
            warnInvalidHookAccess_1();
            return (0, react_fiber_hooks_use_1.use)(usable);
        },
        useCallback: function (callback, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_callback_1.updateCallback)(callback, deps);
        },
        useContext: function (context) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useContext";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        useEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_1.updateEffect)(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_imperative_handle_1.updateImperativeHandle)(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_inseration_effect_1.updateInsertionEffect)(create, deps);
        },
        useLayoutEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_layout_effect_1.updateLayoutEffect)(create, deps);
        },
        useMemo: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_memo_1.updateMemo)(create, deps);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useReducer: function (reducer, initialArg, init) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_reducer_1.updateReducer)(reducer, initialArg, init);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useRef: function (initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useRef";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_ref_1.updateRef)(initialValue);
        },
        useState: function (initialState) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useState";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_state_1.updateState)(initialState);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useDebugValue: function (value, formatterFn) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_debug_value_1.updateDebugValue)(value, formatterFn);
        },
        useDeferredValue: function (value, initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_deferred_value_1.updateDeferredValue)(value, initialValue);
        },
        useTransition: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_transaction_1.updateTransition)();
        },
        useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_sync_external_store_1.updateSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        },
        useId: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useId";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_id_1.updateId)();
        }
    };
    if (react_feature_flags_1.enableCache) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate.useCacheRefresh = function useCacheRefresh() {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_refresh_1.updateRefresh)();
        };
    }
    if (react_feature_flags_1.enableUseMemoCacheHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate.useMemoCache = function (size) {
            warnInvalidHookAccess_1();
            return (0, react_fiber_hooks_use_memo_cache_1.useMemoCache)(size);
        };
    }
    if (react_feature_flags_1.enableUseEffectEventHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate.useEffectEvent = function useEffectEvent(callback) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_event_1.updateEvent)(callback);
        };
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
        function useFormState(action, initialState, permalink) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_form_state_1.updateFormState)(action, initialState, permalink);
        }
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate.useFormState = useFormState;
    }
    if (react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate.useOptimistic = function useOptimistic(passthrough, reducer) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_optimistic_1.updateOptimistic)(passthrough, reducer);
        };
    }
    react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer = {
        readContext: function (context) {
            warnInvalidContextAccess_1();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        use: function (usable) {
            warnInvalidHookAccess_1();
            return (0, react_fiber_hooks_use_1.use)(usable);
        },
        useCallback: function (callback, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCallback";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_callback_1.updateCallback)(callback, deps);
        },
        useContext: function (context) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useContext";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_new_context_1.readContext)(context);
        },
        useEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffect";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_1.updateEffect)(create, deps);
        },
        useImperativeHandle: function (ref, create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_imperative_handle_1.updateImperativeHandle)(ref, create, deps);
        },
        useInsertionEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_inseration_effect_1.updateInsertionEffect)(create, deps);
        },
        useLayoutEffect: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_layout_effect_1.updateLayoutEffect)(create, deps);
        },
        useMemo: function (create, deps) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useMemo";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_memo_1.updateMemo)(create, deps);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useReducer: function (reducer, initialArg, init) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useReducer";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_reducer_1.rerenderReducer)(reducer, initialArg, init);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useRef: function (initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useRef";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_ref_1.updateRef)(initialValue);
        },
        useState: function (initialState) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useState";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            var prevDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate;
            try {
                return (0, react_fiber_hooks_use_state_1.rerenderState)(initialState);
            }
            finally {
                ReactCurrentDispatcher.current = prevDispatcher;
            }
        },
        useDebugValue: function (value, formatterFn) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDebugValue";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_debug_value_1.updateDebugValue)(value, formatterFn);
        },
        useDeferredValue: function (value, initialValue) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useDeferredValue";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_deferred_value_1.rerenderDeferredValue)(value, initialValue);
        },
        useTransition: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useTransition";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_transaction_1.rerenderTransition)();
        },
        useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_sync_external_store_1.updateSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
        },
        useId: function () {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useId";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_id_1.updateId)();
        }
    };
    if (react_feature_flags_1.enableCache) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer.useCacheRefresh = function useCacheRefresh() {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_refresh_1.updateRefresh)();
        };
    }
    if (react_feature_flags_1.enableUseMemoCacheHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer.useMemoCache = function (size) {
            warnInvalidHookAccess_1();
            return (0, react_fiber_hooks_use_memo_cache_1.useMemoCache)(size);
        };
    }
    if (react_feature_flags_1.enableUseEffectEventHook) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer.useEffectEvent = function useEffectEvent(callback) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useEffectEvent";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_effect_event_1.updateEvent)(callback);
        };
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer.useHostTransitionStatus = react_fiber_hooks_use_host_transaction_status_1.useHostTransitionStatus;
        function useFormState(action, initialState, permalink) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useFormState";
            mountHookTypesDev();
            return (0, react_fiber_hooks_use_form_state_1.rerenderFormState)(action, initialState, permalink);
        }
        ;
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer.useFormState = useFormState;
    }
    if (react_feature_flags_1.enableAsyncActions) {
        react_fiber_hooks_shared_1.ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer.useOptimistic = function useOptimistic(passthrough, reducer) {
            react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookNameInDev = "useOptimistic";
            warnInvalidHookAccess_1();
            updateHookTypesDev();
            return (0, react_fiber_hooks_use_optimistic_1.rerenderOptimistic)(passthrough, reducer);
        };
    }
}
function renderWithHooks(current, workInProgress, Component, props, secondArg, nextRenderLanes) {
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderLanes = nextRenderLanes;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber = workInProgress;
    if (__DEV__) {
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev = current !== null ? current._debugHookTypes : null;
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        // Used for hot reloading:
        react_fiber_hooks_shared_1.ReactFiberHooksInfra.ignorePreviousDependencies = current !== null && current.type !== workInProgress.type;
    }
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;
    workInProgress.lanes = fiber_lane_constants_1.NoLanes;
    // The following should have already been reset
    // ReactFiberHooksCurrent.hook = null;
    // ReactFiberHooksCurrent.workInProgressHook = null;
    // ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = false;
    // ReactFiberHooksCurrent.localIdCounter = 0;
    // ReactFiberHooksCurrent.thenableIndexCounter = 0;
    // ReactFiberHooksCurrent.thenableState = null;
    // TODO Warn if no hooks are used at all during mount, then some are used during update.
    // Currently we will identify the update render as a mount because memoizedState === null.
    // This is tricky because it's valid for certain types of components (e.g. React.lazy)
    // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
    // Non-stateful hooks (e.g. context) don't get added to memoizedState,
    // so memoizedState would be null during updates and mounts.
    if (__DEV__) {
        if (current !== null && current.memoizedState !== null) {
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onUpdate;
        }
        else if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesDev !== null) {
            // This dispatcher handles an edge case where a component is updating,
            // but no stateful hooks have been used.
            // We want to match the production code behavior (which will use HooksDispatcherOnMount),
            // but with the extra DEV validation to ensure hooks ordering hasn't changed.
            // This dispatcher does that.
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMountWithHookTypes;
        }
        else {
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount;
        }
    }
    else {
        ReactCurrentDispatcher.current = current === null || current.memoizedState === null ?
            react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount :
            react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onUpdate;
    }
    // In Strict Mode, during development, user functions are double invoked to
    // help detect side effects. The logic for how this is implemented for in
    // hook components is a bit complex so let's break it down.
    //
    // We will invoke the entire component function twice. However, during the
    // second invocation of the component, the hook state from the first
    // invocation will be reused. That means things like `useMemo` functions won't
    // run again, because the deps will match and the memoized result will
    // be reused.
    //
    // We want memoized functions to run twice, too, so account for this, user
    // functions are double invoked during the *first* invocation of the component
    // function, and are *not* double invoked during the second incovation:
    //
    // - First execution of component function: user functions are double invoked
    // - Second execution of component function (in Strict Mode, during
    //   development): user functions are not double invoked.
    //
    // This is intentional for a few reasons; most importantly, it's because of
    // how `use` works when something suspends: it reuses the promise that was
    // passed during the first attempt. This is itself a form of memoization.
    // We need to be able to memoize the reactive inputs to the `use` call using
    // a hook (i.e. `useMemo`), which means, the reactive inputs to `use` must
    // come from the same component invocation as the output.
    //
    // There are plenty of tests to ensure this behavior is correct.
    var shouldDoubleRenderDEV = __DEV__ && react_feature_flags_1.debugRenderPhaseSideEffectsForStrictMode && (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) !== type_of_mode_1.TypeOfMode.NoMode;
    react_fiber_hooks_shared_1.ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV = shouldDoubleRenderDEV;
    var children = Component(props, secondArg);
    react_fiber_hooks_shared_1.ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV = false;
    // Check if there was a render phase update
    if (react_fiber_hooks_shared_1.ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass) {
        // Keep rendering until the component stabilizes (there are no more render
        // phase updates).
        children = renderWithHooksAgain(workInProgress, Component, props, secondArg);
    }
    if (shouldDoubleRenderDEV) {
        // In development, components are invoked twice to help detect side effects.
        (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(true);
        try {
            children = renderWithHooksAgain(workInProgress, Component, props, secondArg);
        }
        finally {
            (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(false);
        }
    }
    finishRenderingHooks(current, workInProgress, Component);
    return children;
}
exports.renderWithHooks = renderWithHooks;
function replaySuspendedComponentWithHooks(current, workInProgress, Component, props, secondArg) {
    // This function is used to replay a component that previously suspended,
    // after its data resolves.
    //
    // It's a simplified version of renderWithHooks, but it doesn't need to do
    // most of the set up work because they weren't reset when we suspended; they
    // only get reset when the component either completes (finishRenderingHooks)
    // or unwinds (resetHooksOnUnwind).
    if (__DEV__) {
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.hookTypesUpdateIndexDev = -1;
        // Used for hot reloading:
        react_fiber_hooks_shared_1.ReactFiberHooksInfra.ignorePreviousDependencies = current !== null && current.type !== workInProgress.type;
    }
    var children = renderWithHooksAgain(workInProgress, Component, props, secondArg);
    finishRenderingHooks(current, workInProgress, Component);
    return children;
}
exports.replaySuspendedComponentWithHooks = replaySuspendedComponentWithHooks;
function renderTransitionAwareHostComponentWithHooks(current, workInProgress, lanes) {
    if (!(react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions)) {
        throw new Error("Not implemented.");
    }
    return renderWithHooks(current, workInProgress, transitionAwareHostComponent, null, null, lanes);
}
exports.renderTransitionAwareHostComponentWithHooks = renderTransitionAwareHostComponentWithHooks;
// TODO: Remove exports if they end up not being used.
function transitionAwareHostComponent() {
    if (!(react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions)) {
        throw new Error("Not implemented.");
    }
    var dispatcher = ReactCurrentDispatcher.current;
    if (!dispatcher) {
        throw new Error("Invalid dispatcher");
    }
    var maybeThenable = dispatcher.useState()[0];
    if (typeof maybeThenable.then === "function") {
        var thenable = maybeThenable;
        return (0, react_fiber_hooks_use_1.useThenable)(thenable);
    }
    else {
        // @ts-ignore
        var status_1 = maybeThenable;
        return status_1;
    }
}
exports.transitionAwareHostComponent = transitionAwareHostComponent;
function checkDidRenderIdHook() {
    // This should be called immediately after every renderWithHooks call.
    // Conceptually, it's part of the return value of renderWithHooks; it's only a
    // separate function to avoid using an array tuple.
    var didRenderIdHook = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.localIdCounter !== 0;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.localIdCounter = 0;
    return didRenderIdHook;
}
exports.checkDidRenderIdHook = checkDidRenderIdHook;
function bailoutHooks(current, workInProgress, lanes) {
    workInProgress.updateQueue = current.updateQueue;
    // TODO: Don't need to reset the flags here, because they're reset in the
    // complete phase (bubbleProperties).
    if (__DEV__ && (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictEffectsMode) !== type_of_mode_1.TypeOfMode.NoMode) {
        workInProgress.flags &= ~(fiber_flags_1.FiberFlags.MountPassiveDev | fiber_flags_1.FiberFlags.MountLayoutDev | fiber_flags_1.FiberFlags.Passive | fiber_flags_1.FiberFlags.Update);
    }
    else {
        workInProgress.flags &= ~(fiber_flags_1.FiberFlags.Passive | fiber_flags_1.FiberFlags.Update);
    }
    current.lanes = (0, react_fiber_lane_1.removeLanes)(current.lanes, lanes);
}
exports.bailoutHooks = bailoutHooks;
function resetHooksAfterThrow() {
    // This is called immediaetly after a throw. It shouldn't reset the entire
    // module state, because the work loop might decide to replay the component
    // again without rewinding.
    //
    // It should only reset things like the current dispatcher, to prevent hooks
    // from being called outside of a component.
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber = null;
    // We can assume the previous dispatcher is always this one, since we set it
    // at the beginning of the render phase and there's no re-entrance.
    ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.contextOnly;
}
exports.resetHooksAfterThrow = resetHooksAfterThrow;
function startHostTransition(formFiber, pendingState, callback, formData) {
    if (!react_feature_flags_1.enableFormActions) {
        // Not implemented.
        return;
    }
    if (!react_feature_flags_1.enableAsyncActions) {
        // Form actions are enabled, but async actions are not. Call the function,
        // but don't handle any pending or error states.
        callback(formData);
        return;
    }
    if (formFiber.tag !== work_tags_1.WorkTag.HostComponent) {
        throw new Error("Expected the form instance to be a HostComponent. This " + "is a bug in React.");
    }
    var queue;
    if (formFiber.memoizedState === null) {
        // Upgrade this host component fiber to be stateful. We're going to pretend
        // it was stateful all along so we can reuse most of the implementation
        // for function components and useTransition.
        //
        // Create the state hook used by TransitionAwareHostComponent. This is
        // essentially an inlined version of mountState.
        var newQueue = {
            pending: null,
            lanes: fiber_lane_constants_1.NoLanes,
            // We're going to cheat and intentionally not create a bound dispatch
            // method, because we can call it directly in startTransition.
            dispatch: null,
            lastRenderedReducer: react_fiber_hooks_use_state_1.basicStateReducer,
            lastRenderedState: NoPendingHostTransition
        };
        queue = newQueue;
        var stateHook = {
            memoizedState: NoPendingHostTransition,
            baseState: NoPendingHostTransition,
            baseQueue: null,
            queue: newQueue,
            next: null
        };
        // Add the state hook to both fiber alternates. The idea is that the fiber
        // had this hook all along.
        formFiber.memoizedState = stateHook;
        var alternate = formFiber.alternate;
        if (alternate !== null) {
            alternate.memoizedState = stateHook;
        }
    }
    else {
        // This fiber was already upgraded to be stateful.
        var stateHook = formFiber.memoizedState;
        queue = stateHook.queue;
    }
    (0, react_fiber_hooks_use_transaction_1.startTransition)(formFiber, queue, pendingState, NoPendingHostTransition, // TODO: We can avoid this extra wrapper, somehow. Figure out layering
    // once more of this function is implemented.
    function () { return callback(formData); });
}
exports.startHostTransition = startHostTransition;
