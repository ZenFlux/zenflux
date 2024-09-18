"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginWork = exports.replayFunctionComponent = exports.reconcileChildren = void 0;
var check_prop_types_1 = require("@zenflux/react-shared/src/check-prop-types");
var get_component_name_from_type_1 = require("@zenflux/react-shared/src/get-component-name-from-type");
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var shallow_equal_1 = require("@zenflux/react-shared/src/shallow-equal");
var offscreen_1 = require("@zenflux/react-shared/src/react-internal-constants/offscreen");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var transition_1 = require("@zenflux/react-shared/src/react-internal-constants/transition");
var react_captured_value_1 = require("@zenflux/react-reconciler/src/react-captured-value");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
var react_fiber_cache_component_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component");
var react_fiber_cache_component_provider_1 = require("@zenflux/react-reconciler/src/react-fiber-cache-component-provider");
var react_fiber_child_1 = require("@zenflux/react-reconciler/src/react-fiber-child");
var react_fiber_class_component_1 = require("@zenflux/react-reconciler/src/react-fiber-class-component");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_context_1 = require("@zenflux/react-reconciler/src/react-fiber-context");
var react_fiber_create_from_offscreen_1 = require("@zenflux/react-reconciler/src/react-fiber-create-from-offscreen");
var react_fiber_create_utils_1 = require("@zenflux/react-reconciler/src/react-fiber-create-utils");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_from_create_type_n_props_1 = require("@zenflux/react-reconciler/src/react-fiber-from-create-type-n-props");
var react_fiber_hidden_context_1 = require("@zenflux/react-reconciler/src/react-fiber-hidden-context");
var react_fiber_hooks_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks");
var react_fiber_host_context_1 = require("@zenflux/react-reconciler/src/react-fiber-host-context");
var react_fiber_hot_reloading_resvole_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole");
var react_fiber_hydration_context_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context");
var react_fiber_hydration_context_try_claim_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-try-claim");
var react_fiber_hydration_error_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-error");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_lazy_component_1 = require("@zenflux/react-reconciler/src/react-fiber-lazy-component");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_suspense_component_1 = require("@zenflux/react-reconciler/src/react-fiber-suspense-component");
var react_fiber_suspense_context_1 = require("@zenflux/react-reconciler/src/react-fiber-suspense-context");
var react_fiber_throw_error_update_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-error-update");
var react_fiber_tracing_marker_component_1 = require("@zenflux/react-reconciler/src/react-fiber-tracing-marker-component");
var react_fiber_transition_1 = require("@zenflux/react-reconciler/src/react-fiber-transition");
var react_fiber_tree_context_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_in_progress_ex_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-ex");
var react_fiber_work_in_progress_receive_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-receive-update");
var react_fiber_work_in_progress_render_did_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-render-did");
var react_fiber_work_retry_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-work-retry-boundary");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var react_fiber_work_selective_hydration_exception_1 = require("@zenflux/react-reconciler/src/react-fiber-work-selective-hydration-exception");
var react_fiber_work_warn_about_reassigning_props_1 = require("@zenflux/react-reconciler/src/react-fiber-work-warn-about-reassigning-props");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_strict_mode_warnings_1 = require("@zenflux/react-reconciler/src/react-strict-mode-warnings");
var react_fiber_should_suspend_1 = require("@zenflux/react-reconciler/src/react-fiber-should-suspend");
var react_fiber_should_error_1 = require("@zenflux/react-reconciler/src/react-fiber-should-error");
var _a = globalThis.__RECONCILER__CONFIG__, createHoistableInstance = _a.createHoistableInstance, getResource = _a.getResource, getSuspenseInstanceFallbackErrorDetails = _a.getSuspenseInstanceFallbackErrorDetails, isPrimaryRenderer = _a.isPrimaryRenderer, isSuspenseInstanceFallback = _a.isSuspenseInstanceFallback, isSuspenseInstancePending = _a.isSuspenseInstancePending, registerSuspenseInstanceRetry = _a.registerSuspenseInstanceRetry, shouldSetTextContent = _a.shouldSetTextContent, supportsHydration = _a.supportsHydration, supportsResources = _a.supportsResources, supportsSingletons = _a.supportsSingletons;
var ReactCurrentOwner = react_shared_internals_1.default.ReactCurrentOwner;
// A special exception that's used to unwind the stack when an update flows
// into a dehydrated boundary.
var didWarnAboutBadClass;
var didWarnAboutModulePatternComponent;
var didWarnAboutContextTypeOnFunctionComponent;
var didWarnAboutGetDerivedStateOnFunctionComponent;
var didWarnAboutFunctionRefs;
var didWarnAboutRevealOrder;
var didWarnAboutTailOptions;
var didWarnAboutDefaultPropsOnFunctionComponent;
if (__DEV__) {
    didWarnAboutBadClass = {};
    didWarnAboutModulePatternComponent = {};
    didWarnAboutContextTypeOnFunctionComponent = {};
    didWarnAboutGetDerivedStateOnFunctionComponent = {};
    didWarnAboutFunctionRefs = {};
    (0, react_fiber_work_warn_about_reassigning_props_1.clearWarningAboutReassigningProps)();
    didWarnAboutRevealOrder = {};
    didWarnAboutTailOptions = {};
    didWarnAboutDefaultPropsOnFunctionComponent = {};
}
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
    if (current === null) {
        // If this is a fresh new component that hasn't been rendered yet, we
        // won't update its child set by applying minimal side-effects. Instead,
        // we will add them all to the child before it gets rendered. That means
        // we can optimize this reconciliation pass by not tracking side-effects.
        workInProgress.child = (0, react_fiber_child_1.mountChildFibers)(workInProgress, null, nextChildren, renderLanes);
    }
    else {
        // If the current child is the same as the work in progress, it means that
        // we haven't yet started any work on these children. Therefore, we use
        // the clone algorithm to create a copy of all the current children.
        // If we had any progressed work already, that is invalid at this point so
        // let's throw it out.
        workInProgress.child = (0, react_fiber_child_1.reconcileChildFibers)(workInProgress, current.child, nextChildren, renderLanes);
    }
}
exports.reconcileChildren = reconcileChildren;
function forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderLanes) {
    // This function is fork of reconcileChildren. It's used in cases where we
    // want to reconcile without matching against the existing set. This has the
    // effect of all current children being unmounted; even if the type and key
    // are the same, the old child is unmounted and a new child is created.
    //
    // To do this, we're going to go through the reconcile algorithm twice. In
    // the first pass, we schedule a deletion for all the current children by
    // passing null.
    workInProgress.child = (0, react_fiber_child_1.reconcileChildFibers)(workInProgress, current.child, null, renderLanes);
    // In the second pass, we mount the new children. The trick here is that we
    // pass null in place of where we usually pass the current child set. This has
    // the effect of remounting all children regardless of whether their
    // identities match.
    workInProgress.child = (0, react_fiber_child_1.reconcileChildFibers)(workInProgress, null, nextChildren, renderLanes);
}
function updateForwardRef(current, workInProgress, Component, nextProps, renderLanes) {
    // TODO: current can be non-null here even if the component
    // hasn't yet mounted. This happens after the first render suspends.
    // We'll need to figure out if this is fine or can cause issues.
    if (__DEV__) {
        if (workInProgress.type !== workInProgress.elementType) {
            // Lazy component props can't be validated in createElement
            // because they're only guaranteed to be resolved here.
            var innerPropTypes = Component.propTypes;
            if (innerPropTypes) {
                (0, check_prop_types_1.default)(innerPropTypes, nextProps, // Resolved props
                "prop", (0, get_component_name_from_type_1.default)(Component));
            }
        }
    }
    var render = Component.render;
    var ref = workInProgress.ref;
    // The rest is a fork of updateFunctionComponent
    var nextChildren;
    var hasId;
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStarted)(workInProgress);
    }
    if (__DEV__) {
        ReactCurrentOwner.current = workInProgress;
        (0, react_current_fiber_1.setIsRendering)(true);
        nextChildren = (0, react_fiber_hooks_1.renderWithHooks)(current, workInProgress, render, nextProps, ref, renderLanes);
        hasId = (0, react_fiber_hooks_1.checkDidRenderIdHook)();
        (0, react_current_fiber_1.setIsRendering)(false);
    }
    else {
        nextChildren = (0, react_fiber_hooks_1.renderWithHooks)(current, workInProgress, render, nextProps, ref, renderLanes);
        hasId = (0, react_fiber_hooks_1.checkDidRenderIdHook)();
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStopped)();
    }
    if (current !== null && !(0, react_fiber_work_in_progress_receive_update_1.didWorkInProgressReceiveUpdate)()) {
        (0, react_fiber_hooks_1.bailoutHooks)(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)() && hasId) {
        (0, react_fiber_tree_context_1.pushMaterializedTreeId)(workInProgress);
    }
    // React DevTools reads this flag.
    workInProgress.flags |= fiber_flags_1.FiberFlags.PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function updateMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
    if (current === null) {
        var type = Component.type;
        if ((0, react_fiber_create_utils_1.isSimpleFunctionComponent)(type) && Component.compare === null && // SimpleMemoComponent codepath doesn't resolve outer props either.
            Component.defaultProps === undefined) {
            var resolvedType = type;
            if (__DEV__) {
                resolvedType = (0, react_fiber_hot_reloading_resvole_1.resolveFunctionForHotReloading)(type);
            }
            // If this is a plain function component without default props,
            // and with only the default shallow comparison, we upgrade it
            // to a SimpleMemoComponent to allow fast path updates.
            workInProgress.tag = work_tags_1.WorkTag.SimpleMemoComponent;
            workInProgress.type = resolvedType;
            if (__DEV__) {
                validateFunctionComponentInDev(workInProgress, type);
            }
            return updateSimpleMemoComponent(current, workInProgress, resolvedType, nextProps, renderLanes);
        }
        if (__DEV__) {
            var innerPropTypes = type.propTypes;
            if (innerPropTypes) {
                // Inner memo component props aren't currently validated in createElement.
                // We could move it there, but we'd still need this for lazy code path.
                (0, check_prop_types_1.default)(innerPropTypes, nextProps, // Resolved props
                "prop", (0, get_component_name_from_type_1.default)(type));
            }
            if (Component.defaultProps !== undefined) {
                var componentName = (0, get_component_name_from_type_1.default)(type) || "Unknown";
                if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
                    console.error("%s: Support for defaultProps will be removed from memo components " + "in a future major release. Use JavaScript default parameters instead.", componentName);
                    didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
                }
            }
        }
        var child = (0, react_fiber_from_create_type_n_props_1.createFiberFromTypeAndProps)(Component.type, null, nextProps, null, workInProgress, workInProgress.mode, renderLanes);
        child.ref = workInProgress.ref;
        child.return = workInProgress;
        workInProgress.child = child;
        return child;
    }
    if (__DEV__) {
        var type = Component.type;
        var innerPropTypes = type.propTypes;
        if (innerPropTypes) {
            // Inner memo component props aren't currently validated in createElement.
            // We could move it there, but we'd still need this for lazy code path.
            (0, check_prop_types_1.default)(innerPropTypes, nextProps, // Resolved props
            "prop", (0, get_component_name_from_type_1.default)(type));
        }
    }
    var currentChild = current.child; // This is always exactly one child
    var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
    if (!hasScheduledUpdateOrContext) {
        // This will be the props with resolved defaultProps,
        // unlike current.memoizedProps which will be the unresolved ones.
        var prevProps = currentChild.memoizedProps;
        // Default to shallow comparison
        var compare = Component.compare;
        compare = compare !== null ? compare : shallow_equal_1.default;
        if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
            return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
        }
    }
    // React DevTools reads this flag.
    workInProgress.flags |= fiber_flags_1.FiberFlags.PerformedWork;
    var newChild = (0, react_fiber_work_in_progress_ex_1.createWorkInProgress)(currentChild, nextProps);
    newChild.ref = workInProgress.ref;
    newChild.return = workInProgress;
    workInProgress.child = newChild;
    return newChild;
}
function updateSimpleMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
    // TODO: current can be non-null here even if the component
    // hasn't yet mounted. This happens when the inner render suspends.
    // We'll need to figure out if this is fine or can cause issues.
    if (__DEV__) {
        if (workInProgress.type !== workInProgress.elementType) {
            // Lazy component props can't be validated in createElement
            // because they're only guaranteed to be resolved here.
            var outerMemoType = workInProgress.elementType;
            if (outerMemoType.$$typeof === react_symbols_1.REACT_LAZY_TYPE) {
                // We warn when you define propTypes on lazy()
                // so let's just skip over it to find memo() outer wrapper.
                // Inner props for memo are validated later.
                var lazyComponent = outerMemoType;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                    outerMemoType = init(payload);
                }
                catch (x) {
                    outerMemoType = null;
                }
                // Inner propTypes will be validated in the function component path.
                var outerPropTypes = outerMemoType && outerMemoType.propTypes;
                if (outerPropTypes) {
                    (0, check_prop_types_1.default)(outerPropTypes, nextProps, // Resolved (SimpleMemoComponent has no defaultProps)
                    "prop", (0, get_component_name_from_type_1.default)(outerMemoType));
                }
            }
        }
    }
    if (current !== null) {
        var prevProps = current.memoizedProps;
        if ((0, shallow_equal_1.default)(prevProps, nextProps) && current.ref === workInProgress.ref && ( // Prevent bailout if the implementation changed due to hot reload.
        __DEV__ ? workInProgress.type === current.type : true)) {
            (0, react_fiber_work_in_progress_receive_update_1.resetWorkInProgressReceivedUpdate)();
            // The props are shallowly equal. Reuse the previous props object, like we
            // would during a normal fiber bailout.
            //
            // We don't have strong guarantees that the props object is referentially
            // equal during updates where we can't bail out anyway — like if the props
            // are shallowly equal, but there's a local state or context update in the
            // same batch.
            //
            // However, as a principle, we should aim to make the behavior consistent
            // across different ways of memoizing a component. For example, React.memo
            // has a different internal Fiber layout if you pass a normal function
            // component (SimpleMemoComponent) versus if you pass a different type
            // like forwardRef (MemoComponent). But this is an implementation detail.
            // Wrapping a component in forwardRef (or React.lazy, etc) shouldn't
            // affect whether the props object is reused during a bailout.
            workInProgress.pendingProps = nextProps = prevProps;
            if (!checkScheduledUpdateOrContext(current, renderLanes)) {
                // The pending lanes were cleared at the beginning of beginWork. We're
                // about to bail out, but there might be other lanes that weren't
                // included in the current render. Usually, the priority level of the
                // remaining updates is accumulated during the evaluation of the
                // component (i.e. when processing the update queue). But since since
                // we're bailing out early *without* evaluating the component, we need
                // to account for it here, too. Reset to the value of the current fiber.
                // NOTE: This only applies to SimpleMemoComponent, not MemoComponent,
                // because a MemoComponent fiber does not have hooks or an update queue;
                // rather, it wraps around an inner component, which may or may not
                // contains hooks.
                // TODO: Move the reset at in beginWork out of the common path so that
                // this is no longer necessary.
                workInProgress.lanes = current.lanes;
                return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
            }
            else if ((current.flags & fiber_flags_1.FiberFlags.ForceUpdateForLegacySuspense) !== fiber_flags_1.FiberFlags.NoFlags) {
                // This is a special case that only exists for legacy mode.
                // See https://github.com/facebook/react/pull/19216.
                (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
            }
        }
    }
    return updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes);
}
function updateOffscreenComponent(current, workInProgress, renderLanes) {
    var nextProps = workInProgress.pendingProps;
    var nextChildren = nextProps.children;
    var nextIsDetached = (workInProgress.stateNode._pendingVisibility & offscreen_1.OffscreenDetached) !== 0;
    var prevState = current !== null ? current.memoizedState : null;
    markRef(current, workInProgress);
    if (nextProps.mode === "hidden" || react_feature_flags_1.enableLegacyHidden && nextProps.mode === "unstable-defer-without-hiding" || nextIsDetached) {
        // Rendering a hidden tree.
        var didSuspend = (workInProgress.flags & fiber_flags_1.FiberFlags.DidCapture) !== fiber_flags_1.FiberFlags.NoFlags;
        if (didSuspend) {
            // Something suspended inside a hidden tree
            // Include the base lanes from the last render
            var nextBaseLanes = prevState !== null ? (0, react_fiber_lane_1.mergeLanes)(prevState.baseLanes, renderLanes) : renderLanes;
            if (current !== null) {
                // Reset to the current children
                var currentChild = workInProgress.child = current.child;
                // The current render suspended, but there may be other lanes with
                // pending work. We can't read `childLanes` from the current Offscreen
                // fiber because we reset it when it was deferred; however, we can read
                // the pending lanes from the child fibers.
                var currentChildLanes = fiber_lane_constants_1.NoLanes;
                while (currentChild !== null) {
                    currentChildLanes = (0, react_fiber_lane_1.mergeLanes)((0, react_fiber_lane_1.mergeLanes)(currentChildLanes, currentChild.lanes), currentChild.childLanes);
                    currentChild = currentChild.sibling;
                }
                var lanesWeJustAttempted = nextBaseLanes;
                var remainingChildLanes = (0, react_fiber_lane_1.removeLanes)(currentChildLanes, lanesWeJustAttempted);
                workInProgress.childLanes = remainingChildLanes;
            }
            else {
                workInProgress.childLanes = fiber_lane_constants_1.NoLanes;
                workInProgress.child = null;
            }
            return deferHiddenOffscreenComponent(current, workInProgress, nextBaseLanes, renderLanes);
        }
        if ((workInProgress.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
            // In legacy sync mode, don't defer the subtree. Render it now.
            // TODO: Consider how Offscreen should work with transitions in the future
            var nextState = {
                baseLanes: fiber_lane_constants_1.NoLanes,
                cachePool: null
            };
            workInProgress.memoizedState = nextState;
            if (react_feature_flags_1.enableCache) {
                // push the cache pool even though we're going to bail out
                // because otherwise there'd be a context mismatch
                if (current !== null) {
                    (0, react_fiber_transition_1.pushTransition)(workInProgress, null, null);
                }
            }
            (0, react_fiber_hidden_context_1.reuseHiddenContextOnStack)(workInProgress);
            (0, react_fiber_suspense_context_1.pushOffscreenSuspenseHandler)(workInProgress);
        }
        else if (!(0, react_fiber_lane_1.includesSomeLane)(renderLanes, fiber_lane_constants_1.OffscreenLane)) {
            // We're hidden, and we're not rendering at Offscreen. We will bail out
            // and resume this tree later.
            // Schedule this fiber to re-render at Offscreen priority
            workInProgress.lanes = workInProgress.childLanes = (0, react_fiber_lane_1.laneToLanes)(fiber_lane_constants_1.OffscreenLane);
            // Include the base lanes from the last render
            var nextBaseLanes = prevState !== null ? (0, react_fiber_lane_1.mergeLanes)(prevState.baseLanes, renderLanes) : renderLanes;
            return deferHiddenOffscreenComponent(current, workInProgress, nextBaseLanes, renderLanes);
        }
        else {
            // This is the second render. The surrounding visible content has already
            // committed. Now we resume rendering the hidden tree.
            // Rendering at offscreen, so we can clear the base lanes.
            var nextState = {
                baseLanes: fiber_lane_constants_1.NoLanes,
                cachePool: null
            };
            workInProgress.memoizedState = nextState;
            if (react_feature_flags_1.enableCache && current !== null) {
                // If the render that spawned this one accessed the cache pool, resume
                // using the same cache. Unless the parent changed, since that means
                // there was a refresh.
                var prevCachePool = prevState !== null ? prevState.cachePool : null;
                // TODO: Consider if and how Offscreen pre-rendering should
                // be attributed to the transition that spawned it
                (0, react_fiber_transition_1.pushTransition)(workInProgress, prevCachePool, null);
            }
            // Push the lanes that were skipped when we bailed out.
            if (prevState !== null) {
                (0, react_fiber_hidden_context_1.pushHiddenContext)(workInProgress, prevState);
            }
            else {
                (0, react_fiber_hidden_context_1.reuseHiddenContextOnStack)(workInProgress);
            }
            (0, react_fiber_suspense_context_1.pushOffscreenSuspenseHandler)(workInProgress);
        }
    }
    else {
        // Rendering a visible tree.
        if (prevState !== null) {
            // We're going from hidden -> visible.
            var prevCachePool = null;
            if (react_feature_flags_1.enableCache) {
                // If the render that spawned this one accessed the cache pool, resume
                // using the same cache. Unless the parent changed, since that means
                // there was a refresh.
                prevCachePool = prevState.cachePool;
            }
            var transitions = null;
            if (react_feature_flags_1.enableTransitionTracing) {
                // We have now gone from hidden to visible, so any transitions should
                // be added to the stack to get added to any Offscreen/suspense children
                var instance = workInProgress.stateNode;
                if (instance !== null && instance._transitions != null) {
                    transitions = Array.from(instance._transitions);
                }
            }
            (0, react_fiber_transition_1.pushTransition)(workInProgress, prevCachePool, transitions);
            // Push the lanes that were skipped when we bailed out.
            (0, react_fiber_hidden_context_1.pushHiddenContext)(workInProgress, prevState);
            (0, react_fiber_suspense_context_1.reuseSuspenseHandlerOnStack)(workInProgress);
            // Since we're not hidden anymore, reset the state
            workInProgress.memoizedState = null;
        }
        else {
            // We weren't previously hidden, and we still aren't, so there's nothing
            // special to do. Need to push to the stack regardless, though, to avoid
            // a push/pop misalignment.
            if (react_feature_flags_1.enableCache) {
                // If the render that spawned this one accessed the cache pool, resume
                // using the same cache. Unless the parent changed, since that means
                // there was a refresh.
                if (current !== null) {
                    (0, react_fiber_transition_1.pushTransition)(workInProgress, null, null);
                }
            }
            // We're about to bail out, but we need to push this to the stack anyway
            // to avoid a push/pop misalignment.
            (0, react_fiber_hidden_context_1.reuseHiddenContextOnStack)(workInProgress);
            (0, react_fiber_suspense_context_1.reuseSuspenseHandlerOnStack)(workInProgress);
        }
    }
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function deferHiddenOffscreenComponent(current, workInProgress, nextBaseLanes, renderLanes) {
    var nextState = {
        baseLanes: nextBaseLanes,
        // Save the cache pool so we can resume later.
        cachePool: react_feature_flags_1.enableCache ? (0, react_fiber_transition_1.getOffscreenDeferredCache)() : null
    };
    workInProgress.memoizedState = nextState;
    if (react_feature_flags_1.enableCache) {
        // push the cache pool even though we're going to bail out
        // because otherwise there'd be a context mismatch
        if (current !== null) {
            (0, react_fiber_transition_1.pushTransition)(workInProgress, null, null);
        }
    }
    // We're about to bail out, but we need to push this to the stack anyway
    // to avoid a push/pop misalignment.
    (0, react_fiber_hidden_context_1.reuseHiddenContextOnStack)(workInProgress);
    (0, react_fiber_suspense_context_1.pushOffscreenSuspenseHandler)(workInProgress);
    if (react_feature_flags_1.enableLazyContextPropagation && current !== null) {
        // Since this tree will resume rendering in a separate render, we need
        // to propagate parent contexts now so we don't lose track of which
        // ones changed.
        (0, react_fiber_new_context_1.propagateParentContextChangesToDeferredTree)(current, workInProgress, renderLanes);
    }
    return null;
}
// Note: These happen to have identical begin phases, for now. We shouldn't hold
// ourselves to this constraint, though. If the behavior diverges, we should
// fork the function.
var updateLegacyHiddenComponent = updateOffscreenComponent;
function updateCacheComponent(current, workInProgress, renderLanes) {
    if (!react_feature_flags_1.enableCache) {
        return null;
    }
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    var parentCache = (0, react_fiber_new_context_1.readContext)(react_fiber_cache_component_1.CacheContext);
    if (current === null) {
        // Initial mount. Request a fresh cache from the pool.
        var freshCache = (0, react_fiber_transition_1.requestCacheFromPool)(renderLanes);
        var initialState = {
            parent: parentCache,
            cache: freshCache
        };
        workInProgress.memoizedState = initialState;
        (0, react_fiber_class_update_queue_1.initializeUpdateQueue)(workInProgress);
        (0, react_fiber_cache_component_provider_1.pushCacheProvider)(workInProgress, freshCache);
    }
    else {
        // Check for updates
        if ((0, react_fiber_lane_1.includesSomeLane)(current.lanes, renderLanes)) {
            (0, react_fiber_class_update_queue_1.cloneUpdateQueue)(current, workInProgress);
            (0, react_fiber_class_update_queue_1.processUpdateQueue)(workInProgress, null, null, renderLanes);
        }
        var prevState = current.memoizedState;
        var nextState = workInProgress.memoizedState;
        // Compare the new parent cache to the previous to see detect there was
        // a refresh.
        if (prevState.parent !== parentCache) {
            // Refresh in parent. Update the parent.
            var derivedState = {
                parent: parentCache,
                cache: parentCache
            };
            // Copied from getDerivedStateFromProps implementation. Once the update
            // queue is empty, persist the derived state onto the base state.
            workInProgress.memoizedState = derivedState;
            if (workInProgress.lanes === fiber_lane_constants_1.NoLanes) {
                var updateQueue = workInProgress.updateQueue;
                workInProgress.memoizedState = updateQueue.baseState = derivedState;
            }
            (0, react_fiber_cache_component_provider_1.pushCacheProvider)(workInProgress, parentCache); // No need to propagate a context change because the refreshed parent
            // already did.
        }
        else {
            // The parent didn't refresh. Now check if this cache did.
            var nextCache = nextState.cache;
            (0, react_fiber_cache_component_provider_1.pushCacheProvider)(workInProgress, nextCache);
            if (nextCache !== prevState.cache) {
                // This cache refreshed. Propagate a context change.
                (0, react_fiber_new_context_1.propagateContextChange)(workInProgress, react_fiber_cache_component_1.CacheContext, renderLanes);
            }
        }
    }
    var nextChildren = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
// This should only be called if the name changes
function updateTracingMarkerComponent(current, workInProgress, renderLanes) {
    if (!react_feature_flags_1.enableTransitionTracing) {
        return null;
    }
    // TODO: (luna) Only update the tracing marker if it's newly rendered or it's name changed.
    // A tracing marker is only associated with the transitions that rendered
    // or updated it, so we can create a new set of transitions each time
    if (current === null) {
        var currentTransitions = (0, react_fiber_transition_1.getPendingTransitions)();
        if (currentTransitions !== null) {
            var markerInstance = {
                tag: transition_1.TracingMarkerTag.TransitionTracingMarker,
                transitions: new Set(currentTransitions),
                pendingBoundaries: null,
                name: workInProgress.pendingProps.name,
                aborts: null
            };
            workInProgress.stateNode = markerInstance;
            // We call the marker complete callback when all child suspense boundaries resolve.
            // We do this in the commit phase on Offscreen. If the marker has no child suspense
            // boundaries, we need to schedule a passive effect to make sure we call the marker
            // complete callback.
            workInProgress.flags |= fiber_flags_1.FiberFlags.Passive;
        }
    }
    else {
        if (__DEV__) {
            if (current.memoizedProps.name !== workInProgress.pendingProps.name) {
                console.error("Changing the name of a tracing marker after mount is not supported. " + "To remount the tracing marker, pass it a new key.");
            }
        }
    }
    var instance = workInProgress.stateNode;
    if (instance !== null) {
        (0, react_fiber_tracing_marker_component_1.pushMarkerInstance)(workInProgress, instance);
    }
    var nextChildren = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function updateFragment(current, workInProgress, renderLanes) {
    var nextChildren = workInProgress.pendingProps;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function updateMode(current, workInProgress, renderLanes) {
    var nextChildren = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function updateProfiler(current, workInProgress, renderLanes) {
    if (react_feature_flags_1.enableProfilerTimer) {
        workInProgress.flags |= fiber_flags_1.FiberFlags.Update;
        if (react_feature_flags_1.enableProfilerCommitHooks) {
            // Reset effect durations for the next eventual effect phase.
            // These are reset during render to allow the DevTools commit hook a chance to read them,
            var stateNode = workInProgress.stateNode;
            stateNode.effectDuration = 0;
            stateNode.passiveEffectDuration = 0;
        }
    }
    var nextProps = workInProgress.pendingProps;
    var nextChildren = nextProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function markRef(current, workInProgress) {
    var ref = workInProgress.ref;
    if (current === null && ref !== null || current !== null && current.ref !== ref) {
        // Schedule a Ref effect
        workInProgress.flags |= fiber_flags_1.FiberFlags.Ref;
        workInProgress.flags |= fiber_flags_1.FiberFlags.RefStatic;
    }
}
function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {
    if (__DEV__) {
        if (workInProgress.type !== workInProgress.elementType) {
            // Lazy component props can't be validated in createElement
            // because they're only guaranteed to be resolved here.
            var innerPropTypes = Component.propTypes;
            if (innerPropTypes) {
                (0, check_prop_types_1.default)(innerPropTypes, nextProps, // Resolved props
                "prop", (0, get_component_name_from_type_1.default)(Component));
            }
        }
    }
    var context;
    if (!react_feature_flags_1.disableLegacyContext) {
        var unmaskedContext = (0, react_fiber_context_1.getUnmaskedContext)(workInProgress, Component, true);
        context = (0, react_fiber_context_1.getMaskedContext)(workInProgress, unmaskedContext);
    }
    var nextChildren;
    var hasId;
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStarted)(workInProgress);
    }
    if (__DEV__) {
        ReactCurrentOwner.current = workInProgress;
        (0, react_current_fiber_1.setIsRendering)(true);
        nextChildren = (0, react_fiber_hooks_1.renderWithHooks)(current, workInProgress, Component, nextProps, context, renderLanes);
        hasId = (0, react_fiber_hooks_1.checkDidRenderIdHook)();
        (0, react_current_fiber_1.setIsRendering)(false);
    }
    else {
        nextChildren = (0, react_fiber_hooks_1.renderWithHooks)(current, workInProgress, Component, nextProps, context, renderLanes);
        hasId = (0, react_fiber_hooks_1.checkDidRenderIdHook)();
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStopped)();
    }
    if (current !== null && !(0, react_fiber_work_in_progress_receive_update_1.didWorkInProgressReceiveUpdate)()) {
        (0, react_fiber_hooks_1.bailoutHooks)(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)() && hasId) {
        (0, react_fiber_tree_context_1.pushMaterializedTreeId)(workInProgress);
    }
    // React DevTools reads this flag.
    workInProgress.flags |= fiber_flags_1.FiberFlags.PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function replayFunctionComponent(current, workInProgress, nextProps, Component, secondArg, renderLanes) {
    // This function is used to replay a component that previously suspended,
    // after its data resolves. It's a simplified version of
    // updateFunctionComponent that reuses the hooks from the previous attempt.
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStarted)(workInProgress);
    }
    var nextChildren = (0, react_fiber_hooks_1.replaySuspendedComponentWithHooks)(current, workInProgress, Component, nextProps, secondArg);
    var hasId = (0, react_fiber_hooks_1.checkDidRenderIdHook)();
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStopped)();
    }
    if (current !== null && !(0, react_fiber_work_in_progress_receive_update_1.didWorkInProgressReceiveUpdate)()) {
        (0, react_fiber_hooks_1.bailoutHooks)(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)() && hasId) {
        (0, react_fiber_tree_context_1.pushMaterializedTreeId)(workInProgress);
    }
    // React DevTools reads this flag.
    workInProgress.flags |= fiber_flags_1.FiberFlags.PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
exports.replayFunctionComponent = replayFunctionComponent;
function updateClassComponent(current, workInProgress, Component, nextProps, renderLanes) {
    if (__DEV__) {
        // This is used by DevTools to force a boundary to error.
        switch ((0, react_fiber_should_error_1.shouldError)(workInProgress)) {
            case false: {
                var instance_1 = workInProgress.stateNode;
                var ctor = workInProgress.type;
                // TODO This way of resetting the error boundary state is a hack.
                // Is there a better way to do this?
                var tempInstance = new ctor(workInProgress.memoizedProps, instance_1.context);
                var state = tempInstance.state;
                instance_1.updater.enqueueSetState(instance_1, state, null);
                break;
            }
            case true: {
                workInProgress.flags |= fiber_flags_1.FiberFlags.DidCapture;
                workInProgress.flags |= fiber_flags_1.FiberFlags.ShouldCapture;
                // not-used: eslint-disable-next-line react-internal/prod-error-codes
                var error = new Error("Simulated error coming from DevTools");
                var lane = (0, react_fiber_lane_1.pickArbitraryLane)(renderLanes);
                workInProgress.lanes = (0, react_fiber_lane_1.mergeLanes)(workInProgress.lanes, lane);
                // Schedule the error boundary to re-render using updated state
                var update = (0, react_fiber_throw_error_update_1.createClassErrorUpdate)(workInProgress, (0, react_captured_value_1.createCapturedValueAtFiber)(error, workInProgress), lane);
                (0, react_fiber_class_update_queue_1.enqueueCapturedUpdate)(workInProgress, update);
                break;
            }
        }
        if (workInProgress.type !== workInProgress.elementType) {
            // Lazy component props can't be validated in createElement
            // because they're only guaranteed to be resolved here.
            var innerPropTypes = Component.propTypes;
            if (innerPropTypes) {
                (0, check_prop_types_1.default)(innerPropTypes, nextProps, // Resolved props
                "prop", (0, get_component_name_from_type_1.default)(Component));
            }
        }
    }
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    var hasContext;
    if ((0, react_fiber_context_1.isContextProvider)(Component)) {
        hasContext = true;
        (0, react_fiber_context_1.pushContextProvider)(workInProgress);
    }
    else {
        hasContext = false;
    }
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    var instance = workInProgress.stateNode;
    var shouldUpdate;
    if (instance === null) {
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress);
        // In the initial pass we might need to construct the instance.
        (0, react_fiber_class_component_1.constructClassInstance)(workInProgress, Component, nextProps);
        (0, react_fiber_class_component_1.mountClassInstance)(workInProgress, Component, nextProps, renderLanes);
        shouldUpdate = true;
    }
    else if (current === null) {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = (0, react_fiber_class_component_1.resumeMountClassInstance)(workInProgress, Component, nextProps, renderLanes);
    }
    else {
        shouldUpdate = (0, react_fiber_class_component_1.updateClassInstance)(current, workInProgress, Component, nextProps, renderLanes);
    }
    var nextUnitOfWork = finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderLanes);
    if (__DEV__) {
        var inst = workInProgress.stateNode;
        if (shouldUpdate && inst.props !== nextProps) {
            if (!(0, react_fiber_work_warn_about_reassigning_props_1.didWarnAboutReassigningProps)()) {
                console.error("It looks like %s is reassigning its own `this.props` while rendering. " + "This is not supported and can lead to confusing bugs.", (0, react_get_component_name_from_fiber_1.default)(workInProgress) || "a component");
            }
            (0, react_fiber_work_warn_about_reassigning_props_1.markWarningAboutReassigningProps)();
        }
    }
    return nextUnitOfWork;
}
function finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderLanes) {
    // Refs should update even if shouldComponentUpdate returns false
    markRef(current, workInProgress);
    var didCaptureError = (workInProgress.flags & fiber_flags_1.FiberFlags.DidCapture) !== fiber_flags_1.FiberFlags.NoFlags;
    if (!shouldUpdate && !didCaptureError) {
        // Context providers should defer to sCU for rendering
        if (hasContext) {
            (0, react_fiber_context_1.invalidateContextProvider)(workInProgress, Component, false);
        }
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    var instance = workInProgress.stateNode;
    // Rerender
    ReactCurrentOwner.current = workInProgress;
    var nextChildren;
    if (didCaptureError && typeof Component.getDerivedStateFromError !== "function") {
        // If we captured an error, but getDerivedStateFromError is not defined,
        // unmount all the children. componentDidCatch will schedule an update to
        // re-render a fallback. This is temporary until we migrate everyone to
        // the new API.
        // TODO: Warn in a future release.
        nextChildren = null;
        if (react_feature_flags_1.enableProfilerTimer) {
            (0, react_profile_timer_1.stopProfilerTimerIfRunning)(workInProgress);
        }
    }
    else {
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markComponentRenderStarted)(workInProgress);
        }
        if (__DEV__) {
            (0, react_current_fiber_1.setIsRendering)(true);
            nextChildren = instance.render();
            if (react_feature_flags_1.debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
                (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(true);
                try {
                    instance.render();
                }
                finally {
                    (0, react_fiber_dev_tools_hook_1.setIsStrictModeForDevtools)(false);
                }
            }
            (0, react_current_fiber_1.setIsRendering)(false);
        }
        else {
            nextChildren = instance.render();
        }
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markComponentRenderStopped)();
        }
    }
    // React DevTools reads this flag.
    workInProgress.flags |= fiber_flags_1.FiberFlags.PerformedWork;
    if (current !== null && didCaptureError) {
        // If we're recovering from an error, reconcile without reusing any of
        // the existing children. Conceptually, the normal children and the children
        // that are shown on error are two different sets, so we shouldn't reuse
        // normal children even if their identities match.
        forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderLanes);
    }
    else {
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    }
    // Memoize state using the values we just used to render.
    // TODO: Restructure so we never read values from the instance.
    workInProgress.memoizedState = instance.state;
    // The context might have changed so we need to recalculate it.
    if (hasContext) {
        (0, react_fiber_context_1.invalidateContextProvider)(workInProgress, Component, true);
    }
    return workInProgress.child;
}
function pushHostRootContext(workInProgress) {
    var root = workInProgress.stateNode;
    if (root.pendingContext) {
        (0, react_fiber_context_1.pushTopLevelContextObject)(workInProgress, root.pendingContext, root.pendingContext !== root.context);
    }
    else if (root.context) {
        // Should always be set
        (0, react_fiber_context_1.pushTopLevelContextObject)(workInProgress, root.context, false);
    }
    (0, react_fiber_host_context_1.pushHostContainer)(workInProgress, root.containerInfo);
}
function updateHostRoot(current, workInProgress, renderLanes) {
    pushHostRootContext(workInProgress);
    if (current === null) {
        throw new Error("Should have a current fiber. This is a bug in React.");
    }
    var nextProps = workInProgress.pendingProps;
    var prevState = workInProgress.memoizedState;
    var prevChildren = prevState.element;
    (0, react_fiber_class_update_queue_1.cloneUpdateQueue)(current, workInProgress);
    (0, react_fiber_class_update_queue_1.processUpdateQueue)(workInProgress, nextProps, null, renderLanes);
    var nextState = workInProgress.memoizedState;
    var root = workInProgress.stateNode;
    (0, react_fiber_transition_1.pushRootTransition)(workInProgress, root, renderLanes);
    if (react_feature_flags_1.enableTransitionTracing) {
        (0, react_fiber_tracing_marker_component_1.pushRootMarkerInstance)(workInProgress);
    }
    if (react_feature_flags_1.enableCache) {
        var nextCache = nextState.cache;
        (0, react_fiber_cache_component_provider_1.pushCacheProvider)(workInProgress, nextCache);
        if (nextCache !== prevState.cache) {
            // The root cache refreshed.
            (0, react_fiber_new_context_1.propagateContextChange)(workInProgress, react_fiber_cache_component_1.CacheContext, renderLanes);
        }
    }
    // Caution: React DevTools currently depends on this property
    // being called "element".
    var nextChildren = nextState.element;
    if (supportsHydration && prevState.isDehydrated) {
        // This is a hydration root whose shell has not yet hydrated. We should
        // attempt to hydrate.
        // Flip isDehydrated to false to indicate that when this render
        // finishes, the root will no longer be dehydrated.
        var overrideState = {
            element: nextChildren,
            isDehydrated: false,
            cache: nextState.cache
        };
        var updateQueue = workInProgress.updateQueue;
        // `baseState` can always be the last state because the root doesn't
        // have reducer functions so it doesn't need rebasing.
        updateQueue.baseState = overrideState;
        workInProgress.memoizedState = overrideState;
        if (workInProgress.flags & fiber_flags_1.FiberFlags.ForceClientRender) {
            // Something errored during a previous attempt to hydrate the shell, so we
            // forced a client render.
            var recoverableError = (0, react_captured_value_1.createCapturedValueAtFiber)(new Error("There was an error while hydrating. Because the error happened outside " + "of a Suspense boundary, the entire root will switch to " + "client rendering."), workInProgress);
            return mountHostRootWithoutHydrating(current, workInProgress, nextChildren, renderLanes, recoverableError);
        }
        else if (nextChildren !== prevChildren) {
            var recoverableError = (0, react_captured_value_1.createCapturedValueAtFiber)(new Error("This root received an early update, before anything was able " + "hydrate. Switched the entire root to client rendering."), workInProgress);
            return mountHostRootWithoutHydrating(current, workInProgress, nextChildren, renderLanes, recoverableError);
        }
        else {
            // The outermost shell has not hydrated yet. Start hydrating.
            (0, react_fiber_hydration_context_1.enterHydrationState)(workInProgress);
            var child = (0, react_fiber_child_1.mountChildFibers)(workInProgress, null, nextChildren, renderLanes);
            workInProgress.child = child;
            var node = child;
            while (node) {
                // Mark each child as hydrating. This is a fast path to know whether this
                // tree is part of a hydrating tree. This is used to determine if a child
                // node has fully mounted yet, and for scheduling event replaying.
                // Conceptually this is similar to Placement in that a new subtree is
                // inserted into the React tree here. It just happens to not need DOM
                // mutations because it already exists.
                node.flags = node.flags & ~fiber_flags_1.FiberFlags.Placement | fiber_flags_1.FiberFlags.Hydrating;
                node = node.sibling;
            }
        }
    }
    else {
        // Root is not dehydrated. Either this is a client-only root, or it
        // already hydrated.
        (0, react_fiber_hydration_context_1.resetHydrationState)();
        if (nextChildren === prevChildren) {
            return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
        }
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    }
    return workInProgress.child;
}
function mountHostRootWithoutHydrating(current, workInProgress, nextChildren, renderLanes, recoverableError) {
    // Revert to client rendering.
    (0, react_fiber_hydration_context_1.resetHydrationState)();
    (0, react_fiber_hydration_error_1.queueHydrationError)(recoverableError);
    workInProgress.flags |= fiber_flags_1.FiberFlags.ForceClientRender;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function updateHostComponent(current, workInProgress, renderLanes) {
    (0, react_fiber_host_context_1.pushHostContext)(workInProgress);
    if (current === null) {
        (0, react_fiber_hydration_context_try_claim_1.tryToClaimNextHydratableInstance)(workInProgress);
    }
    var type = workInProgress.type;
    var nextProps = workInProgress.pendingProps;
    var prevProps = current !== null ? current.memoizedProps : null;
    var nextChildren = nextProps.children;
    var isDirectTextChild = shouldSetTextContent(type, nextProps);
    if (isDirectTextChild) {
        // We special case a direct text child of a host node. This is a common
        // case. We won't handle it as a reified child. We will instead handle
        // this in the host environment that also has access to this prop. That
        // avoids allocating another HostText fiber and traversing it.
        nextChildren = null;
    }
    else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
        // If we're switching from a direct text child to a normal child, or to
        // empty, we need to schedule the text content to be reset.
        workInProgress.flags |= fiber_flags_1.FiberFlags.ContentReset;
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        var memoizedState = workInProgress.memoizedState;
        if (memoizedState !== null) {
            // This fiber has been upgraded to a stateful component. The only way
            // happens currently is for form actions. We use hooks to track the
            // pending and error state of the form.
            //
            // Once a fiber is upgraded to be stateful, it remains stateful for the
            // rest of its lifetime.
            var newState = (0, react_fiber_hooks_1.renderTransitionAwareHostComponentWithHooks)(current, workInProgress, renderLanes);
            // If the transition state changed, propagate the change to all the
            // descendents. We use Context as an implementation detail for this.
            //
            // This is intentionally set here instead of pushHostContext because
            // pushHostContext gets called before we process the state hook, to avoid
            // a state mismatch in the event that something suspends.
            //
            // NOTE: This assumes that there cannot be nested transition providers,
            // because the only renderer that implements this feature is React DOM,
            // and forms cannot be nested. If we did support nested providers, then
            // we would need to push a context value even for host fibers that
            // haven't been upgraded yet.
            if (isPrimaryRenderer) {
                react_fiber_host_context_1.HostTransitionContext._currentValue = newState;
            }
            else {
                react_fiber_host_context_1.HostTransitionContext._currentValue2 = newState;
            }
            if (react_feature_flags_1.enableLazyContextPropagation) { // In the lazy propagation implementation, we don't scan for matching
                // consumers until something bails out.
            }
            else {
                if ((0, react_fiber_work_in_progress_receive_update_1.didWorkInProgressReceiveUpdate)()) {
                    if (current !== null) {
                        var oldStateHook = current.memoizedState;
                        var oldState = oldStateHook.memoizedState;
                        // This uses regular equality instead of Object.is because we assume
                        // that host transition state doesn't include NaN as a valid type.
                        if (oldState !== newState) {
                            (0, react_fiber_new_context_1.propagateContextChange)(workInProgress, react_fiber_host_context_1.HostTransitionContext, renderLanes);
                        }
                    }
                }
            }
        }
    }
    markRef(current, workInProgress);
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateHostHoistable(current, workInProgress, renderLanes) {
    markRef(current, workInProgress);
    var currentProps = current === null ? null : current.memoizedProps;
    var resource = workInProgress.memoizedState = getResource(workInProgress.type, currentProps, workInProgress.pendingProps);
    if (current === null) {
        if (!(0, react_fiber_hydration_is_hydrating_1.isHydrating)() && resource === null) {
            // This is not a Resource Hoistable and we aren't hydrating so we construct the instance.
            workInProgress.stateNode = createHoistableInstance(workInProgress.type, workInProgress.pendingProps, (0, react_fiber_host_context_1.getRootHostContainer)(), workInProgress);
        }
    }
    // Resources never have reconciler managed children. It is possible for
    // the host implementation of getResource to consider children in the
    // resource construction but they will otherwise be discarded. In practice
    // this precludes all but the simplest children and Host specific warnings
    // should be implemented to warn when children are passsed when otherwise not
    // expected
    return null;
}
function updateHostSingleton(current, workInProgress, renderLanes) {
    (0, react_fiber_host_context_1.pushHostContext)(workInProgress);
    if (current === null) {
        (0, react_fiber_hydration_context_try_claim_1.claimHydratableSingleton)(workInProgress);
    }
    var nextChildren = workInProgress.pendingProps.children;
    if (current === null && !(0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
        // Similar to Portals we append Singleton children in the commit phase. So we
        // Track insertions even on mount.
        // TODO: Consider unifying this with how the root works.
        workInProgress.child = (0, react_fiber_child_1.reconcileChildFibers)(workInProgress, null, nextChildren, renderLanes);
    }
    else {
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    }
    markRef(current, workInProgress);
    return workInProgress.child;
}
function updateHostText(current, workInProgress) {
    if (current === null) {
        (0, react_fiber_hydration_context_try_claim_1.tryToClaimNextHydratableTextInstance)(workInProgress);
    }
    // Nothing to do here. This is terminal. We'll do the completion step
    // immediately after.
    return null;
}
function mountLazyComponent(_current, workInProgress, elementType, renderLanes) {
    resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
    var props = workInProgress.pendingProps;
    var lazyComponent = elementType;
    var payload = lazyComponent._payload;
    var init = lazyComponent._init;
    var Component = init(payload);
    // Store the unwrapped component in the type.
    workInProgress.type = Component;
    var resolvedTag = workInProgress.tag = (0, react_fiber_create_utils_1.resolveLazyComponentTag)(Component);
    var resolvedProps = (0, react_fiber_lazy_component_1.resolveDefaultProps)(Component, props);
    var child;
    switch (resolvedTag) {
        case work_tags_1.WorkTag.FunctionComponent: {
            if (__DEV__) {
                validateFunctionComponentInDev(workInProgress, Component);
                workInProgress.type = Component = (0, react_fiber_hot_reloading_resvole_1.resolveFunctionForHotReloading)(Component);
            }
            child = updateFunctionComponent(null, workInProgress, Component, resolvedProps, renderLanes);
            return child;
        }
        case work_tags_1.WorkTag.ClassComponent: {
            if (__DEV__) {
                workInProgress.type = Component = (0, react_fiber_hot_reloading_resvole_1.resolveClassForHotReloading)(Component);
            }
            child = updateClassComponent(null, workInProgress, Component, resolvedProps, renderLanes);
            return child;
        }
        case work_tags_1.WorkTag.ForwardRef: {
            if (__DEV__) {
                workInProgress.type = Component = (0, react_fiber_hot_reloading_resvole_1.resolveForwardRefForHotReloading)(Component);
            }
            child = updateForwardRef(null, workInProgress, Component, resolvedProps, renderLanes);
            return child;
        }
        case work_tags_1.WorkTag.MemoComponent: {
            if (__DEV__) {
                if (workInProgress.type !== workInProgress.elementType) {
                    var outerPropTypes = Component.propTypes;
                    if (outerPropTypes) {
                        (0, check_prop_types_1.default)(outerPropTypes, resolvedProps, // Resolved for outer only
                        "prop", (0, get_component_name_from_type_1.default)(Component));
                    }
                }
            }
            child = updateMemoComponent(null, workInProgress, Component, (0, react_fiber_lazy_component_1.resolveDefaultProps)(Component.type, resolvedProps), // The inner type can have defaults too
            renderLanes);
            return child;
        }
    }
    var hint = "";
    if (__DEV__) {
        if (Component !== null && typeof Component === "object" && Component.$$typeof === react_symbols_1.REACT_LAZY_TYPE) {
            hint = " Did you wrap a component in React.lazy() more than once?";
        }
    }
    // This message intentionally doesn't mention ForwardRef or MemoComponent
    // because the fact that it's a separate type of work is an
    // implementation detail.
    throw new Error("Element type is invalid. Received a promise that resolves to: ".concat(Component, ". ") + "Lazy element type must resolve to a class or function.".concat(hint));
}
function mountIncompleteClassComponent(_current, workInProgress, Component, nextProps, renderLanes) {
    resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
    // Promote the fiber to a class and try rendering again.
    workInProgress.tag = work_tags_1.WorkTag.ClassComponent;
    // The rest of this function is a fork of `updateClassComponent`
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    var hasContext;
    if ((0, react_fiber_context_1.isContextProvider)(Component)) {
        hasContext = true;
        (0, react_fiber_context_1.pushContextProvider)(workInProgress);
    }
    else {
        hasContext = false;
    }
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    (0, react_fiber_class_component_1.constructClassInstance)(workInProgress, Component, nextProps);
    (0, react_fiber_class_component_1.mountClassInstance)(workInProgress, Component, nextProps, renderLanes);
    return finishClassComponent(null, workInProgress, Component, true, hasContext, renderLanes);
}
function mountIndeterminateComponent(_current, workInProgress, Component, renderLanes) {
    resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
    var props = workInProgress.pendingProps;
    var context;
    if (!react_feature_flags_1.disableLegacyContext) {
        var unmaskedContext = (0, react_fiber_context_1.getUnmaskedContext)(workInProgress, Component, false);
        context = (0, react_fiber_context_1.getMaskedContext)(workInProgress, unmaskedContext);
    }
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    var value;
    var hasId;
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStarted)(workInProgress);
    }
    if (__DEV__) {
        if (Component.prototype && typeof Component.prototype.render === "function") {
            var componentName = (0, get_component_name_from_type_1.default)(Component) || "Unknown";
            if (!didWarnAboutBadClass[componentName]) {
                console.error("The <%s /> component appears to have a render method, but doesn't extend React.Component. " + "This is likely to cause errors. Change %s to extend React.Component instead.", componentName, componentName);
                didWarnAboutBadClass[componentName] = true;
            }
        }
        if (workInProgress.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
            react_strict_mode_warnings_1.default.recordLegacyContextWarning(workInProgress, null);
        }
        (0, react_current_fiber_1.setIsRendering)(true);
        ReactCurrentOwner.current = workInProgress;
        value = (0, react_fiber_hooks_1.renderWithHooks)(null, workInProgress, Component, props, context, renderLanes);
        hasId = (0, react_fiber_hooks_1.checkDidRenderIdHook)();
        (0, react_current_fiber_1.setIsRendering)(false);
    }
    else {
        value = (0, react_fiber_hooks_1.renderWithHooks)(null, workInProgress, Component, props, context, renderLanes);
        hasId = (0, react_fiber_hooks_1.checkDidRenderIdHook)();
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStopped)();
    }
    // React DevTools reads this flag.
    workInProgress.flags |= fiber_flags_1.FiberFlags.PerformedWork;
    if (__DEV__) {
        // Support for module components is deprecated and is removed behind a flag.
        // Whether or not it would crash later, we want to show a good message in DEV first.
        if (typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === undefined) {
            var componentName = (0, get_component_name_from_type_1.default)(Component) || "Unknown";
            if (!didWarnAboutModulePatternComponent[componentName]) {
                console.error("The <%s /> component appears to be a function component that returns a class instance. " + "Change %s to a class that extends React.Component instead. " + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + "cannot be called with `new` by React.", componentName, componentName, componentName);
                didWarnAboutModulePatternComponent[componentName] = true;
            }
        }
    }
    if ( // Run these checks in production only if the flag is off.
    // Eventually we'll delete this branch altogether.
    !react_feature_flags_1.disableModulePatternComponents && typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === undefined) {
        if (__DEV__) {
            var componentName = (0, get_component_name_from_type_1.default)(Component) || "Unknown";
            if (!didWarnAboutModulePatternComponent[componentName]) {
                console.error("The <%s /> component appears to be a function component that returns a class instance. " + "Change %s to a class that extends React.Component instead. " + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + "cannot be called with `new` by React.", componentName, componentName, componentName);
                didWarnAboutModulePatternComponent[componentName] = true;
            }
        }
        // Proceed under the assumption that this is a class instance
        workInProgress.tag = work_tags_1.WorkTag.ClassComponent;
        // Throw out any hooks that were used.
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        // Push context providers early to prevent context stack mismatches.
        // During mounting we don't know the child context yet as the instance doesn't exist.
        // We will invalidate the child context in finishClassComponent() right after rendering.
        var hasContext = false;
        if ((0, react_fiber_context_1.isContextProvider)(Component)) {
            hasContext = true;
            (0, react_fiber_context_1.pushContextProvider)(workInProgress);
        }
        else {
            hasContext = false;
        }
        workInProgress.memoizedState = value.state !== null && value.state !== undefined ? value.state : null;
        (0, react_fiber_class_update_queue_1.initializeUpdateQueue)(workInProgress);
        (0, react_fiber_class_component_1.adoptClassInstance)(workInProgress, value);
        (0, react_fiber_class_component_1.mountClassInstance)(workInProgress, Component, props, renderLanes);
        return finishClassComponent(null, workInProgress, Component, true, hasContext, renderLanes);
    }
    else {
        // Proceed under the assumption that this is a function component
        workInProgress.tag = work_tags_1.WorkTag.FunctionComponent;
        if (__DEV__) {
            if (react_feature_flags_1.disableLegacyContext && Component.contextTypes) {
                console.error("%s uses the legacy contextTypes API which is no longer supported. " + "Use React.createContext() with React.useContext() instead.", (0, get_component_name_from_type_1.default)(Component) || "Unknown");
            }
        }
        if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)() && hasId) {
            (0, react_fiber_tree_context_1.pushMaterializedTreeId)(workInProgress);
        }
        reconcileChildren(null, workInProgress, value, renderLanes);
        if (__DEV__) {
            validateFunctionComponentInDev(workInProgress, Component);
        }
        return workInProgress.child;
    }
}
function validateFunctionComponentInDev(workInProgress, Component) {
    if (__DEV__) {
        if (Component) {
            if (Component.childContextTypes) {
                console.error("%s(...): childContextTypes cannot be defined on a function component.", Component.displayName || Component.name || "Component");
            }
        }
        if (workInProgress.ref !== null) {
            var info = "";
            var ownerName = (0, react_current_fiber_1.getCurrentFiberOwnerNameInDevOrNull)();
            if (ownerName) {
                info += "\n\nCheck the render method of `" + ownerName + "`.";
            }
            var warningKey = ownerName || "";
            var debugSource = workInProgress._debugSource;
            if (debugSource) {
                warningKey = debugSource.fileName + ":" + debugSource.lineNumber;
            }
            if (!didWarnAboutFunctionRefs[warningKey]) {
                didWarnAboutFunctionRefs[warningKey] = true;
                console.error("Function components cannot be given refs. " + "Attempts to access this ref will fail. " + "Did you mean to use React.forwardRef()?%s", info);
            }
        }
        if (Component.defaultProps !== undefined) {
            var componentName = (0, get_component_name_from_type_1.default)(Component) || "Unknown";
            if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
                console.error("%s: Support for defaultProps will be removed from function components " + "in a future major release. Use JavaScript default parameters instead.", componentName);
                didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
            }
        }
        if (typeof Component.getDerivedStateFromProps === "function") {
            var componentName = (0, get_component_name_from_type_1.default)(Component) || "Unknown";
            if (!didWarnAboutGetDerivedStateOnFunctionComponent[componentName]) {
                console.error("%s: Function components do not support getDerivedStateFromProps.", componentName);
                didWarnAboutGetDerivedStateOnFunctionComponent[componentName] = true;
            }
        }
        if (typeof Component.contextType === "object" && Component.contextType !== null) {
            var componentName = (0, get_component_name_from_type_1.default)(Component) || "Unknown";
            if (!didWarnAboutContextTypeOnFunctionComponent[componentName]) {
                console.error("%s: Function components do not support contextType.", componentName);
                didWarnAboutContextTypeOnFunctionComponent[componentName] = true;
            }
        }
    }
}
var SUSPENDED_MARKER = {
    dehydrated: null,
    treeContext: null,
    retryLane: fiber_lane_constants_1.NoLane
};
function mountSuspenseOffscreenState(renderLanes) {
    return {
        baseLanes: renderLanes,
        cachePool: (0, react_fiber_transition_1.getSuspendedCache)()
    };
}
function updateSuspenseOffscreenState(prevOffscreenState, renderLanes) {
    var cachePool = null;
    if (react_feature_flags_1.enableCache) {
        var prevCachePool = prevOffscreenState.cachePool;
        if (prevCachePool !== null) {
            var parentCache = isPrimaryRenderer ? react_fiber_cache_component_1.CacheContext._currentValue : react_fiber_cache_component_1.CacheContext._currentValue2;
            if (prevCachePool.parent !== parentCache) {
                // Detected a refresh in the parent. This overrides any previously
                // suspended cache.
                cachePool = {
                    parent: parentCache,
                    pool: parentCache
                };
            }
            else {
                // We can reuse the cache from last time. The only thing that would have
                // overridden it is a parent refresh, which we checked for above.
                cachePool = prevCachePool;
            }
        }
        else {
            // If there's no previous cache pool, grab the current one.
            cachePool = (0, react_fiber_transition_1.getSuspendedCache)();
        }
    }
    return {
        baseLanes: (0, react_fiber_lane_1.mergeLanes)(prevOffscreenState.baseLanes, renderLanes),
        cachePool: cachePool
    };
}
// TODO: Probably should inline this back
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function shouldRemainOnFallback(current, workInProgress, renderLanes) {
    // If we're already showing a fallback, there are cases where we need to
    // remain on that fallback regardless of whether the content has resolved.
    // For example, SuspenseList coordinates when nested content appears.
    // TODO: For compatibility with offscreen prerendering, this should also check
    // whether the current fiber (if it exists) was visible in the previous tree.
    if (current !== null) {
        var suspenseState = current.memoizedState;
        if (suspenseState === null) {
            // Currently showing content. Don't hide it, even if ForceSuspenseFallback
            // is true. More precise name might be "ForceRemainSuspenseFallback".
            // Note: This is a factoring smell. Can't remain on a fallback if there's
            // no fallback to remain on.
            return false;
        }
    }
    // Not currently showing content. Consult the Suspense context.
    var suspenseContext = react_fiber_suspense_context_1.suspenseStackCursor.current;
    return (0, react_fiber_suspense_context_1.hasSuspenseListContext)(suspenseContext, react_fiber_suspense_context_1.ForceSuspenseFallback);
}
function getRemainingWorkInPrimaryTree(current, renderLanes) {
    // TODO: Should not remove render lanes that were pinged during this render
    return (0, react_fiber_lane_1.removeLanes)(current.childLanes, renderLanes);
}
function updateSuspenseComponent(current, workInProgress, renderLanes) {
    var nextProps = workInProgress.pendingProps;
    // This is used by DevTools to force a boundary to suspend.
    if (__DEV__) {
        if ((0, react_fiber_should_suspend_1.shouldSuspend)(workInProgress)) {
            workInProgress.flags |= fiber_flags_1.FiberFlags.DidCapture;
        }
    }
    var showFallback = false;
    var didSuspend = (workInProgress.flags & fiber_flags_1.FiberFlags.DidCapture) !== fiber_flags_1.FiberFlags.NoFlags;
    if (didSuspend || shouldRemainOnFallback(current, workInProgress, renderLanes)) {
        // Something in this boundary's subtree already suspended. Switch to
        // rendering the fallback children.
        showFallback = true;
        workInProgress.flags &= ~fiber_flags_1.FiberFlags.DidCapture;
    }
    // OK, the next part is confusing. We're about to reconcile the Suspense
    // boundary's children. This involves some custom reconciliation logic. Two
    // main reasons this is so complicated.
    //
    // First, Legacy Mode has different semantics for backwards compatibility. The
    // primary tree will commit in an inconsistent state, so when we do the
    // second pass to render the fallback, we do some exceedingly, uh, clever
    // hacks to make that not totally break. Like transferring effects and
    // deletions from hidden tree. In Concurrent Mode, it's much simpler,
    // because we bailout on the primary tree completely and leave it in its old
    // state, no effects. Same as what we do for Offscreen (except that
    // Offscreen doesn't have the first render pass).
    //
    // Second is hydration. During hydration, the Suspense fiber has a slightly
    // different layout, where the child points to a dehydrated fragment, which
    // contains the DOM rendered by the server.
    //
    // Third, even if you set all that aside, Suspense is like error boundaries in
    // that we first we try to render one tree, and if that fails, we render again
    // and switch to a different tree. Like a try/catch block. So we have to track
    // which branch we're currently rendering. Ideally we would model this using
    // a stack.
    if (current === null) {
        // Initial mount
        // Special path for hydration
        // If we're currently hydrating, try to hydrate this boundary.
        if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
            // We must push the suspense handler context *before* attempting to
            // hydrate, to avoid a mismatch in case it errors.
            if (showFallback) {
                (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
            }
            else {
                (0, react_fiber_suspense_context_1.pushFallbackTreeSuspenseHandler)(workInProgress);
            }
            (0, react_fiber_hydration_context_try_claim_1.tryToClaimNextHydratableSuspenseInstance)(workInProgress);
            // This could've been a dehydrated suspense component.
            var suspenseState = workInProgress.memoizedState;
            if (suspenseState !== null) {
                var dehydrated = suspenseState.dehydrated;
                if (dehydrated !== null) {
                    return mountDehydratedSuspenseComponent(workInProgress, dehydrated, renderLanes);
                }
            }
            // If hydration didn't succeed, fall through to the normal Suspense path.
            // To avoid a stack mismatch we need to pop the Suspense handler that we
            // pushed above. This will become less awkward when move the hydration
            // logic to its own fiber.
            (0, react_fiber_suspense_context_1.popSuspenseHandler)(workInProgress);
        }
        var nextPrimaryChildren = nextProps.children;
        var nextFallbackChildren = nextProps.fallback;
        if (showFallback) {
            (0, react_fiber_suspense_context_1.pushFallbackTreeSuspenseHandler)(workInProgress);
            var fallbackFragment = mountSuspenseFallbackChildren(workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
            var primaryChildFragment = workInProgress.child;
            primaryChildFragment.memoizedState = mountSuspenseOffscreenState(renderLanes);
            workInProgress.memoizedState = SUSPENDED_MARKER;
            if (react_feature_flags_1.enableTransitionTracing) {
                var currentTransitions = (0, react_fiber_transition_1.getPendingTransitions)();
                if (currentTransitions !== null) {
                    var parentMarkerInstances = (0, react_fiber_tracing_marker_component_1.getMarkerInstances)();
                    var offscreenQueue = primaryChildFragment.updateQueue;
                    if (offscreenQueue === null) {
                        primaryChildFragment.updateQueue = {
                            transitions: currentTransitions,
                            markerInstances: parentMarkerInstances,
                            retryQueue: null
                        };
                    }
                    else {
                        offscreenQueue.transitions = currentTransitions;
                        offscreenQueue.markerInstances = parentMarkerInstances;
                    }
                }
            }
            return fallbackFragment;
        }
        else if (react_feature_flags_1.enableCPUSuspense && typeof nextProps.unstable_expectedLoadTime === "number") {
            // This is a CPU-bound tree. Skip this tree and show a placeholder to
            // unblock the surrounding content. Then immediately retry after the
            // initial commit.
            (0, react_fiber_suspense_context_1.pushFallbackTreeSuspenseHandler)(workInProgress);
            var fallbackFragment = mountSuspenseFallbackChildren(workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
            var primaryChildFragment = workInProgress.child;
            primaryChildFragment.memoizedState = mountSuspenseOffscreenState(renderLanes);
            workInProgress.memoizedState = SUSPENDED_MARKER;
            // TODO: Transition Tracing is not yet implemented for CPU Suspense.
            // Since nothing actually suspended, there will nothing to ping this to
            // get it started back up to attempt the next item. While in terms of
            // priority this work has the same priority as this current render, it's
            // not part of the same transition once the transition has committed. If
            // it's sync, we still want to yield so that it can be painted.
            // Conceptually, this is really the same as pinging. We can use any
            // RetryLane even if it's the one currently rendering since we're leaving
            // it behind on this node.
            workInProgress.lanes = fiber_lane_constants_1.SomeRetryLane;
            return fallbackFragment;
        }
        else {
            (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
            return mountSuspensePrimaryChildren(workInProgress, nextPrimaryChildren, renderLanes);
        }
    }
    else {
        // This is an update.
        // Special path for hydration
        var prevState = current.memoizedState;
        if (prevState !== null) {
            var dehydrated = prevState.dehydrated;
            if (dehydrated !== null) {
                return updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, nextProps, dehydrated, prevState, renderLanes);
            }
        }
        if (showFallback) {
            (0, react_fiber_suspense_context_1.pushFallbackTreeSuspenseHandler)(workInProgress);
            var nextFallbackChildren = nextProps.fallback;
            var nextPrimaryChildren = nextProps.children;
            var fallbackChildFragment = updateSuspenseFallbackChildren(current, workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
            var primaryChildFragment = workInProgress.child;
            var prevOffscreenState = current.child.memoizedState;
            primaryChildFragment.memoizedState = prevOffscreenState === null ? mountSuspenseOffscreenState(renderLanes) : updateSuspenseOffscreenState(prevOffscreenState, renderLanes);
            if (react_feature_flags_1.enableTransitionTracing) {
                var currentTransitions = (0, react_fiber_transition_1.getPendingTransitions)();
                if (currentTransitions !== null) {
                    var parentMarkerInstances = (0, react_fiber_tracing_marker_component_1.getMarkerInstances)();
                    var offscreenQueue = primaryChildFragment.updateQueue;
                    var currentOffscreenQueue = current.updateQueue;
                    if (offscreenQueue === null) {
                        var newOffscreenQueue = {
                            transitions: currentTransitions,
                            markerInstances: parentMarkerInstances,
                            retryQueue: null
                        };
                        primaryChildFragment.updateQueue = newOffscreenQueue;
                    }
                    else if (offscreenQueue === currentOffscreenQueue) {
                        // If the work-in-progress queue is the same object as current, we
                        // can't modify it without cloning it first.
                        var newOffscreenQueue = {
                            transitions: currentTransitions,
                            markerInstances: parentMarkerInstances,
                            retryQueue: currentOffscreenQueue !== null ? currentOffscreenQueue.retryQueue : null
                        };
                        primaryChildFragment.updateQueue = newOffscreenQueue;
                    }
                    else {
                        offscreenQueue.transitions = currentTransitions;
                        offscreenQueue.markerInstances = parentMarkerInstances;
                    }
                }
            }
            primaryChildFragment.childLanes = getRemainingWorkInPrimaryTree(current, renderLanes);
            workInProgress.memoizedState = SUSPENDED_MARKER;
            return fallbackChildFragment;
        }
        else {
            (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
            var nextPrimaryChildren = nextProps.children;
            var primaryChildFragment = updateSuspensePrimaryChildren(current, workInProgress, nextPrimaryChildren, renderLanes);
            workInProgress.memoizedState = null;
            return primaryChildFragment;
        }
    }
}
function mountSuspensePrimaryChildren(workInProgress, primaryChildren, renderLanes) {
    var mode = workInProgress.mode;
    var primaryChildProps = {
        mode: "visible",
        children: primaryChildren
    };
    var primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, mode, renderLanes);
    primaryChildFragment.return = workInProgress;
    workInProgress.child = primaryChildFragment;
    return primaryChildFragment;
}
function mountSuspenseFallbackChildren(workInProgress, primaryChildren, fallbackChildren, renderLanes) {
    var mode = workInProgress.mode;
    var progressedPrimaryFragment = workInProgress.child;
    var primaryChildProps = {
        mode: "hidden",
        children: primaryChildren
    };
    var primaryChildFragment;
    var fallbackChildFragment;
    if ((mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode && progressedPrimaryFragment !== null) {
        // In legacy mode, we commit the primary tree as if it successfully
        // completed, even though it's in an inconsistent state.
        primaryChildFragment = progressedPrimaryFragment;
        primaryChildFragment.childLanes = fiber_lane_constants_1.NoLanes;
        primaryChildFragment.pendingProps = primaryChildProps;
        if (react_feature_flags_1.enableProfilerTimer && workInProgress.mode & type_of_mode_1.TypeOfMode.ProfileMode) {
            // Reset the durations from the first pass so they aren't included in the
            // final amounts. This seems counterintuitive, since we're intentionally
            // not measuring part of the render phase, but this makes it match what we
            // do in Concurrent Mode.
            primaryChildFragment.actualDuration = 0;
            primaryChildFragment.actualStartTime = -1;
            primaryChildFragment.selfBaseDuration = 0;
            primaryChildFragment.treeBaseDuration = 0;
        }
        fallbackChildFragment = (0, react_fiber_1.createFiberFromFragment)(fallbackChildren, mode, renderLanes, null);
    }
    else {
        primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, mode, fiber_lane_constants_1.NoLanes);
        fallbackChildFragment = (0, react_fiber_1.createFiberFromFragment)(fallbackChildren, mode, renderLanes, null);
    }
    primaryChildFragment.return = workInProgress;
    fallbackChildFragment.return = workInProgress;
    primaryChildFragment.sibling = fallbackChildFragment;
    workInProgress.child = primaryChildFragment;
    return fallbackChildFragment;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mountWorkInProgressOffscreenFiber(offscreenProps, mode, renderLanes) {
    // The props argument to `createFiberFromOffscreen` is `any` typed, so we use
    // this wrapper function to constrain it.
    return (0, react_fiber_create_from_offscreen_1.createFiberFromOffscreen)(offscreenProps, mode, fiber_lane_constants_1.NoLanes, null);
}
function updateWorkInProgressOffscreenFiber(current, offscreenProps) {
    // The props argument to `createWorkInProgress` is `any` typed, so we use this
    // wrapper function to constrain it.
    return (0, react_fiber_work_in_progress_ex_1.createWorkInProgress)(current, offscreenProps);
}
function updateSuspensePrimaryChildren(current, workInProgress, primaryChildren, renderLanes) {
    var currentPrimaryChildFragment = current.child;
    var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
    var primaryChildFragment = updateWorkInProgressOffscreenFiber(currentPrimaryChildFragment, {
        mode: "visible",
        children: primaryChildren
    });
    if ((workInProgress.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
        primaryChildFragment.lanes = renderLanes;
    }
    primaryChildFragment.return = workInProgress;
    primaryChildFragment.sibling = null;
    if (currentFallbackChildFragment !== null) {
        // Delete the fallback child fragment
        var deletions = workInProgress.deletions;
        if (deletions === null) {
            workInProgress.deletions = [currentFallbackChildFragment];
            workInProgress.flags |= fiber_flags_1.FiberFlags.ChildDeletion;
        }
        else {
            deletions.push(currentFallbackChildFragment);
        }
    }
    workInProgress.child = primaryChildFragment;
    return primaryChildFragment;
}
function updateSuspenseFallbackChildren(current, workInProgress, primaryChildren, fallbackChildren, renderLanes) {
    var mode = workInProgress.mode;
    var currentPrimaryChildFragment = current.child;
    var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
    var primaryChildProps = {
        mode: "hidden",
        children: primaryChildren
    };
    var primaryChildFragment;
    if ( // In legacy mode, we commit the primary tree as if it successfully
    // completed, even though it's in an inconsistent state.
    (mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode && // Make sure we're on the second pass, i.e. the primary child fragment was
        // already cloned. In legacy mode, the only case where this isn't true is
        // when DevTools forces us to display a fallback; we skip the first render
        // pass entirely and go straight to rendering the fallback. (In Concurrent
        // Mode, SuspenseList can also trigger this scenario, but this is a legacy-
        // only codepath.)
        workInProgress.child !== currentPrimaryChildFragment) {
        var progressedPrimaryFragment = workInProgress.child;
        primaryChildFragment = progressedPrimaryFragment;
        primaryChildFragment.childLanes = fiber_lane_constants_1.NoLanes;
        primaryChildFragment.pendingProps = primaryChildProps;
        if (react_feature_flags_1.enableProfilerTimer && workInProgress.mode & type_of_mode_1.TypeOfMode.ProfileMode) {
            // Reset the durations from the first pass so they aren't included in the
            // final amounts. This seems counterintuitive, since we're intentionally
            // not measuring part of the render phase, but this makes it match what we
            // do in Concurrent Mode.
            primaryChildFragment.actualDuration = 0;
            primaryChildFragment.actualStartTime = -1;
            primaryChildFragment.selfBaseDuration = currentPrimaryChildFragment.selfBaseDuration;
            primaryChildFragment.treeBaseDuration = currentPrimaryChildFragment.treeBaseDuration;
        }
        // The fallback fiber was added as a deletion during the first pass.
        // However, since we're going to remain on the fallback, we no longer want
        // to delete it.
        workInProgress.deletions = null;
    }
    else {
        primaryChildFragment = updateWorkInProgressOffscreenFiber(currentPrimaryChildFragment, primaryChildProps);
        // Since we're reusing a current tree, we need to reuse the flags, too.
        // (We don't do this in legacy mode, because in legacy mode we don't re-use
        // the current tree; see previous branch.)
        primaryChildFragment.subtreeFlags = currentPrimaryChildFragment.subtreeFlags & fiber_flags_1.FiberFlags.StaticMask;
    }
    var fallbackChildFragment;
    if (currentFallbackChildFragment !== null) {
        fallbackChildFragment = (0, react_fiber_work_in_progress_ex_1.createWorkInProgress)(currentFallbackChildFragment, fallbackChildren);
    }
    else {
        fallbackChildFragment = (0, react_fiber_1.createFiberFromFragment)(fallbackChildren, mode, renderLanes, null);
        // Needs a placement effect because the parent (the Suspense boundary) already
        // mounted but this is a new fiber.
        fallbackChildFragment.flags |= fiber_flags_1.FiberFlags.Placement;
    }
    fallbackChildFragment.return = workInProgress;
    primaryChildFragment.return = workInProgress;
    primaryChildFragment.sibling = fallbackChildFragment;
    workInProgress.child = primaryChildFragment;
    return fallbackChildFragment;
}
function retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, recoverableError) {
    // Falling back to client rendering. Because this has performance
    // implications, it's considered a recoverable error, even though the user
    // likely won't observe anything wrong with the UI.
    //
    // The error is passed in as an argument to enforce that every caller provide
    // a custom message, or explicitly opt out (currently the only path that opts
    // out is legacy mode; every concurrent path provides an error).
    if (recoverableError !== null) {
        (0, react_fiber_hydration_error_1.queueHydrationError)(recoverableError);
    }
    // This will add the old fiber to the deletion list
    (0, react_fiber_child_1.reconcileChildFibers)(workInProgress, current.child, null, renderLanes);
    // We're now not suspended nor dehydrated.
    var nextProps = workInProgress.pendingProps;
    var primaryChildren = nextProps.children;
    var primaryChildFragment = mountSuspensePrimaryChildren(workInProgress, primaryChildren, renderLanes);
    // Needs a placement effect because the parent (the Suspense boundary) already
    // mounted but this is a new fiber.
    primaryChildFragment.flags |= fiber_flags_1.FiberFlags.Placement;
    workInProgress.memoizedState = null;
    return primaryChildFragment;
}
function mountSuspenseFallbackAfterRetryWithoutHydrating(current, workInProgress, primaryChildren, fallbackChildren, renderLanes) {
    var fiberMode = workInProgress.mode;
    var primaryChildProps = {
        mode: "visible",
        children: primaryChildren
    };
    var primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, fiberMode, fiber_lane_constants_1.NoLanes);
    var fallbackChildFragment = (0, react_fiber_1.createFiberFromFragment)(fallbackChildren, fiberMode, renderLanes, null);
    // Needs a placement effect because the parent (the Suspense
    // boundary) already mounted but this is a new fiber.
    fallbackChildFragment.flags |= fiber_flags_1.FiberFlags.Placement;
    primaryChildFragment.return = workInProgress;
    fallbackChildFragment.return = workInProgress;
    primaryChildFragment.sibling = fallbackChildFragment;
    workInProgress.child = primaryChildFragment;
    if ((workInProgress.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode) {
        // We will have dropped the effect list which contains the
        // deletion. We need to reconcile to delete the current child.
        (0, react_fiber_child_1.reconcileChildFibers)(workInProgress, current.child, null, renderLanes);
    }
    return fallbackChildFragment;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mountDehydratedSuspenseComponent(workInProgress, suspenseInstance, renderLanes) {
    // During the first pass, we'll bail out and not drill into the children.
    // Instead, we'll leave the content in place and try to hydrate it later.
    if ((workInProgress.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
        if (__DEV__) {
            console.error("Cannot hydrate Suspense in legacy mode. Switch from " + "ReactDOM.hydrate(element, container) to " + "ReactDOMClient.hydrateRoot(container, <App />)" + ".render(element) or remove the Suspense components from " + "the server rendered components.");
        }
        workInProgress.lanes = (0, react_fiber_lane_1.laneToLanes)(fiber_lane_constants_1.SyncLane);
    }
    else if (isSuspenseInstanceFallback(suspenseInstance)) {
        // This is a client-only boundary. Since we won't get any content from the server
        // for this, we need to schedule that at a higher priority based on when it would
        // have timed out. In theory we could render it in this pass but it would have the
        // wrong priority associated with it and will prevent hydration of parent path.
        // Instead, we'll leave work left on it to render it in a separate commit.
        // TODO This time should be the time at which the server rendered response that is
        // a parent to this boundary was displayed. However, since we currently don't have
        // a protocol to transfer that time, we'll just estimate it by using the current
        // time. This will mean that Suspense timeouts are slightly shifted to later than
        // they should be.
        // Schedule a normal pri update to render this content.
        workInProgress.lanes = (0, react_fiber_lane_1.laneToLanes)(fiber_lane_constants_1.DefaultHydrationLane);
    }
    else {
        // We'll continue hydrating the rest at offscreen priority since we'll already
        // be showing the right content coming from the server, it is no rush.
        workInProgress.lanes = (0, react_fiber_lane_1.laneToLanes)(fiber_lane_constants_1.OffscreenLane);
    }
    return null;
}
function updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, nextProps, suspenseInstance, suspenseState, renderLanes) {
    var _a;
    if (!didSuspend) {
        // This is the first render pass. Attempt to hydrate.
        (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
        // We should never be hydrating at this point because it is the first pass,
        // but after we've already committed once.
        (0, react_fiber_hydration_context_1.warnIfHydrating)();
        if ((workInProgress.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
            return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, null);
        }
        if (isSuspenseInstanceFallback(suspenseInstance)) {
            // This boundary is in a permanent fallback state. In this case, we'll never
            // get an update and we'll never be able to hydrate the final content. Let's just try the
            // client side render instead.
            var digest = void 0;
            var message = void 0, stack = void 0;
            if (__DEV__) {
                (_a = getSuspenseInstanceFallbackErrorDetails(suspenseInstance), digest = _a.digest, message = _a.message, stack = _a.stack);
            }
            else {
                (digest = getSuspenseInstanceFallbackErrorDetails(suspenseInstance).digest);
            }
            var capturedValue = null;
            // TODO: Figure out a better signal than encoding a magic digest value.
            if (!react_feature_flags_1.enablePostpone || digest !== "POSTPONE") {
                var error = void 0;
                if (message) {
                    // not-used: eslint-disable-next-line react-internal/prod-error-codes
                    error = new Error(message);
                }
                else {
                    error = new Error("The server could not finish this Suspense boundary, likely " + "due to an error during server rendering. Switched to " + "client rendering.");
                }
                error.digest = digest;
                capturedValue = (0, react_captured_value_1.createCapturedValue)(error, digest, stack);
            }
            return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, capturedValue);
        }
        if (react_feature_flags_1.enableLazyContextPropagation && // TODO: Factoring is a little weird, since we check this right below, too.
            // But don't want to re-arrange the if-else chain until/unless this
            // feature lands.
            !(0, react_fiber_work_in_progress_receive_update_1.didWorkInProgressReceiveUpdate)()) {
            // We need to check if any children have context before we decide to bail
            // out, so propagate the changes now.
            (0, react_fiber_new_context_1.lazilyPropagateParentContextChanges)(current, workInProgress, renderLanes);
        }
        // We use lanes to indicate that a child might depend on context, so if
        // any context has changed, we need to treat is as if the input might have changed.
        var hasContextChanged = (0, react_fiber_lane_1.includesSomeLane)(renderLanes, current.childLanes);
        if ((0, react_fiber_work_in_progress_receive_update_1.didWorkInProgressReceiveUpdate)() || hasContextChanged) {
            // This boundary has changed since the first render. This means that we are now unable to
            // hydrate it. We might still be able to hydrate it using a higher priority lane.
            var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
            if (root !== null) {
                var attemptHydrationAtLane = (0, react_fiber_lane_1.getBumpedLaneForHydration)(root, renderLanes);
                if (attemptHydrationAtLane !== fiber_lane_constants_1.NoLane && attemptHydrationAtLane !== suspenseState.retryLane) {
                    // Intentionally mutating since this render will get interrupted. This
                    // is one of the very rare times where we mutate the current tree
                    // during the render phase.
                    suspenseState.retryLane = attemptHydrationAtLane;
                    (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(current, attemptHydrationAtLane);
                    (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, current, attemptHydrationAtLane);
                    // Throw a special object that signals to the work loop that it should
                    // interrupt the current render.
                    //
                    // Because we're inside a React-only execution stack, we don't
                    // strictly need to throw here — we could instead modify some internal
                    // work loop state. But using an exception means we don't need to
                    // check for this case on every iteration of the work loop. So doing
                    // it this way moves the check out of the fast path.
                    throw react_fiber_work_selective_hydration_exception_1.SelectiveHydrationException;
                }
                else { // We have already tried to ping at a higher priority than we're rendering with
                    // so if we got here, we must have failed to hydrate at those levels. We must
                    // now give up. Instead, we're going to delete the whole subtree and instead inject
                    // a new real Suspense boundary to take its place, which may render content
                    // or fallback. This might suspend for a while and if it does we might still have
                    // an opportunity to hydrate before this pass commits.
                }
            }
            // If we did not selectively hydrate, we'll continue rendering without
            // hydrating. Mark this tree as suspended to prevent it from committing
            // outside a transition.
            //
            // This path should only happen if the hydration lane already suspended.
            // Currently, it also happens during sync updates because there is no
            // hydration lane for sync updates.
            // TODO: We should ideally have a sync hydration lane that we can apply to do
            // a pass where we hydrate this subtree in place using the previous Context and then
            // reapply the update afterwards.
            if (isSuspenseInstancePending(suspenseInstance)) { // This is a dehydrated suspense instance. We don't need to suspend
                // because we're already showing a fallback.
                // TODO: The Fizz runtime might still stream in completed HTML, out-of-
                // band. Should we fix this? There's a version of this bug that happens
                // during client rendering, too. Needs more consideration.
            }
            else {
                (0, react_fiber_work_in_progress_render_did_1.renderDidSuspendDelayIfPossible)();
            }
            return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, null);
        }
        else if (isSuspenseInstancePending(suspenseInstance)) {
            // This component is still pending more data from the server, so we can't hydrate its
            // content. We treat it as if this component suspended itself. It might seem as if
            // we could just try to render it client-side instead. However, this will perform a
            // lot of unnecessary work and is unlikely to complete since it often will suspend
            // on missing data anyway. Additionally, the server might be able to render more
            // than we can on the client yet. In that case we'd end up with more fallback states
            // on the client than if we just leave it alone. If the server times out or errors
            // these should update this boundary to the permanent Fallback state instead.
            // Mark it as having captured (i.e. suspended).
            workInProgress.flags |= fiber_flags_1.FiberFlags.DidCapture;
            // Leave the child in place. I.e. the dehydrated fragment.
            workInProgress.child = current.child;
            // Register a callback to retry this boundary once the server has sent the result.
            var retry = react_fiber_work_retry_boundary_1.retryDehydratedSuspenseBoundary.bind(null, current);
            registerSuspenseInstanceRetry(suspenseInstance, retry);
            return null;
        }
        else {
            // This is the first attempt.
            (0, react_fiber_hydration_context_1.reenterHydrationStateFromDehydratedSuspenseInstance)(workInProgress, suspenseInstance, suspenseState.treeContext);
            var primaryChildren = nextProps.children;
            var primaryChildFragment = mountSuspensePrimaryChildren(workInProgress, primaryChildren, renderLanes);
            // Mark the children as hydrating. This is a fast path to know whether this
            // tree is part of a hydrating tree. This is used to determine if a child
            // node has fully mounted yet, and for scheduling event replaying.
            // Conceptually this is similar to Placement in that a new subtree is
            // inserted into the React tree here. It just happens to not need DOM
            // mutations because it already exists.
            primaryChildFragment.flags |= fiber_flags_1.FiberFlags.Hydrating;
            return primaryChildFragment;
        }
    }
    else {
        // This is the second render pass. We already attempted to hydrated, but
        // something either suspended or errored.
        if (workInProgress.flags & fiber_flags_1.FiberFlags.ForceClientRender) {
            // Something errored during hydration. Try again without hydrating.
            (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
            workInProgress.flags &= ~fiber_flags_1.FiberFlags.ForceClientRender;
            var capturedValue = (0, react_captured_value_1.createCapturedValue)(new Error("There was an error while hydrating this Suspense boundary. " + "Switched to client rendering."));
            return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, capturedValue);
        }
        else if (workInProgress.memoizedState !== null) {
            // Something suspended and we should still be in dehydrated mode.
            // Leave the existing child in place.
            // Push to avoid a mismatch
            (0, react_fiber_suspense_context_1.pushFallbackTreeSuspenseHandler)(workInProgress);
            workInProgress.child = current.child;
            // The dehydrated completion pass expects this flag to be there
            // but the normal suspense pass doesn't.
            workInProgress.flags |= fiber_flags_1.FiberFlags.DidCapture;
            return null;
        }
        else {
            // Suspended but we should no longer be in dehydrated mode.
            // Therefore we now have to render the fallback.
            (0, react_fiber_suspense_context_1.pushFallbackTreeSuspenseHandler)(workInProgress);
            var nextPrimaryChildren = nextProps.children;
            var nextFallbackChildren = nextProps.fallback;
            var fallbackChildFragment = mountSuspenseFallbackAfterRetryWithoutHydrating(current, workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
            var primaryChildFragment = workInProgress.child;
            primaryChildFragment.memoizedState = mountSuspenseOffscreenState(renderLanes);
            workInProgress.memoizedState = SUSPENDED_MARKER;
            return fallbackChildFragment;
        }
    }
}
function scheduleSuspenseWorkOnFiber(fiber, renderLanes, propagationRoot) {
    fiber.lanes = (0, react_fiber_lane_1.mergeLanes)(fiber.lanes, renderLanes);
    var alternate = fiber.alternate;
    if (alternate !== null) {
        alternate.lanes = (0, react_fiber_lane_1.mergeLanes)(alternate.lanes, renderLanes);
    }
    (0, react_fiber_new_context_1.scheduleContextWorkOnParentPath)(fiber.return, renderLanes, propagationRoot);
}
function propagateSuspenseContextChange(workInProgress, firstChild, renderLanes) {
    // Mark any Suspense boundaries with fallbacks as having work to do.
    // If they were previously forced into fallbacks, they may now be able
    // to unblock.
    var node = firstChild;
    while (node !== null) {
        if (node.tag === work_tags_1.WorkTag.SuspenseComponent) {
            var state = node.memoizedState;
            if (state !== null) {
                scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
            }
        }
        else if (node.tag === work_tags_1.WorkTag.SuspenseListComponent) {
            // If the tail is hidden there might not be an Suspense boundaries
            // to schedule work on. In this case we have to schedule it on the
            // list itself.
            // We don't have to traverse to the children of the list since
            // the list will propagate the change when it rerenders.
            scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
        }
        else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === workInProgress) {
            return;
        }
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        while (node.sibling === null) {
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            if (node.return === null || node.return === workInProgress) {
                return;
            }
            node = node.return;
        }
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        node.sibling.return = node.return;
        node = node.sibling;
    }
}
function findLastContentRow(firstChild) {
    // This is going to find the last row among these children that is already
    // showing content on the screen, as opposed to being in fallback state or
    // new. If a row has multiple Suspense boundaries, any of them being in the
    // fallback state, counts as the whole row being in a fallback state.
    // Note that the "rows" will be workInProgress, but any nested children
    // will still be current since we haven't rendered them yet. The mounted
    // order may not be the same as the new order. We use the new order.
    var row = firstChild;
    var lastContentRow = null;
    while (row !== null) {
        var currentRow = row.alternate;
        // New rows can't be content rows.
        if (currentRow !== null && (0, react_fiber_suspense_component_1.findFirstSuspended)(currentRow) === null) {
            lastContentRow = row;
        }
        row = row.sibling;
    }
    return lastContentRow;
}
function validateRevealOrder(revealOrder) {
    if (__DEV__) {
        if (revealOrder !== undefined && revealOrder !== "forwards" && revealOrder !== "backwards" && revealOrder !== "together" && !didWarnAboutRevealOrder[revealOrder]) {
            didWarnAboutRevealOrder[revealOrder] = true;
            console.error("%s is not a supported value for revealOrder on <SuspenseList />. " + "Did you mean \"together\", \"forwards\" or \"backwards\"?", revealOrder);
        }
    }
}
function validateTailOptions(tailMode, revealOrder) {
    if (__DEV__) {
        if (tailMode !== undefined && !didWarnAboutTailOptions[tailMode]) {
            if (tailMode !== "collapsed" && tailMode !== "hidden") {
                didWarnAboutTailOptions[tailMode] = true;
                console.error("\"%s\" is not a supported value for tail on <SuspenseList />. " + "Did you mean \"collapsed\" or \"hidden\"?", tailMode);
            }
            else if (revealOrder !== "forwards" && revealOrder !== "backwards") {
                didWarnAboutTailOptions[tailMode] = true;
                console.error("<SuspenseList tail=\"%s\" /> is only valid if revealOrder is " + "\"forwards\" or \"backwards\". " + "Did you mean to specify revealOrder=\"forwards\"?", tailMode);
            }
        }
    }
}
function validateSuspenseListNestedChild(childSlot, index) {
    if (__DEV__) {
        var isAnArray = Array.isArray(childSlot);
        var isIterable = !isAnArray && typeof (0, react_symbols_1.getIteratorFn)(childSlot) === "function";
        if (isAnArray || isIterable) {
            var type = isAnArray ? "array" : "iterable";
            console.error("A nested %s was passed to row #%s in <SuspenseList />. Wrap it in " + "an additional SuspenseList to configure its revealOrder: " + "<SuspenseList revealOrder=...> ... " + "<SuspenseList revealOrder=...>{%s}</SuspenseList> ... " + "</SuspenseList>", type, index, type);
            return false;
        }
    }
    return true;
}
function validateSuspenseListChildren(children, revealOrder) {
    if (__DEV__) {
        if ((revealOrder === "forwards" || revealOrder === "backwards") && children !== undefined && children !== null && children !== false) {
            if (Array.isArray(children)) {
                for (var i = 0; i < children.length; i++) {
                    if (!validateSuspenseListNestedChild(children[i], i)) {
                        return;
                    }
                }
            }
            else {
                var iteratorFn = (0, react_symbols_1.getIteratorFn)(children);
                if (typeof iteratorFn === "function") {
                    var childrenIterator = iteratorFn.call(children);
                    if (childrenIterator) {
                        var step = childrenIterator.next();
                        var i = 0;
                        for (; !step.done; step = childrenIterator.next()) {
                            if (!validateSuspenseListNestedChild(step.value, i)) {
                                return;
                            }
                            i++;
                        }
                    }
                }
                else {
                    console.error("A single row was passed to a <SuspenseList revealOrder=\"%s\" />. " + "This is not useful since it needs multiple rows. " + "Did you mean to pass multiple children or an array?", revealOrder);
                }
            }
        }
    }
}
function initSuspenseListRenderState(workInProgress, isBackwards, tail, lastContentRow, tailMode) {
    var renderState = workInProgress.memoizedState;
    if (renderState === null) {
        workInProgress.memoizedState = {
            isBackwards: isBackwards,
            rendering: null,
            renderingStartTime: 0,
            last: lastContentRow,
            tail: tail,
            tailMode: tailMode
        };
    }
    else {
        // We can reuse the existing object from previous renders.
        renderState.isBackwards = isBackwards;
        renderState.rendering = null;
        renderState.renderingStartTime = 0;
        renderState.last = lastContentRow;
        renderState.tail = tail;
        renderState.tailMode = tailMode;
    }
}
// This can end up rendering this component multiple passes.
// The first pass splits the children fibers into two sets. A head and tail.
// We first render the head. If anything is in fallback state, we do another
// pass through beginWork to rerender all children (including the tail) with
// the force suspend context. If the first render didn't have anything in
// in fallback state. Then we render each row in the tail one-by-one.
// That happens in the completeWork phase without going back to beginWork.
function updateSuspenseListComponent(current, workInProgress, renderLanes) {
    var nextProps = workInProgress.pendingProps;
    var revealOrder = nextProps.revealOrder;
    var tailMode = nextProps.tail;
    var newChildren = nextProps.children;
    validateRevealOrder(revealOrder);
    validateTailOptions(tailMode, revealOrder);
    validateSuspenseListChildren(newChildren, revealOrder);
    reconcileChildren(current, workInProgress, newChildren, renderLanes);
    var suspenseContext = react_fiber_suspense_context_1.suspenseStackCursor.current;
    var shouldForceFallback = (0, react_fiber_suspense_context_1.hasSuspenseListContext)(suspenseContext, react_fiber_suspense_context_1.ForceSuspenseFallback);
    if (shouldForceFallback) {
        suspenseContext = (0, react_fiber_suspense_context_1.setShallowSuspenseListContext)(suspenseContext, react_fiber_suspense_context_1.ForceSuspenseFallback);
        workInProgress.flags |= fiber_flags_1.FiberFlags.DidCapture;
    }
    else {
        var didSuspendBefore = current !== null && (current.flags & fiber_flags_1.FiberFlags.DidCapture) !== fiber_flags_1.FiberFlags.NoFlags;
        if (didSuspendBefore) {
            // If we previously forced a fallback, we need to schedule work
            // on any nested boundaries to let them know to try to render
            // again. This is the same as context updating.
            propagateSuspenseContextChange(workInProgress, workInProgress.child, renderLanes);
        }
        suspenseContext = (0, react_fiber_suspense_context_1.setDefaultShallowSuspenseListContext)(suspenseContext);
    }
    (0, react_fiber_suspense_context_1.pushSuspenseListContext)(workInProgress, suspenseContext);
    if ((workInProgress.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
        // In legacy mode, SuspenseList doesn't work so we just
        // use make it a noop by treating it as the default revealOrder.
        workInProgress.memoizedState = null;
    }
    else {
        switch (revealOrder) {
            case "forwards": {
                var lastContentRow = findLastContentRow(workInProgress.child);
                var tail = void 0;
                if (lastContentRow === null) {
                    // The whole list is part of the tail.
                    // TODO: We could fast path by just rendering the tail now.
                    tail = workInProgress.child;
                    workInProgress.child = null;
                }
                else {
                    // Disconnect the tail rows after the content row.
                    // We're going to render them separately later.
                    tail = lastContentRow.sibling;
                    lastContentRow.sibling = null;
                }
                initSuspenseListRenderState(workInProgress, false, // isBackwards
                tail, lastContentRow, tailMode);
                break;
            }
            case "backwards": {
                // We're going to find the first row that has existing content.
                // At the same time we're going to reverse the list of everything
                // we pass in the meantime. That's going to be our tail in reverse
                // order.
                var tail = null;
                var row = workInProgress.child;
                workInProgress.child = null;
                while (row !== null) {
                    var currentRow = row.alternate;
                    // New rows can't be content rows.
                    if (currentRow !== null && (0, react_fiber_suspense_component_1.findFirstSuspended)(currentRow) === null) {
                        // This is the beginning of the main content.
                        workInProgress.child = row;
                        break;
                    }
                    var nextRow = row.sibling;
                    row.sibling = tail;
                    tail = row;
                    row = nextRow;
                }
                // TODO: If workInProgress.child is null, we can continue on the tail immediately.
                initSuspenseListRenderState(workInProgress, true, // isBackwards
                tail, null, // last
                tailMode);
                break;
            }
            case "together": {
                initSuspenseListRenderState(workInProgress, false, // isBackwards
                null, // tail
                null, // last
                undefined);
                break;
            }
            default: {
                // The default reveal order is the same as not having
                // a boundary.
                workInProgress.memoizedState = null;
            }
        }
    }
    return workInProgress.child;
}
function updatePortalComponent(current, workInProgress, renderLanes) {
    (0, react_fiber_host_context_1.pushHostContainer)(workInProgress, workInProgress.stateNode.containerInfo);
    var nextChildren = workInProgress.pendingProps;
    if (current === null) {
        // Portals are special because we don't append the children during mount
        // but at commit. Therefore we need to track insertions which the normal
        // flow doesn't do during mount. This doesn't happen at the root because
        // the root always starts with a "current" with a null child.
        // TODO: Consider unifying this with how the root works.
        workInProgress.child = (0, react_fiber_child_1.reconcileChildFibers)(workInProgress, null, nextChildren, renderLanes);
    }
    else {
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    }
    return workInProgress.child;
}
var hasWarnedAboutUsingNoValuePropOnContextProvider = false;
function updateContextProvider(current, workInProgress, renderLanes) {
    var providerType = workInProgress.type;
    var context = providerType._context;
    var newProps = workInProgress.pendingProps;
    var oldProps = workInProgress.memoizedProps;
    var newValue = newProps.value;
    if (__DEV__) {
        if (!("value" in newProps)) {
            if (!hasWarnedAboutUsingNoValuePropOnContextProvider) {
                hasWarnedAboutUsingNoValuePropOnContextProvider = true;
                console.error("The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?");
            }
        }
        var providerPropTypes = workInProgress.type.propTypes;
        if (providerPropTypes) {
            (0, check_prop_types_1.default)(providerPropTypes, newProps, "prop", "Context.Provider");
        }
    }
    (0, react_fiber_new_context_1.pushProvider)(workInProgress, context, newValue);
    if (react_feature_flags_1.enableLazyContextPropagation) { // In the lazy propagation implementation, we don't scan for matching
        // consumers until something bails out, because until something bails out
        // we're going to visit those nodes, anyway. The trade-off is that it shifts
        // responsibility to the consumer to track whether something has changed.
    }
    else {
        if (oldProps !== null) {
            var oldValue = oldProps.value;
            if ((0, object_is_1.default)(oldValue, newValue)) {
                // No change. Bailout early if children are the same.
                if (oldProps.children === newProps.children && !(0, react_fiber_context_1.hasContextChanged)()) {
                    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
                }
            }
            else {
                // The context value changed. Search for matching consumers and schedule
                // them to update.
                (0, react_fiber_new_context_1.propagateContextChange)(workInProgress, context, renderLanes);
            }
        }
    }
    var newChildren = newProps.children;
    reconcileChildren(current, workInProgress, newChildren, renderLanes);
    return workInProgress.child;
}
var hasWarnedAboutUsingContextAsConsumer = false;
function updateContextConsumer(current, workInProgress, renderLanes) {
    var context = workInProgress.type;
    // The logic below for Context differs depending on PROD or DEV mode. In
    // DEV mode, we create a separate object for Context.Consumer that acts
    // like a proxy to Context. This proxy object adds unnecessary code in PROD
    // so we use the old behaviour (Context.Consumer references Context) to
    // reduce size and overhead. The separate object references context via
    // a property called "_context", which also gives us the ability to check
    // in DEV mode if this property exists or not and warn if it does not.
    if (__DEV__) {
        if (context._context === undefined) {
            // This may be because it's a Context (rather than a Consumer).
            // Or it may be because it's older React where they're the same thing.
            // We only want to warn if we're sure it's a new React.
            if (context !== context.Consumer) {
                if (!hasWarnedAboutUsingContextAsConsumer) {
                    hasWarnedAboutUsingContextAsConsumer = true;
                    console.error("Rendering <Context> directly is not supported and will be removed in " + "a future major release. Did you mean to render <Context.Consumer> instead?");
                }
            }
        }
        else {
            context = context._context;
        }
    }
    var newProps = workInProgress.pendingProps;
    var render = newProps.children;
    if (__DEV__) {
        if (typeof render !== "function") {
            console.error("A context consumer was rendered with multiple children, or a child " + "that isn't a function. A context consumer expects a single child " + "that is a function. If you did pass a function, make sure there " + "is no trailing or leading whitespace around it.");
        }
    }
    (0, react_fiber_new_context_1.prepareToReadContext)(workInProgress, renderLanes);
    var newValue = (0, react_fiber_new_context_1.readContext)(context);
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStarted)(workInProgress);
    }
    var newChildren;
    if (__DEV__) {
        ReactCurrentOwner.current = workInProgress;
        (0, react_current_fiber_1.setIsRendering)(true);
        newChildren = render(newValue);
        (0, react_current_fiber_1.setIsRendering)(false);
    }
    else {
        newChildren = render(newValue);
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markComponentRenderStopped)();
    }
    // React DevTools reads this flag.
    workInProgress.flags |= fiber_flags_1.FiberFlags.PerformedWork;
    reconcileChildren(current, workInProgress, newChildren, renderLanes);
    return workInProgress.child;
}
function updateScopeComponent(current, workInProgress, renderLanes) {
    var nextProps = workInProgress.pendingProps;
    var nextChildren = nextProps.children;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}
function resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress) {
    if ((workInProgress.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) === type_of_mode_1.TypeOfMode.NoMode) {
        if (current !== null) {
            // A lazy component only mounts if it suspended inside a non-
            // concurrent tree, in an inconsistent state. We want to treat it like
            // a new mount, even though an empty version of it already committed.
            // Disconnect the alternate pointers.
            current.alternate = null;
            workInProgress.alternate = null;
            // Since this is conceptually a new fiber, schedule a Placement effect
            workInProgress.flags |= fiber_flags_1.FiberFlags.Placement;
        }
    }
}
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
    if (current !== null) {
        // Reuse previous dependencies
        workInProgress.dependencies = current.dependencies;
    }
    if (react_feature_flags_1.enableProfilerTimer) {
        // Don't update "base" render times for bailouts.
        (0, react_profile_timer_1.stopProfilerTimerIfRunning)(workInProgress);
    }
    (0, react_fiber_work_in_progress_1.markSkippedUpdateLanes)(workInProgress.lanes);
    // Check if the children have any pending work.
    if (!(0, react_fiber_lane_1.includesSomeLane)(renderLanes, workInProgress.childLanes)) {
        // The children don't have any work either. We can skip them.
        // TODO: Once we add back resuming, we should check if the children are
        // a work-in-progress set. If so, we need to transfer their effects.
        if (react_feature_flags_1.enableLazyContextPropagation && current !== null) {
            // Before bailing out, check if there are any context changes in
            // the children.
            (0, react_fiber_new_context_1.lazilyPropagateParentContextChanges)(current, workInProgress, renderLanes);
            if (!(0, react_fiber_lane_1.includesSomeLane)(renderLanes, workInProgress.childLanes)) {
                return null;
            }
        }
        else {
            return null;
        }
    }
    // This fiber doesn't have work, but its subtree does. Clone the child
    // fibers and continue.
    (0, react_fiber_child_1.cloneChildFibers)(current, workInProgress);
    return workInProgress.child;
}
function remountFiber(current, oldWorkInProgress, newWorkInProgress) {
    if (__DEV__) {
        var returnFiber = oldWorkInProgress.return;
        if (returnFiber === null) {
            // not-used: eslint-disable-next-line react-internal/prod-error-codes
            throw new Error("Cannot swap the root fiber.");
        }
        // Disconnect from the old current.
        // It will get deleted.
        current.alternate = null;
        oldWorkInProgress.alternate = null;
        // Connect to the new tree.
        newWorkInProgress.index = oldWorkInProgress.index;
        newWorkInProgress.sibling = oldWorkInProgress.sibling;
        newWorkInProgress.return = oldWorkInProgress.return;
        newWorkInProgress.ref = oldWorkInProgress.ref;
        // Replace the child/sibling pointers above it.
        if (oldWorkInProgress === returnFiber.child) {
            returnFiber.child = newWorkInProgress;
        }
        else {
            var prevSibling = returnFiber.child;
            if (prevSibling === null) {
                // not-used: eslint-disable-next-line react-internal/prod-error-codes
                throw new Error("Expected parent to have a child.");
            }
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            while (prevSibling.sibling !== oldWorkInProgress) {
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                prevSibling = prevSibling.sibling;
                if (prevSibling === null) {
                    // not-used: eslint-disable-next-line react-internal/prod-error-codes
                    throw new Error("Expected to find the previous sibling.");
                }
            }
            // $FlowFixMe[incompatible-use] found when upgrading Flow
            prevSibling.sibling = newWorkInProgress;
        }
        // Delete the old fiber and place the new one.
        // Since the old fiber is disconnected, we have to schedule it manually.
        var deletions = returnFiber.deletions;
        if (deletions === null) {
            returnFiber.deletions = [current];
            returnFiber.flags |= fiber_flags_1.FiberFlags.ChildDeletion;
        }
        else {
            deletions.push(current);
        }
        newWorkInProgress.flags |= fiber_flags_1.FiberFlags.Placement;
        // Restart work from the new fiber.
        return newWorkInProgress;
    }
    else {
        throw new Error("Did not expect this call in production. " + "This is a bug in React. Please file an issue.");
    }
}
function checkScheduledUpdateOrContext(current, renderLanes) {
    // Before performing an early bailout, we must check if there are pending
    // updates or context.
    var updateLanes = current.lanes;
    if ((0, react_fiber_lane_1.includesSomeLane)(updateLanes, renderLanes)) {
        return true;
    }
    // No pending update, but because context is propagated lazily, we need
    // to check for a context change before we bail out.
    if (react_feature_flags_1.enableLazyContextPropagation) {
        var dependencies = current.dependencies;
        if (dependencies !== null && (0, react_fiber_new_context_1.checkIfContextChanged)(dependencies)) {
            return true;
        }
    }
    return false;
}
function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes) {
    // This fiber does not have any pending work. Bailout without entering
    // the begin phase. There's still some bookkeeping we that needs to be done
    // in this optimized path, mostly pushing stuff onto the stack.
    switch (workInProgress.tag) {
        case work_tags_1.WorkTag.HostRoot:
            pushHostRootContext(workInProgress);
            var root = workInProgress.stateNode;
            (0, react_fiber_transition_1.pushRootTransition)(workInProgress, root, renderLanes);
            if (react_feature_flags_1.enableTransitionTracing) {
                (0, react_fiber_tracing_marker_component_1.pushRootMarkerInstance)(workInProgress);
            }
            if (react_feature_flags_1.enableCache) {
                var cache = current.memoizedState.cache;
                (0, react_fiber_cache_component_provider_1.pushCacheProvider)(workInProgress, cache);
            }
            (0, react_fiber_hydration_context_1.resetHydrationState)();
            break;
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent:
            (0, react_fiber_host_context_1.pushHostContext)(workInProgress);
            break;
        case work_tags_1.WorkTag.ClassComponent: {
            var Component = workInProgress.type;
            if ((0, react_fiber_context_1.isContextProvider)(Component)) {
                (0, react_fiber_context_1.pushContextProvider)(workInProgress);
            }
            break;
        }
        case work_tags_1.WorkTag.HostPortal:
            (0, react_fiber_host_context_1.pushHostContainer)(workInProgress, workInProgress.stateNode.containerInfo);
            break;
        case work_tags_1.WorkTag.ContextProvider: {
            var newValue = workInProgress.memoizedProps.value;
            var context = workInProgress.type._context;
            (0, react_fiber_new_context_1.pushProvider)(workInProgress, context, newValue);
            break;
        }
        case work_tags_1.WorkTag.Profiler:
            if (react_feature_flags_1.enableProfilerTimer) {
                // Profiler should only call onRender when one of its descendants actually rendered.
                var hasChildWork = (0, react_fiber_lane_1.includesSomeLane)(renderLanes, workInProgress.childLanes);
                if (hasChildWork) {
                    workInProgress.flags |= fiber_flags_1.FiberFlags.Update;
                }
                if (react_feature_flags_1.enableProfilerCommitHooks) {
                    // Reset effect durations for the next eventual effect phase.
                    // These are reset during render to allow the DevTools commit hook a chance to read them,
                    var stateNode = workInProgress.stateNode;
                    stateNode.effectDuration = 0;
                    stateNode.passiveEffectDuration = 0;
                }
            }
            break;
        case work_tags_1.WorkTag.SuspenseComponent: {
            var state = workInProgress.memoizedState;
            if (state !== null) {
                if (state.dehydrated !== null) {
                    // We're not going to render the children, so this is just to maintain
                    // push/pop symmetry
                    (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
                    // We know that this component will suspend again because if it has
                    // been unsuspended it has committed as a resolved Suspense component.
                    // If it needs to be retried, it should have work scheduled on it.
                    workInProgress.flags |= fiber_flags_1.FiberFlags.DidCapture;
                    // We should never render the children of a dehydrated boundary until we
                    // upgrade it. We return null instead of bailoutOnAlreadyFinishedWork.
                    return null;
                }
                // If this boundary is currently timed out, we need to decide
                // whether to retry the primary children, or to skip over it and
                // go straight to the fallback. Check the priority of the primary
                // child fragment.
                var primaryChildFragment = workInProgress.child;
                var primaryChildLanes = primaryChildFragment.childLanes;
                if ((0, react_fiber_lane_1.includesSomeLane)(renderLanes, primaryChildLanes)) {
                    // The primary children have pending work. Use the normal path
                    // to attempt to render the primary children again.
                    return updateSuspenseComponent(current, workInProgress, renderLanes);
                }
                else {
                    // The primary child fragment does not have pending work marked
                    // on it
                    (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
                    // The primary children do not have pending work with sufficient
                    // priority. Bailout.
                    var child = bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
                    if (child !== null) {
                        // The fallback children have pending work. Skip over the
                        // primary children and work on the fallback.
                        return child.sibling;
                    }
                    else {
                        // Note: We can return `null` here because we already checked
                        // whether there were nested context consumers, via the call to
                        // `bailoutOnAlreadyFinishedWork` above.
                        return null;
                    }
                }
            }
            else {
                (0, react_fiber_suspense_context_1.pushPrimaryTreeSuspenseHandler)(workInProgress);
            }
            break;
        }
        case work_tags_1.WorkTag.SuspenseListComponent: {
            var didSuspendBefore = (current.flags & fiber_flags_1.FiberFlags.DidCapture) !== fiber_flags_1.FiberFlags.NoFlags;
            var hasChildWork = (0, react_fiber_lane_1.includesSomeLane)(renderLanes, workInProgress.childLanes);
            if (react_feature_flags_1.enableLazyContextPropagation && !hasChildWork) {
                // Context changes may not have been propagated yet. We need to do
                // that now, before we can decide whether to bail out.
                // TODO: We use `childLanes` as a heuristic for whether there is
                // remaining work in a few places, including
                // `bailoutOnAlreadyFinishedWork` and
                // `updateDehydratedSuspenseComponent`. We should maybe extract this
                // into a dedicated function.
                (0, react_fiber_new_context_1.lazilyPropagateParentContextChanges)(current, workInProgress, renderLanes);
                hasChildWork = (0, react_fiber_lane_1.includesSomeLane)(renderLanes, workInProgress.childLanes);
            }
            if (didSuspendBefore) {
                if (hasChildWork) {
                    // If something was in fallback state last time, and we have all the
                    // same children then we're still in progressive loading state.
                    // Something might get unblocked by state updates or retries in the
                    // tree which will affect the tail. So we need to use the normal
                    // path to compute the correct tail.
                    return updateSuspenseListComponent(current, workInProgress, renderLanes);
                }
                // If none of the children had any work, that means that none of
                // them got retried so they'll still be blocked in the same way
                // as before. We can fast bail out.
                workInProgress.flags |= fiber_flags_1.FiberFlags.DidCapture;
            }
            // If nothing suspended before and we're rendering the same children,
            // then the tail doesn't matter. Anything new that suspends will work
            // in the "together" mode, so we can continue from the state we had.
            var renderState = workInProgress.memoizedState;
            if (renderState !== null) {
                // Reset to the "together" mode in case we've started a different
                // update in the past but didn't complete it.
                renderState.rendering = null;
                renderState.tail = null;
                renderState.lastEffect = null;
            }
            (0, react_fiber_suspense_context_1.pushSuspenseListContext)(workInProgress, react_fiber_suspense_context_1.suspenseStackCursor.current);
            if (hasChildWork) {
                break;
            }
            else {
                // If none of the children had any work, that means that none of
                // them got retried so they'll still be blocked in the same way
                // as before. We can fast bail out.
                return null;
            }
        }
        case work_tags_1.WorkTag.OffscreenComponent:
        case work_tags_1.WorkTag.LegacyHiddenComponent: {
            // Need to check if the tree still needs to be deferred. This is
            // almost identical to the logic used in the normal update path,
            // so we'll just enter that. The only difference is we'll bail out
            // at the next level instead of this one, because the child props
            // have not changed. Which is fine.
            // TODO: Probably should refactor `beginWork` to split the bailout
            // path from the normal path. I'm tempted to do a labeled break here
            // but I won't :)
            workInProgress.lanes = fiber_lane_constants_1.NoLanes;
            return updateOffscreenComponent(current, workInProgress, renderLanes);
        }
        case work_tags_1.WorkTag.CacheComponent: {
            if (react_feature_flags_1.enableCache) {
                var cache = current.memoizedState.cache;
                (0, react_fiber_cache_component_provider_1.pushCacheProvider)(workInProgress, cache);
            }
            break;
        }
        case work_tags_1.WorkTag.TracingMarkerComponent: {
            if (react_feature_flags_1.enableTransitionTracing) {
                var instance = workInProgress.stateNode;
                if (instance !== null) {
                    (0, react_fiber_tracing_marker_component_1.pushMarkerInstance)(workInProgress, instance);
                }
            }
        }
    }
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}
function beginWork(current, workInProgress, renderLanes) {
    if (__DEV__) {
        if (workInProgress._debugNeedsRemount && current !== null) {
            // This will restart the begin phase with a new fiber.
            return remountFiber(current, workInProgress, (0, react_fiber_from_create_type_n_props_1.createFiberFromTypeAndProps)(workInProgress.type, workInProgress.key, workInProgress.pendingProps, workInProgress._debugSource || null, workInProgress._debugOwner || null, workInProgress.mode, workInProgress.lanes));
        }
    }
    if (current !== null) {
        var oldProps = current.memoizedProps;
        var newProps = workInProgress.pendingProps;
        // console.log( "beginWork: current:", current, "workInProgress:", workInProgress, "oldProps:", oldProps, "newProps:", newProps );
        if (oldProps !== newProps || (0, react_fiber_context_1.hasContextChanged)() || ( // Force a re-render if the implementation changed due to hot reload:
        __DEV__ ? workInProgress.type !== current.type : false)) {
            // If props or context changed, mark the fiber as having performed work.
            // This may be unset if the props are determined to be equal later (memo).
            (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
        }
        else {
            // Neither props nor legacy context changes. Check if there's a pending
            // update or context change.
            var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
            if (!hasScheduledUpdateOrContext && // If this is the second pass of an error or suspense boundary, there
                // may not be work scheduled on `current`, so we check for this flag.
                (workInProgress.flags & fiber_flags_1.FiberFlags.DidCapture) === fiber_flags_1.FiberFlags.NoFlags) {
                // No pending updates or context. Bail out now.
                (0, react_fiber_work_in_progress_receive_update_1.resetWorkInProgressReceivedUpdate)();
                return attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes);
            }
            if ((current.flags & fiber_flags_1.FiberFlags.ForceUpdateForLegacySuspense) !== fiber_flags_1.FiberFlags.NoFlags) {
                // This is a special case that only exists for legacy mode.
                // See https://github.com/facebook/react/pull/19216.
                (0, react_fiber_work_in_progress_receive_update_1.markWorkInProgressReceivedUpdate)();
            }
            else {
                // An update was scheduled on this fiber, but there are no new props
                // nor legacy context. Set this to false. If an update queue or context
                // consumer produces a changed value, it will set this to true. Otherwise,
                // the component will assume the children have not changed and bail out.
                (0, react_fiber_work_in_progress_receive_update_1.resetWorkInProgressReceivedUpdate)();
            }
        }
    }
    else {
        (0, react_fiber_work_in_progress_receive_update_1.resetWorkInProgressReceivedUpdate)();
        if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)() && (0, react_fiber_tree_context_1.isForkedChild)(workInProgress)) {
            // Check if this child belongs to a list of muliple children in
            // its parent.
            //
            // In a true multi-threaded implementation, we would render children on
            // parallel threads. This would represent the beginning of a new render
            // thread for this subtree.
            //
            // We only use this for id generation during hydration, which is why the
            // logic is located in this special branch.
            var slotIndex = workInProgress.index;
            var numberOfForks = (0, react_fiber_tree_context_1.getForksAtLevel)(workInProgress);
            (0, react_fiber_tree_context_1.pushTreeId)(workInProgress, numberOfForks, slotIndex);
        }
    }
    // Before entering the begin phase, clear pending update priority.
    // TODO: This assumes that we're about to evaluate the component and process
    // the update queue. However, there's an exception: SimpleMemoComponent
    // sometimes bails out later in the begin phase. This indicates that we should
    // move this assignment out of the common path and into each branch.
    workInProgress.lanes = fiber_lane_constants_1.NoLanes;
    switch (workInProgress.tag) {
        case work_tags_1.WorkTag.IndeterminateComponent: {
            return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
        }
        case work_tags_1.WorkTag.LazyComponent: {
            var elementType = workInProgress.elementType;
            return mountLazyComponent(current, workInProgress, elementType, renderLanes);
        }
        case work_tags_1.WorkTag.FunctionComponent: {
            var Component = workInProgress.type;
            var unresolvedProps = workInProgress.pendingProps;
            var resolvedProps = workInProgress.elementType === Component ? unresolvedProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(Component, unresolvedProps);
            return updateFunctionComponent(current, workInProgress, Component, resolvedProps, renderLanes);
        }
        case work_tags_1.WorkTag.ClassComponent: {
            var Component = workInProgress.type;
            var unresolvedProps = workInProgress.pendingProps;
            var resolvedProps = workInProgress.elementType === Component ? unresolvedProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(Component, unresolvedProps);
            return updateClassComponent(current, workInProgress, Component, resolvedProps, renderLanes);
        }
        case work_tags_1.WorkTag.HostRoot:
            return updateHostRoot(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.HostHoistable:
            if (react_feature_flags_1.enableFloat && supportsResources) {
                return updateHostHoistable(current, workInProgress, renderLanes);
            }
        // Fall through
        case work_tags_1.WorkTag.HostSingleton:
            if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
                return updateHostSingleton(current, workInProgress, renderLanes);
            }
        // Fall through
        case work_tags_1.WorkTag.HostComponent:
            return updateHostComponent(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.HostText:
            return updateHostText(current, workInProgress);
        case work_tags_1.WorkTag.SuspenseComponent:
            return updateSuspenseComponent(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.HostPortal:
            return updatePortalComponent(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.ForwardRef: {
            var type = workInProgress.type;
            var unresolvedProps = workInProgress.pendingProps;
            var resolvedProps = workInProgress.elementType === type ? unresolvedProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(type, unresolvedProps);
            return updateForwardRef(current, workInProgress, type, resolvedProps, renderLanes);
        }
        case work_tags_1.WorkTag.Fragment:
            return updateFragment(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.Mode:
            return updateMode(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.Profiler:
            return updateProfiler(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.ContextProvider:
            return updateContextProvider(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.ContextConsumer:
            return updateContextConsumer(current, workInProgress, renderLanes);
        case work_tags_1.WorkTag.MemoComponent: {
            var type = workInProgress.type;
            var unresolvedProps = workInProgress.pendingProps;
            // Resolve outer props first, then resolve inner props.
            var resolvedProps = (0, react_fiber_lazy_component_1.resolveDefaultProps)(type, unresolvedProps);
            if (__DEV__) {
                if (workInProgress.type !== workInProgress.elementType) {
                    var outerPropTypes = type.propTypes;
                    if (outerPropTypes) {
                        (0, check_prop_types_1.default)(outerPropTypes, resolvedProps, // Resolved for outer only
                        "prop", (0, get_component_name_from_type_1.default)(type));
                    }
                }
            }
            resolvedProps = (0, react_fiber_lazy_component_1.resolveDefaultProps)(type.type, resolvedProps);
            return updateMemoComponent(current, workInProgress, type, resolvedProps, renderLanes);
        }
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            return updateSimpleMemoComponent(current, workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes);
        }
        case work_tags_1.WorkTag.IncompleteClassComponent: {
            var Component = workInProgress.type;
            var unresolvedProps = workInProgress.pendingProps;
            var resolvedProps = workInProgress.elementType === Component ? unresolvedProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(Component, unresolvedProps);
            return mountIncompleteClassComponent(current, workInProgress, Component, resolvedProps, renderLanes);
        }
        case work_tags_1.WorkTag.SuspenseListComponent: {
            return updateSuspenseListComponent(current, workInProgress, renderLanes);
        }
        case work_tags_1.WorkTag.ScopeComponent: {
            if (react_feature_flags_1.enableScopeAPI) {
                return updateScopeComponent(current, workInProgress, renderLanes);
            }
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            return updateOffscreenComponent(current, workInProgress, renderLanes);
        }
        case work_tags_1.WorkTag.LegacyHiddenComponent: {
            if (react_feature_flags_1.enableLegacyHidden) {
                return updateLegacyHiddenComponent(current, workInProgress, renderLanes);
            }
            break;
        }
        case work_tags_1.WorkTag.CacheComponent: {
            if (react_feature_flags_1.enableCache) {
                return updateCacheComponent(current, workInProgress, renderLanes);
            }
            break;
        }
        case work_tags_1.WorkTag.TracingMarkerComponent: {
            if (react_feature_flags_1.enableTransitionTracing) {
                return updateTracingMarkerComponent(current, workInProgress, renderLanes);
            }
            break;
        }
    }
    throw new Error("Unknown unit of work tag (".concat(workInProgress.tag, "). This error is likely caused by a bug in ") + "React. Please file an issue.");
}
exports.beginWork = beginWork;
