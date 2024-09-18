"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reappearLayoutEffects = exports.disappearLayoutEffects = exports.recursivelyTraverseDisappearLayoutEffects = exports.commitLayoutEffects = exports.commitBeforeMutationEffects = exports.commitMutationEffects = exports.invokePassiveEffectUnmountInDEV = exports.invokeLayoutEffectUnmountInDEV = exports.invokePassiveEffectMountInDEV = exports.invokeLayoutEffectMountInDEV = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var offscreen_1 = require("@zenflux/react-shared/src/react-internal-constants/offscreen");
var hook_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/hook-flags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_commit_current_hoistable_root_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-current-hoistable-root");
var react_fiber_commit_hook_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-hook-effect");
var react_fiber_commit_next_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-next-effect");
var react_fiber_commit_phase_error_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-phase-error");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_most_recent_fallback_time_1 = require("@zenflux/react-reconciler/src/react-fiber-work-most-recent-fallback-time");
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
var react_fiber_work_retry_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-work-retry-boundary");
var react_fiber_work_warn_about_reassigning_props_1 = require("@zenflux/react-reconciler/src/react-fiber-work-warn-about-reassigning-props");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_activity_component_1 = require("@zenflux/react-reconciler/src/react-fiber-activity-component");
var react_fiber_class_update_queue_1 = require("@zenflux/react-reconciler/src/react-fiber-class-update-queue");
var react_fiber_commit_work_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lazy_component_1 = require("@zenflux/react-reconciler/src/react-fiber-lazy-component");
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var _a = globalThis.__RECONCILER__CONFIG__, acquireResource = _a.acquireResource, acquireSingletonInstance = _a.acquireSingletonInstance, beforeActiveInstanceBlur = _a.beforeActiveInstanceBlur, clearContainer = _a.clearContainer, clearSingleton = _a.clearSingleton, clearSuspenseBoundary = _a.clearSuspenseBoundary, clearSuspenseBoundaryFromContainer = _a.clearSuspenseBoundaryFromContainer, commitHydratedContainer = _a.commitHydratedContainer, commitHydratedSuspenseInstance = _a.commitHydratedSuspenseInstance, commitMount = _a.commitMount, commitTextUpdate = _a.commitTextUpdate, commitUpdate = _a.commitUpdate, createContainerChildSet = _a.createContainerChildSet, getHoistableRoot = _a.getHoistableRoot, getPublicInstance = _a.getPublicInstance, hideInstance = _a.hideInstance, hideTextInstance = _a.hideTextInstance, hydrateHoistable = _a.hydrateHoistable, mountHoistable = _a.mountHoistable, prepareForCommit = _a.prepareForCommit, prepareScopeUpdate = _a.prepareScopeUpdate, prepareToCommitHoistables = _a.prepareToCommitHoistables, releaseResource = _a.releaseResource, releaseSingletonInstance = _a.releaseSingletonInstance, removeChild = _a.removeChild, removeChildFromContainer = _a.removeChildFromContainer, replaceContainerChildren = _a.replaceContainerChildren, resetTextContent = _a.resetTextContent, supportsHydration = _a.supportsHydration, supportsMutation = _a.supportsMutation, supportsPersistence = _a.supportsPersistence, supportsResources = _a.supportsResources, supportsSingletons = _a.supportsSingletons, unhideInstance = _a.unhideInstance, unhideTextInstance = _a.unhideTextInstance, unmountHoistable = _a.unmountHoistable;
var PossiblyWeakSet = typeof WeakSet === "function" ? WeakSet : Set;
// Used for Profiling builds to track updaters.
var inProgressLanes = null;
var inProgressRoot = null;
var focusedInstanceHandle = null;
var shouldFireAfterActiveInstanceBlur = false;
// Used during the commit phase to track the state of the Offscreen component stack.
// Allows us to avoid traversing the return path to find the nearest Offscreen ancestor.
var offscreenSubtreeIsHidden = false;
var offscreenSubtreeWasHidden = false;
// These are tracked on the stack as we recursively traverse a
// deleted subtree.
// TODO: Update these during the whole mutation phase, not just during
// a deletion.
var hostParent = null;
var hostParentIsContainer = false;
var didWarnAboutUndefinedSnapshotBeforeUpdate = null;
if (__DEV__) {
    didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
}
function markCommitTimeOfFallback() {
    (0, react_fiber_work_most_recent_fallback_time_1.markGlobalMostRecentFallbackTime)();
}
function invokeLayoutEffectMountInDEV(fiber) {
    if (__DEV__) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
            case work_tags_1.WorkTag.FunctionComponent:
            case work_tags_1.WorkTag.ForwardRef:
            case work_tags_1.WorkTag.SimpleMemoComponent: {
                try {
                    (0, react_fiber_commit_hook_effect_1.commitHookEffectListMount)(hook_flags_1.HookFlags.Layout | hook_flags_1.HookFlags.HasEffect, fiber);
                }
                catch (error) {
                    (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(fiber, fiber.return, error);
                }
                break;
            }
            case work_tags_1.WorkTag.ClassComponent: {
                var instance = fiber.stateNode;
                if (typeof instance.componentDidMount === "function") {
                    try {
                        instance.componentDidMount();
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(fiber, fiber.return, error);
                    }
                }
                break;
            }
        }
    }
}
exports.invokeLayoutEffectMountInDEV = invokeLayoutEffectMountInDEV;
function invokePassiveEffectMountInDEV(fiber) {
    if (__DEV__) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
            case work_tags_1.WorkTag.FunctionComponent:
            case work_tags_1.WorkTag.ForwardRef:
            case work_tags_1.WorkTag.SimpleMemoComponent: {
                try {
                    (0, react_fiber_commit_hook_effect_1.commitHookEffectListMount)(hook_flags_1.HookFlags.Passive | hook_flags_1.HookFlags.HasEffect, fiber);
                }
                catch (error) {
                    (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(fiber, fiber.return, error);
                }
                break;
            }
        }
    }
}
exports.invokePassiveEffectMountInDEV = invokePassiveEffectMountInDEV;
function invokeLayoutEffectUnmountInDEV(fiber) {
    if (__DEV__) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
            case work_tags_1.WorkTag.FunctionComponent:
            case work_tags_1.WorkTag.ForwardRef:
            case work_tags_1.WorkTag.SimpleMemoComponent: {
                try {
                    (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hook_flags_1.HookFlags.Layout | hook_flags_1.HookFlags.HasEffect, fiber, fiber.return);
                }
                catch (error) {
                    (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(fiber, fiber.return, error);
                }
                break;
            }
            case work_tags_1.WorkTag.ClassComponent: {
                var instance = fiber.stateNode;
                if (typeof instance.componentWillUnmount === "function") {
                    safelyCallComponentWillUnmount(fiber, fiber.return, instance);
                }
                break;
            }
        }
    }
}
exports.invokeLayoutEffectUnmountInDEV = invokeLayoutEffectUnmountInDEV;
function invokePassiveEffectUnmountInDEV(fiber) {
    if (__DEV__) {
        // We don't need to re-check StrictEffectsMode here.
        // This function is only called if that check has already passed.
        switch (fiber.tag) {
            case work_tags_1.WorkTag.FunctionComponent:
            case work_tags_1.WorkTag.ForwardRef:
            case work_tags_1.WorkTag.SimpleMemoComponent: {
                try {
                    (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hook_flags_1.HookFlags.Passive | hook_flags_1.HookFlags.HasEffect, fiber, fiber.return);
                }
                catch (error) {
                    (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(fiber, fiber.return, error);
                }
            }
        }
    }
}
exports.invokePassiveEffectUnmountInDEV = invokePassiveEffectUnmountInDEV;
function commitClassCallbacks(finishedWork) {
    // TODO: I think this is now always non-null by the time it reaches the
    // commit phase. Consider removing the type check.
    var updateQueue = finishedWork.updateQueue;
    if (updateQueue !== null) {
        var instance = finishedWork.stateNode;
        if (__DEV__) {
            if (finishedWork.type === finishedWork.elementType && !react_fiber_work_warn_about_reassigning_props_1.didWarnAboutReassigningProps) {
                if (instance.props !== finishedWork.memoizedProps) {
                    console.error("Expected %s props to match memoized props before " + "processing the update queue. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                }
                if (instance.state !== finishedWork.memoizedState) {
                    console.error("Expected %s state to match memoized state before " + "processing the update queue. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                }
            }
        }
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        try {
            (0, react_fiber_class_update_queue_1.commitCallbacks)(updateQueue, instance);
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
        }
    }
}
function commitHostComponentMount(finishedWork) {
    var type = finishedWork.type;
    var props = finishedWork.memoizedProps;
    var instance = finishedWork.stateNode;
    try {
        commitMount(instance, type, props, finishedWork);
    }
    catch (error) {
        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
    }
}
function commitProfilerUpdate(finishedWork, current) {
    if (react_feature_flags_1.enableProfilerTimer && (0, react_fiber_work_excution_context_1.hasExecutionCommitContext)()) {
        try {
            var _a = finishedWork.memoizedProps, onCommit = _a.onCommit, onRender = _a.onRender;
            var effectDuration = finishedWork.stateNode.effectDuration;
            var commitTime = (0, react_profile_timer_1.getCommitTime)();
            var phase = current === null ? "mount" : "update";
            if (react_feature_flags_1.enableProfilerNestedUpdatePhase) {
                if ((0, react_profile_timer_1.isCurrentUpdateNested)()) {
                    phase = "nested-update";
                }
            }
            if (typeof onRender === "function") {
                onRender(finishedWork.memoizedProps.id, phase, finishedWork.actualDuration, finishedWork.treeBaseDuration, finishedWork.actualStartTime, commitTime);
            }
            if (react_feature_flags_1.enableProfilerCommitHooks) {
                if (typeof onCommit === "function") {
                    onCommit(finishedWork.memoizedProps.id, phase, effectDuration, commitTime);
                }
                // Schedule a passive effect for this Profiler to call onPostCommit hooks.
                // This effect should be scheduled even if there is no onPostCommit callback for this Profiler,
                // because the effect is also where times bubble to parent Profilers.
                (0, react_fiber_work_passive_effects_1.enqueuePendingPassiveProfilerEffect)(finishedWork);
                // Propagate layout effect durations to the next nearest Profiler ancestor.
                // Do not reset these values until the next render so DevTools has a chance to read them first.
                var parentFiber = finishedWork.return;
                outer: while (parentFiber !== null) {
                    switch (parentFiber.tag) {
                        case work_tags_1.WorkTag.HostRoot:
                            var root = parentFiber.stateNode;
                            root.effectDuration += effectDuration;
                            break outer;
                        case work_tags_1.WorkTag.Profiler:
                            var parentStateNode = parentFiber.stateNode;
                            parentStateNode.effectDuration += effectDuration;
                            break outer;
                    }
                    parentFiber = parentFiber.return;
                }
            }
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
        }
    }
}
function hideOrUnhideAllChildren(finishedWork, isHidden) {
    // Only hide or unhide the top-most host nodes.
    var hostSubtreeRoot = null;
    if (supportsMutation) {
        // We only have the top Fiber that was inserted but we need to recurse down its
        // children to find all the terminal nodes.
        var node = finishedWork;
        while (true) {
            if (node.tag === work_tags_1.WorkTag.HostComponent || (react_feature_flags_1.enableFloat && supportsResources ? node.tag === work_tags_1.WorkTag.HostHoistable : false)
                || (react_feature_flags_1.enableHostSingletons && supportsSingletons ? node.tag === work_tags_1.WorkTag.HostSingleton : false)) {
                if (hostSubtreeRoot === null) {
                    hostSubtreeRoot = node;
                    try {
                        var instance = node.stateNode;
                        if (isHidden) {
                            hideInstance(instance);
                        }
                        else {
                            unhideInstance(node.stateNode, node.memoizedProps);
                        }
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
            else if (node.tag === work_tags_1.WorkTag.HostText) {
                if (hostSubtreeRoot === null) {
                    try {
                        var instance = node.stateNode;
                        if (isHidden) {
                            hideTextInstance(instance);
                        }
                        else {
                            unhideTextInstance(instance, node.memoizedProps);
                        }
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
            else if ((node.tag === work_tags_1.WorkTag.OffscreenComponent || node.tag === work_tags_1.WorkTag.LegacyHiddenComponent) &&
                node.memoizedState !== null && node !== finishedWork) { // Found a nested Offscreen component that is hidden.
                // Don't search any deeper. This tree should remain hidden.
            }
            else if (node.child !== null) {
                node.child.return = node;
                node = node.child;
                continue;
            }
            if (node === finishedWork) {
                return;
            }
            while (node.sibling === null) {
                if (node.return === null || node.return === finishedWork) {
                    return;
                }
                if (hostSubtreeRoot === node) {
                    hostSubtreeRoot = null;
                }
                node = node.return;
            }
            if (hostSubtreeRoot === node) {
                hostSubtreeRoot = null;
            }
            node.sibling.return = node.return;
            node = node.sibling;
        }
    }
}
function detachFiberMutation(fiber) {
    // Cut off the return pointer to disconnect it from the tree.
    // This enables us to detect and warn against state updates on an unmounted component.
    // It also prevents events from bubbling from within disconnected components.
    //
    // Ideally, we should also clear the child pointer of the parent alternate to let this
    // get GC:ed but we don't know which for sure which parent is the current
    // one so we'll settle for GC:ing the subtree of this child.
    // This child itself will be GC:ed when the parent updates the next time.
    //
    // Note that we can't clear child or sibling pointers yet.
    // They're needed for passive effects and for findDOMNode.
    // We defer those fields, and all other cleanup, to the passive phase (see detachFiberAfterEffects).
    //
    // Don't reset the alternate yet, either. We need that so we can detach the
    // alternate's fields in the passive phase. Clearing the return pointer is
    // sufficient for findDOMNode semantics.
    var alternate = fiber.alternate;
    if (alternate !== null) {
        alternate.return = null;
    }
    fiber.return = null;
}
function emptyPortalContainer(current) {
    if (!supportsPersistence) {
        return;
    }
    var portal = current.stateNode;
    var containerInfo = portal.containerInfo;
    var emptyChildSet = createContainerChildSet();
    replaceContainerChildren(containerInfo, emptyChildSet);
}
function commitSuspenseCallback(finishedWork) {
    // TODO: Move this to passive phase
    var newState = finishedWork.memoizedState;
    if (react_feature_flags_1.enableSuspenseCallback && newState !== null) {
        var suspenseCallback = finishedWork.memoizedProps.suspenseCallback;
        if (typeof suspenseCallback === "function") {
            var retryQueue = finishedWork.updateQueue;
            if (retryQueue !== null) {
                suspenseCallback(new Set(retryQueue));
            }
        }
        else if (__DEV__) {
            if (suspenseCallback !== undefined) {
                console.error("Unexpected type for suspenseCallback.");
            }
        }
    }
}
function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
    if (!supportsHydration) {
        return;
    }
    var newState = finishedWork.memoizedState;
    if (newState === null) {
        var current = finishedWork.alternate;
        if (current !== null) {
            var prevState = current.memoizedState;
            if (prevState !== null) {
                var suspenseInstance = prevState.dehydrated;
                if (suspenseInstance !== null) {
                    try {
                        commitHydratedSuspenseInstance(suspenseInstance);
                        if (react_feature_flags_1.enableSuspenseCallback) {
                            var hydrationCallbacks = finishedRoot.hydrationCallbacks;
                            if (hydrationCallbacks !== null) {
                                var onHydrated = hydrationCallbacks.onHydrated;
                                if (onHydrated) {
                                    onHydrated(suspenseInstance);
                                }
                            }
                        }
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
        }
    }
}
function attachSuspenseRetryListeners(finishedWork, wakeables) {
    // If this boundary just timed out, then it will have a set of wakeables.
    // For each wakeable, attach a listener so that when it resolves, React
    // attempts to re-render the boundary in the primary (pre-timeout) state.
    var retryCache = getRetryCache(finishedWork);
    wakeables.forEach(function (wakeable) {
        // Memoize using the boundary fiber to prevent redundant listeners.
        var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
        if (!retryCache.has(wakeable)) {
            retryCache.add(wakeable);
            if (react_feature_flags_1.enableUpdaterTracking) {
                if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
                    if (inProgressLanes !== null && inProgressRoot !== null) {
                        // If we have pending work still, associate the original updaters with it.
                        (0, react_fiber_commit_work_1.restorePendingUpdaters)(inProgressRoot, inProgressLanes);
                    }
                    else {
                        throw Error("Expected finished root and lanes to be set. This is a bug in React.");
                    }
                }
            }
            wakeable.then(retry, retry);
        }
    });
}
function callComponentWillUnmountWithTimer(current, instance) {
    instance.props = current.memoizedProps;
    instance.state = current.memoizedState;
    if ((0, react_fiber_commit_work_1.shouldProfile)(current)) {
        try {
            (0, react_profile_timer_1.startLayoutEffectTimer)();
            instance.componentWillUnmount();
        }
        finally {
            (0, react_profile_timer_1.recordLayoutEffectDuration)(current);
        }
    }
    else {
        instance.componentWillUnmount();
    }
}
// Capture errors so they don't interrupt unmounting.
function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
    try {
        callComponentWillUnmountWithTimer(current, instance);
    }
    catch (error) {
        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(current, nearestMountedAncestor, error);
    }
}
// Capture errors so they don't interrupt mounting.
function safelyAttachRef(current, nearestMountedAncestor) {
    try {
        (0, react_fiber_commit_work_1.commitAttachRef)(current);
    }
    catch (error) {
        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(current, nearestMountedAncestor, error);
    }
}
function safelyDetachRef(current, nearestMountedAncestor) {
    var ref = current.ref;
    var refCleanup = current.refCleanup;
    if (ref !== null) {
        if (typeof refCleanup === "function") {
            try {
                if ((0, react_fiber_commit_work_1.shouldProfile)(current)) {
                    try {
                        (0, react_profile_timer_1.startLayoutEffectTimer)();
                        refCleanup();
                    }
                    finally {
                        (0, react_profile_timer_1.recordLayoutEffectDuration)(current);
                    }
                }
                else {
                    refCleanup();
                }
            }
            catch (error) {
                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(current, nearestMountedAncestor, error);
            }
            finally {
                // `refCleanup` has been called. Nullify all references to it to prevent double invocation.
                current.refCleanup = null;
                var finishedWork = current.alternate;
                if (finishedWork != null) {
                    finishedWork.refCleanup = null;
                }
            }
        }
        else if (typeof ref === "function") {
            var retVal = void 0;
            try {
                if ((0, react_fiber_commit_work_1.shouldProfile)(current)) {
                    try {
                        (0, react_profile_timer_1.startLayoutEffectTimer)();
                        retVal = ref(null);
                    }
                    finally {
                        (0, react_profile_timer_1.recordLayoutEffectDuration)(current);
                    }
                }
                else {
                    retVal = ref(null);
                }
            }
            catch (error) {
                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(current, nearestMountedAncestor, error);
            }
            if (__DEV__) {
                if (typeof retVal === "function") {
                    console.error("Unexpected return value from a callback ref in %s. " + "A callback ref should not return a function.", (0, react_get_component_name_from_fiber_1.default)(current));
                }
            }
        }
        else {
            // $FlowFixMe[incompatible-use] unable to narrow type to RefObject
            ref.current = null;
        }
    }
}
function commitClassLayoutLifecycles(finishedWork, current) {
    var instance = finishedWork.stateNode;
    if (current === null) {
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        if (__DEV__) {
            if (finishedWork.type === finishedWork.elementType && !react_fiber_work_warn_about_reassigning_props_1.didWarnAboutReassigningProps) {
                if (instance.props !== finishedWork.memoizedProps) {
                    console.error("Expected %s props to match memoized props before " + "componentDidMount. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                }
                if (instance.state !== finishedWork.memoizedState) {
                    console.error("Expected %s state to match memoized state before " + "componentDidMount. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                }
            }
        }
        if ((0, react_fiber_commit_work_1.shouldProfile)(finishedWork)) {
            try {
                (0, react_profile_timer_1.startLayoutEffectTimer)();
                instance.componentDidMount();
            }
            catch (error) {
                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
            }
            (0, react_profile_timer_1.recordLayoutEffectDuration)(finishedWork);
        }
        else {
            try {
                instance.componentDidMount();
            }
            catch (error) {
                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
            }
        }
    }
    else {
        var prevProps = finishedWork.elementType === finishedWork.type ? current.memoizedProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(finishedWork.type, current.memoizedProps);
        var prevState = current.memoizedState;
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        if (__DEV__) {
            if (finishedWork.type === finishedWork.elementType && !react_fiber_work_warn_about_reassigning_props_1.didWarnAboutReassigningProps) {
                if (instance.props !== finishedWork.memoizedProps) {
                    console.error("Expected %s props to match memoized props before " + "componentDidUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                }
                if (instance.state !== finishedWork.memoizedState) {
                    console.error("Expected %s state to match memoized state before " + "componentDidUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                }
            }
        }
        if ((0, react_fiber_commit_work_1.shouldProfile)(finishedWork)) {
            try {
                (0, react_profile_timer_1.startLayoutEffectTimer)();
                instance.componentDidUpdate(prevProps, prevState, instance.__reactInternalSnapshotBeforeUpdate);
            }
            catch (error) {
                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
            }
            (0, react_profile_timer_1.recordLayoutEffectDuration)(finishedWork);
        }
        else {
            try {
                instance.componentDidUpdate(prevProps, prevState, instance.__reactInternalSnapshotBeforeUpdate);
            }
            catch (error) {
                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
            }
        }
    }
}
function getRetryCache(finishedWork) {
    // TODO: Unify the interface for the retry cache so we don't have to switch
    // on the tag like this.
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.SuspenseComponent:
        case work_tags_1.WorkTag.SuspenseListComponent: {
            var retryCache = finishedWork.stateNode;
            if (retryCache === null) {
                retryCache = finishedWork.stateNode = new PossiblyWeakSet();
            }
            return retryCache;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            var instance = finishedWork.stateNode;
            var retryCache = instance._retryCache;
            if (retryCache === null) {
                retryCache = instance._retryCache = new PossiblyWeakSet();
            }
            return retryCache;
        }
        default: {
            throw new Error("Unexpected Suspense handler tag (".concat(finishedWork.tag, "). This is a ") + "bug in React.");
        }
    }
}
function resolveRetryWakeable(boundaryFiber, wakeable) {
    var retryLane = fiber_lane_constants_1.NoLane; // Default
    var retryCache;
    switch (boundaryFiber.tag) {
        case work_tags_1.WorkTag.SuspenseComponent:
            retryCache = boundaryFiber.stateNode;
            var suspenseState = boundaryFiber.memoizedState;
            if (suspenseState !== null) {
                retryLane = suspenseState.retryLane;
            }
            break;
        case work_tags_1.WorkTag.SuspenseListComponent:
            retryCache = boundaryFiber.stateNode;
            break;
        case work_tags_1.WorkTag.OffscreenComponent: {
            var instance = boundaryFiber.stateNode;
            retryCache = instance._retryCache;
            break;
        }
        default:
            throw new Error("Pinged unknown suspense boundary type. " + "This is probably a bug in React.");
    }
    if (retryCache !== null) {
        // The wakeable resolved, so we no longer need to memoize, because it will
        // never be thrown again.
        retryCache.delete(wakeable);
    }
    (0, react_fiber_work_retry_boundary_1.retryTimedOutBoundary)(boundaryFiber, retryLane);
}
function commitMutationEffects(root, finishedWork, committedLanes) {
    inProgressLanes = committedLanes;
    inProgressRoot = root;
    (0, react_current_fiber_1.setCurrentFiber)(finishedWork);
    commitMutationEffectsOnFiber(finishedWork, root, committedLanes);
    (0, react_current_fiber_1.setCurrentFiber)(finishedWork);
    inProgressLanes = null;
    inProgressRoot = null;
}
exports.commitMutationEffects = commitMutationEffects;
function recursivelyTraverseMutationEffects(root, parentFiber, lanes) {
    // Deletions effects can be scheduled on any fiber type. They need to happen
    // before the children effects hae fired.
    var deletions = parentFiber.deletions;
    if (deletions !== null) {
        for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i];
            try {
                commitDeletionEffects(root, parentFiber, childToDelete);
            }
            catch (error) {
                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(childToDelete, parentFiber, error);
            }
        }
    }
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    if (parentFiber.subtreeFlags & fiber_flags_1.FiberFlags.MutationMask) {
        var child = parentFiber.child;
        while (child !== null) {
            (0, react_current_fiber_1.setCurrentFiber)(child);
            commitMutationEffectsOnFiber(child, root, lanes);
            child = child.sibling;
        }
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function commitDeletionEffects(root, returnFiber, deletedFiber) {
    if (supportsMutation) {
        // We only have the top Fiber that was deleted but we need to recurse down its
        // children to find all the terminal nodes.
        // Recursively delete all host nodes from the parent, detach refs, clean
        // up mounted layout effects, and call componentWillUnmount.
        // We only need to remove the topmost host child in each branch. But then we
        // still need to keep traversing to unmount effects, refs, and cWU. TODO: We
        // could split this into two separate traversals functions, where the second
        // one doesn't include any removeChild logic. This is maybe the same
        // function as "disappearLayoutEffects" (or whatever that turns into after
        // the layout phase is refactored to use recursion).
        // Before starting, find the nearest host parent on the stack so we know
        // which instance/container to remove the children from.
        // TODO: Instead of searching up the fiber return path on every deletion, we
        // can track the nearest host component on the JS stack as we traverse the
        // tree during the commit phase. This would make insertions faster, too.
        var parent_1 = returnFiber;
        findParent: while (parent_1 !== null) {
            switch (parent_1.tag) {
                case work_tags_1.WorkTag.HostSingleton:
                case work_tags_1.WorkTag.HostComponent: {
                    hostParent = parent_1.stateNode;
                    hostParentIsContainer = false;
                    break findParent;
                }
                case work_tags_1.WorkTag.HostRoot: {
                    hostParent = parent_1.stateNode.containerInfo;
                    hostParentIsContainer = true;
                    break findParent;
                }
                case work_tags_1.WorkTag.HostPortal: {
                    hostParent = parent_1.stateNode.containerInfo;
                    hostParentIsContainer = true;
                    break findParent;
                }
            }
            parent_1 = parent_1.return;
        }
        if (hostParent === null) {
            throw new Error("Expected to find a host parent. This error is likely caused by " + "a bug in React. Please file an issue.");
        }
        commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
        hostParent = null;
        hostParentIsContainer = false;
    }
    else {
        // Detach refs and call componentWillUnmount() on the whole subtree.
        commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
    }
    detachFiberMutation(deletedFiber);
}
function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
    // TODO: Use a static flag to skip trees that don't have unmount effects
    var child = parent.child;
    while (child !== null) {
        commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
        child = child.sibling;
    }
}
function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
    (0, react_fiber_dev_tools_hook_1.onCommitUnmount)(deletedFiber);
    // The cases in this outer switch modify the stack before they traverse
    // into their subtree. There are simpler cases in the inner switch
    // that don't modify the stack.
    switch (deletedFiber.tag) {
        case work_tags_1.WorkTag.HostHoistable: {
            if (react_feature_flags_1.enableFloat && supportsResources) {
                if (!offscreenSubtreeWasHidden) {
                    safelyDetachRef(deletedFiber, nearestMountedAncestor);
                }
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
                if (deletedFiber.memoizedState) {
                    releaseResource(deletedFiber.memoizedState);
                }
                else if (deletedFiber.stateNode) {
                    unmountHoistable(deletedFiber.stateNode);
                }
                return;
            } // Fall through
        }
        case work_tags_1.WorkTag.HostSingleton: {
            if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
                if (!offscreenSubtreeWasHidden) {
                    safelyDetachRef(deletedFiber, nearestMountedAncestor);
                }
                var prevHostParent = hostParent;
                var prevHostParentIsContainer = hostParentIsContainer;
                hostParent = deletedFiber.stateNode;
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
                // Normally this is called in passive unmount effect phase however with
                // HostSingleton we warn if you acquire one that is already associated to
                // a different fiber. To increase our chances of avoiding this, specifically
                // if you keyed a HostSingleton so there will be a delete followed by a Placement
                // we treat detach eagerly here
                releaseSingletonInstance(deletedFiber.stateNode);
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;
                return;
            } // Fall through
        }
        case work_tags_1.WorkTag.HostComponent: {
            if (!offscreenSubtreeWasHidden) {
                safelyDetachRef(deletedFiber, nearestMountedAncestor);
            } // Intentional fallthrough to next branch
        }
        case work_tags_1.WorkTag.HostText: {
            // We only need to remove the nearest host child. Set the host parent
            // to `null` on the stack to indicate that nested children don't
            // need to be removed.
            if (supportsMutation) {
                var prevHostParent = hostParent;
                var prevHostParentIsContainer = hostParentIsContainer;
                hostParent = null;
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;
                if (hostParent !== null) {
                    // Now that all the child effects have unmounted, we can remove the
                    // node from the tree.
                    if (hostParentIsContainer) {
                        removeChildFromContainer(hostParent, deletedFiber.stateNode);
                    }
                    else {
                        removeChild(hostParent, deletedFiber.stateNode);
                    }
                }
            }
            else {
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            }
            return;
        }
        case work_tags_1.WorkTag.DehydratedFragment: {
            if (react_feature_flags_1.enableSuspenseCallback) {
                var hydrationCallbacks = finishedRoot.hydrationCallbacks;
                if (hydrationCallbacks !== null) {
                    var onDeleted = hydrationCallbacks.onDeleted;
                    if (onDeleted) {
                        onDeleted(deletedFiber.stateNode);
                    }
                }
            }
            // Dehydrated fragments don't have any children
            // Delete the dehydrated suspense boundary and all of its content.
            if (supportsMutation) {
                if (hostParent !== null) {
                    if (hostParentIsContainer) {
                        clearSuspenseBoundaryFromContainer(hostParent, deletedFiber.stateNode);
                    }
                    else {
                        clearSuspenseBoundary(hostParent, deletedFiber.stateNode);
                    }
                }
            }
            return;
        }
        case work_tags_1.WorkTag.HostPortal: {
            if (supportsMutation) {
                // When we go into a portal, it becomes the parent to remove from.
                var prevHostParent = hostParent;
                var prevHostParentIsContainer = hostParentIsContainer;
                hostParent = deletedFiber.stateNode.containerInfo;
                hostParentIsContainer = true;
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;
            }
            else {
                emptyPortalContainer(deletedFiber);
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            }
            return;
        }
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.MemoComponent:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            if (!offscreenSubtreeWasHidden) {
                var updateQueue = deletedFiber.updateQueue;
                if (updateQueue !== null) {
                    var lastEffect = updateQueue.lastEffect;
                    if (lastEffect !== null) {
                        var firstEffect = lastEffect.next;
                        var effect = firstEffect;
                        do {
                            var tag = effect.tag;
                            var inst = effect.inst;
                            var destroy = inst.destroy;
                            if (destroy !== undefined) {
                                if ((tag & hook_flags_1.HookFlags.Insertion) !== hook_flags_1.HookFlags.NoHookEffect) {
                                    inst.destroy = undefined;
                                    (0, react_fiber_commit_phase_error_1.safelyCallDestroy)(deletedFiber, nearestMountedAncestor, destroy);
                                }
                                else if ((tag & hook_flags_1.HookFlags.Layout) !== hook_flags_1.HookFlags.NoHookEffect) {
                                    if (react_feature_flags_1.enableSchedulingProfiler) {
                                        (0, react_fiber_dev_tools_hook_1.markComponentLayoutEffectUnmountStarted)(deletedFiber);
                                    }
                                    if ((0, react_fiber_commit_work_1.shouldProfile)(deletedFiber)) {
                                        (0, react_profile_timer_1.startLayoutEffectTimer)();
                                        inst.destroy = undefined;
                                        (0, react_fiber_commit_phase_error_1.safelyCallDestroy)(deletedFiber, nearestMountedAncestor, destroy);
                                        (0, react_profile_timer_1.recordLayoutEffectDuration)(deletedFiber);
                                    }
                                    else {
                                        inst.destroy = undefined;
                                        (0, react_fiber_commit_phase_error_1.safelyCallDestroy)(deletedFiber, nearestMountedAncestor, destroy);
                                    }
                                    if (react_feature_flags_1.enableSchedulingProfiler) {
                                        (0, react_fiber_dev_tools_hook_1.markComponentLayoutEffectUnmountStopped)();
                                    }
                                }
                            }
                            effect = effect.next;
                        } while (effect !== firstEffect);
                    }
                }
            }
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
        }
        case work_tags_1.WorkTag.ClassComponent: {
            if (!offscreenSubtreeWasHidden) {
                safelyDetachRef(deletedFiber, nearestMountedAncestor);
                var instance = deletedFiber.stateNode;
                if (typeof instance.componentWillUnmount === "function") {
                    safelyCallComponentWillUnmount(deletedFiber, nearestMountedAncestor, instance);
                }
            }
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
        }
        case work_tags_1.WorkTag.ScopeComponent: {
            if (react_feature_flags_1.enableScopeAPI) {
                safelyDetachRef(deletedFiber, nearestMountedAncestor);
            }
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            safelyDetachRef(deletedFiber, nearestMountedAncestor);
            if (deletedFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
                // If this offscreen component is hidden, we already unmounted it. Before
                // deleting the children, track that it's already unmounted so that we
                // don't attempt to unmount the effects again.
                // TODO: If the tree is hidden, in most cases we should be able to skip
                // over the nested children entirely. An exception is we haven't yet found
                // the topmost host node to delete, which we already track on the stack.
                // But the other case is portals, which need to be detached no matter how
                // deeply they are nested. We should use a subtree flag to track whether a
                // subtree includes a nested portal.
                var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || deletedFiber.memoizedState !== null;
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            }
            else {
                recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            }
            break;
        }
        default: {
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
        }
    }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
    // At this point layout effects have already been destroyed (during mutation phase).
    // This is done to prevent sibling component effects from interfering with each other,
    // e.g. a destroy function in one component should never override a ref set
    // by a create function in another component during the same commit.
    if ((0, react_fiber_commit_work_1.shouldProfile)(finishedWork)) {
        try {
            (0, react_profile_timer_1.startLayoutEffectTimer)();
            (0, react_fiber_commit_hook_effect_1.commitHookEffectListMount)(hookFlags, finishedWork);
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
        }
        (0, react_profile_timer_1.recordLayoutEffectDuration)(finishedWork);
    }
    else {
        try {
            (0, react_fiber_commit_hook_effect_1.commitHookEffectListMount)(hookFlags, finishedWork);
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
        }
    }
}
function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
    var current = finishedWork.alternate;
    var flags = finishedWork.flags;
    // The effect flag should be checked *after* we refine the type of fiber,
    // because the fiber tag is more specific. An exception is any flag related
    // to reconciliation, because those can be set on all fiber types.
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.MemoComponent:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & fiber_flags_1.FiberFlags.Update) {
                try {
                    (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hook_flags_1.HookFlags.Insertion | hook_flags_1.HookFlags.HasEffect, finishedWork, finishedWork.return);
                    (0, react_fiber_commit_hook_effect_1.commitHookEffectListMount)(hook_flags_1.HookFlags.Insertion | hook_flags_1.HookFlags.HasEffect, finishedWork);
                }
                catch (error) {
                    (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                }
                // Layout effects are destroyed during the mutation phase so that all
                // destroy functions for all fibers are called before any create functions.
                // This prevents sibling component effects from interfering with each other,
                // e.g. a destroy function in one component should never override a ref set
                // by a create function in another component during the same commit.
                if ((0, react_fiber_commit_work_1.shouldProfile)(finishedWork)) {
                    try {
                        (0, react_profile_timer_1.startLayoutEffectTimer)();
                        (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hook_flags_1.HookFlags.Layout | hook_flags_1.HookFlags.HasEffect, finishedWork, finishedWork.return);
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                    (0, react_profile_timer_1.recordLayoutEffectDuration)(finishedWork);
                }
                else {
                    try {
                        (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hook_flags_1.HookFlags.Layout | hook_flags_1.HookFlags.HasEffect, finishedWork, finishedWork.return);
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
            return;
        }
        case work_tags_1.WorkTag.ClassComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & fiber_flags_1.FiberFlags.Ref) {
                if (current !== null) {
                    safelyDetachRef(current, current.return);
                }
            }
            if (flags & fiber_flags_1.FiberFlags.Callback && offscreenSubtreeIsHidden) {
                var updateQueue = finishedWork.updateQueue;
                if (updateQueue !== null) {
                    (0, react_fiber_class_update_queue_1.deferHiddenCallbacks)(updateQueue);
                }
            }
            return;
        }
        case work_tags_1.WorkTag.HostHoistable: {
            if (react_feature_flags_1.enableFloat && supportsResources) {
                // We cast because we always set the root at the React root and so it cannot be
                // null while we are processing mutation effects
                var hoistableRoot = (0, react_fiber_commit_current_hoistable_root_1.getCurrentHoistableRootSafe)();
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
                if (flags & fiber_flags_1.FiberFlags.Ref) {
                    if (current !== null) {
                        safelyDetachRef(current, current.return);
                    }
                }
                if (flags & fiber_flags_1.FiberFlags.Update) {
                    var currentResource = current !== null ? current.memoizedState : null;
                    var newResource = finishedWork.memoizedState;
                    if (current === null) {
                        // We are mounting a new HostHoistable Fiber. We fork the mount
                        // behavior based on whether this instance is a Hoistable Instance
                        // or a Hoistable Resource
                        if (newResource === null) {
                            if (finishedWork.stateNode === null) {
                                finishedWork.stateNode = hydrateHoistable(hoistableRoot, finishedWork.type, finishedWork.memoizedProps, finishedWork);
                            }
                            else {
                                mountHoistable(hoistableRoot, finishedWork.type, finishedWork.stateNode);
                            }
                        }
                        else {
                            finishedWork.stateNode = acquireResource(hoistableRoot, newResource, finishedWork.memoizedProps);
                        }
                    }
                    else if (currentResource !== newResource) {
                        // We are moving to or from Hoistable Resource, or between different Hoistable Resources
                        if (currentResource === null) {
                            if (current.stateNode !== null) {
                                unmountHoistable(current.stateNode);
                            }
                        }
                        else {
                            releaseResource(currentResource);
                        }
                        if (newResource === null) {
                            mountHoistable(hoistableRoot, finishedWork.type, finishedWork.stateNode);
                        }
                        else {
                            acquireResource(hoistableRoot, newResource, finishedWork.memoizedProps);
                        }
                    }
                    else if (newResource === null && finishedWork.stateNode !== null) {
                        // We may have an update on a Hoistable element
                        var updatePayload = finishedWork.updateQueue;
                        finishedWork.updateQueue = null;
                        try {
                            commitUpdate(finishedWork.stateNode, updatePayload, finishedWork.type, current.memoizedProps, finishedWork.memoizedProps, finishedWork);
                        }
                        catch (error) {
                            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                        }
                    }
                }
                return;
            } // Fall through
        }
        case work_tags_1.WorkTag.HostSingleton: {
            if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
                if (flags & fiber_flags_1.FiberFlags.Update) {
                    var previousWork = finishedWork.alternate;
                    if (previousWork === null) {
                        var singleton = finishedWork.stateNode;
                        var props = finishedWork.memoizedProps;
                        // This was a new mount, we need to clear and set initial properties
                        clearSingleton(singleton);
                        acquireSingletonInstance(finishedWork.type, props, singleton, finishedWork);
                    }
                }
            } // Fall through
        }
        case work_tags_1.WorkTag.HostComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & fiber_flags_1.FiberFlags.Ref) {
                if (current !== null) {
                    safelyDetachRef(current, current.return);
                }
            }
            if (supportsMutation) {
                // TODO: ContentReset gets cleared by the children during the commit
                // phase. This is a refactor hazard because it means we must read
                // flags the flags after `commitReconciliationEffects` has already run;
                // the order matters. We should refactor so that ContentReset does not
                // rely on mutating the flag during commit. Like by setting a flag
                // during the render phase instead.
                if (finishedWork.flags & fiber_flags_1.FiberFlags.ContentReset) {
                    var instance = finishedWork.stateNode;
                    try {
                        resetTextContent(instance);
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
                if (flags & fiber_flags_1.FiberFlags.Update) {
                    var instance = finishedWork.stateNode;
                    if (instance != null) {
                        // Commit the work prepared earlier.
                        var newProps = finishedWork.memoizedProps;
                        // For hydration we reuse the update path but we treat the oldProps
                        // as the newProps. The updatePayload will contain the real change in
                        // this case.
                        var oldProps = current !== null ? current.memoizedProps : newProps;
                        var type = finishedWork.type;
                        // TODO: Type the updateQueue to be specific to host components.
                        var updatePayload = finishedWork.updateQueue;
                        finishedWork.updateQueue = null;
                        try {
                            commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
                        }
                        catch (error) {
                            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                        }
                    }
                }
            }
            return;
        }
        case work_tags_1.WorkTag.HostText: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & fiber_flags_1.FiberFlags.Update) {
                if (supportsMutation) {
                    if (finishedWork.stateNode === null) {
                        throw new Error("This should have a text node initialized. This error is likely " + "caused by a bug in React. Please file an issue.");
                    }
                    var textInstance = finishedWork.stateNode;
                    var newText = finishedWork.memoizedProps;
                    // For hydration we reuse the update path but we treat the oldProps
                    // as the newProps. The updatePayload will contain the real change in
                    // this case.
                    var oldText = current !== null ? current.memoizedProps : newText;
                    try {
                        commitTextUpdate(textInstance, oldText, newText);
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
            return;
        }
        case work_tags_1.WorkTag.HostRoot: {
            if (react_feature_flags_1.enableFloat && supportsResources) {
                prepareToCommitHoistables();
                var previousHoistableRoot = (0, react_fiber_commit_current_hoistable_root_1.getCurrentHoistableRoot)();
                (0, react_fiber_commit_current_hoistable_root_1.setCurrentHoistableRoot)(getHoistableRoot(root.containerInfo));
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                (0, react_fiber_commit_current_hoistable_root_1.setCurrentHoistableRoot)(previousHoistableRoot);
                commitReconciliationEffects(finishedWork);
            }
            else {
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
            }
            if (flags & fiber_flags_1.FiberFlags.Update) {
                if (supportsMutation && supportsHydration) {
                    if (current !== null) {
                        var prevRootState = current.memoizedState;
                        if (prevRootState.isDehydrated) {
                            try {
                                commitHydratedContainer(root.containerInfo);
                            }
                            catch (error) {
                                (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                            }
                        }
                    }
                }
                if (supportsPersistence) {
                    var containerInfo = root.containerInfo;
                    var pendingChildren = root.pendingChildren;
                    try {
                        replaceContainerChildren(containerInfo, pendingChildren);
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
            return;
        }
        case work_tags_1.WorkTag.HostPortal: {
            if (react_feature_flags_1.enableFloat && supportsResources) {
                var previousHoistableRoot = (0, react_fiber_commit_current_hoistable_root_1.getCurrentHoistableRoot)();
                (0, react_fiber_commit_current_hoistable_root_1.setCurrentHoistableRoot)(getHoistableRoot(finishedWork.stateNode.containerInfo));
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
                (0, react_fiber_commit_current_hoistable_root_1.setCurrentHoistableRoot)(previousHoistableRoot);
            }
            else {
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
            }
            if (flags & fiber_flags_1.FiberFlags.Update) {
                if (supportsPersistence) {
                    var portal = finishedWork.stateNode;
                    var containerInfo = portal.containerInfo;
                    var pendingChildren = portal.pendingChildren;
                    try {
                        replaceContainerChildren(containerInfo, pendingChildren);
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
            return;
        }
        case work_tags_1.WorkTag.SuspenseComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            // TODO: We should mark a flag on the Suspense fiber itself, rather than
            // relying on the Offscreen fiber having a flag also being marked. The
            // reason is that this offscreen fiber might not be part of the work-in-
            // progress tree! It could have been reused from a previous render. This
            // doesn't lead to incorrect behavior because we don't rely on the flag
            // check alone; we also compare the states explicitly below. But for
            // modeling purposes, we _should_ be able to rely on the flag check alone.
            // So this is a bit fragile.
            //
            // Also, all this logic could/should move to the passive phase so it
            // doesn't block paint.
            var offscreenFiber = finishedWork.child;
            if (offscreenFiber.flags & fiber_flags_1.FiberFlags.Visibility) {
                // Throttle the appearance and disappearance of Suspense fallbacks.
                var isShowingFallback = finishedWork.memoizedState !== null;
                var wasShowingFallback = current !== null && current.memoizedState !== null;
                if (react_feature_flags_1.alwaysThrottleRetries) {
                    if (isShowingFallback !== wasShowingFallback) {
                        // A fallback is either appearing or disappearing.
                        markCommitTimeOfFallback();
                    }
                }
                else {
                    if (isShowingFallback && !wasShowingFallback) {
                        // Old behavior. Only mark when a fallback appears, not when
                        // it disappears.
                        markCommitTimeOfFallback();
                    }
                }
            }
            if (flags & fiber_flags_1.FiberFlags.Update) {
                try {
                    commitSuspenseCallback(finishedWork);
                }
                catch (error) {
                    (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                }
                var retryQueue = finishedWork.updateQueue;
                if (retryQueue !== null) {
                    finishedWork.updateQueue = null;
                    attachSuspenseRetryListeners(finishedWork, retryQueue);
                }
            }
            return;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            if (flags & fiber_flags_1.FiberFlags.Ref) {
                if (current !== null) {
                    safelyDetachRef(current, current.return);
                }
            }
            var newState = finishedWork.memoizedState;
            var isHidden = newState !== null;
            var wasHidden = current !== null && current.memoizedState !== null;
            if (finishedWork.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) {
                // Before committing the children, track on the stack whether this
                // offscreen subtree was already hidden, so that we don't unmount the
                // effects again.
                var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
                var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || isHidden;
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wasHidden;
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
                offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
            }
            else {
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            }
            commitReconciliationEffects(finishedWork);
            var offscreenInstance = finishedWork.stateNode;
            // TODO: Add explicit effect flag to set _current.
            offscreenInstance._current = finishedWork;
            // Offscreen stores pending changes to visibility in `_pendingVisibility`. This is
            // to support batching of `attach` and `detach` calls.
            offscreenInstance._visibility &= ~offscreen_1.OffscreenDetached;
            offscreenInstance._visibility |= offscreenInstance._pendingVisibility & offscreen_1.OffscreenDetached;
            if (flags & fiber_flags_1.FiberFlags.Visibility) {
                // Track the current state on the Offscreen instance so we can
                // read it during an event
                if (isHidden) {
                    offscreenInstance._visibility &= ~offscreen_1.OffscreenVisible;
                }
                else {
                    offscreenInstance._visibility |= offscreen_1.OffscreenVisible;
                }
                if (isHidden) {
                    var isUpdate = current !== null;
                    var wasHiddenByAncestorOffscreen = offscreenSubtreeIsHidden || offscreenSubtreeWasHidden;
                    // Only trigger disapper layout effects if:
                    //   - This is an update, not first mount.
                    //   - This Offscreen was not hidden before.
                    //   - Ancestor Offscreen was not hidden in previous commit.
                    if (isUpdate && !wasHidden && !wasHiddenByAncestorOffscreen) {
                        if ((finishedWork.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode) {
                            // Disappear the layout effects of all the children
                            recursivelyTraverseDisappearLayoutEffects(finishedWork);
                        }
                    }
                }
                else {
                    if (wasHidden) { // TODO: Move re-appear call here for symmetry?
                    }
                }
                // Offscreen with manual mode manages visibility manually.
                if (supportsMutation && !(0, react_fiber_activity_component_1.isOffscreenManual)(finishedWork)) {
                    // TODO: This needs to run whenever there's an insertion or update
                    // inside a hidden Offscreen tree.
                    hideOrUnhideAllChildren(finishedWork, isHidden);
                }
            }
            // TODO: Move to passive phase
            if (flags & fiber_flags_1.FiberFlags.Update) {
                var offscreenQueue = finishedWork.updateQueue;
                if (offscreenQueue !== null) {
                    var retryQueue = offscreenQueue.retryQueue;
                    if (retryQueue !== null) {
                        offscreenQueue.retryQueue = null;
                        attachSuspenseRetryListeners(finishedWork, retryQueue);
                    }
                }
            }
            return;
        }
        case work_tags_1.WorkTag.SuspenseListComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            if (flags & fiber_flags_1.FiberFlags.Update) {
                var retryQueue = finishedWork.updateQueue;
                if (retryQueue !== null) {
                    finishedWork.updateQueue = null;
                    attachSuspenseRetryListeners(finishedWork, retryQueue);
                }
            }
            return;
        }
        case work_tags_1.WorkTag.ScopeComponent: {
            if (react_feature_flags_1.enableScopeAPI) {
                recursivelyTraverseMutationEffects(root, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
                // TODO: This is a temporary solution that allowed us to transition away
                // from React Flare on www.
                if (flags & fiber_flags_1.FiberFlags.Ref) {
                    if (current !== null) {
                        safelyDetachRef(finishedWork, finishedWork.return);
                    }
                    safelyAttachRef(finishedWork, finishedWork.return);
                }
                if (flags & fiber_flags_1.FiberFlags.Update) {
                    var scopeInstance = finishedWork.stateNode;
                    prepareScopeUpdate(scopeInstance, finishedWork);
                }
            }
            return;
        }
        default: {
            recursivelyTraverseMutationEffects(root, finishedWork, lanes);
            commitReconciliationEffects(finishedWork);
            return;
        }
    }
}
function commitBeforeMutationEffects(root, firstChild) {
    focusedInstanceHandle = prepareForCommit(root.containerInfo);
    (0, react_fiber_commit_next_effect_1.setNextEffect)(firstChild);
    commitBeforeMutationEffects_begin();
    // We no longer need to track the active instance fiber
    var shouldFire = shouldFireAfterActiveInstanceBlur;
    shouldFireAfterActiveInstanceBlur = false;
    focusedInstanceHandle = null;
    return shouldFire;
}
exports.commitBeforeMutationEffects = commitBeforeMutationEffects;
function commitBeforeMutationEffects_begin() {
    while ((0, react_fiber_commit_next_effect_1.hasNextEffect)()) {
        var fiber = (0, react_fiber_commit_next_effect_1.getNextEffectSafe)();
        // This phase is only used for beforeActiveInstanceBlur.
        // Let's skip the whole loop if it's off.
        if (react_feature_flags_1.enableCreateEventHandleAPI) {
            // TODO: Should wrap this in flags check, too, as optimization
            var deletions = fiber.deletions;
            if (deletions !== null) {
                for (var i = 0; i < deletions.length; i++) {
                    var deletion = deletions[i];
                    commitBeforeMutationEffectsDeletion(deletion);
                }
            }
        }
        var child = fiber.child;
        if ((fiber.subtreeFlags & fiber_flags_1.FiberFlags.BeforeMutationMask) !== fiber_flags_1.FiberFlags.NoFlags && child !== null) {
            child.return = fiber;
            (0, react_fiber_commit_next_effect_1.setNextEffect)(child);
        }
        else {
            commitBeforeMutationEffects_complete();
        }
    }
}
function commitBeforeMutationEffects_complete() {
    while ((0, react_fiber_commit_next_effect_1.hasNextEffect)()) {
        var fiber = (0, react_fiber_commit_next_effect_1.getNextEffectSafe)();
        (0, react_current_fiber_1.setCurrentFiber)(fiber);
        try {
            commitBeforeMutationEffectsOnFiber(fiber);
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(fiber, fiber.return, error);
        }
        (0, react_current_fiber_1.resetCurrentFiber)();
        var sibling = fiber.sibling;
        if (sibling !== null) {
            sibling.return = fiber.return;
            (0, react_fiber_commit_next_effect_1.setNextEffect)(sibling);
            return;
        }
        (0, react_fiber_commit_next_effect_1.setNextEffect)(fiber.return);
    }
}
function commitBeforeMutationEffectsOnFiber(finishedWork) {
    var current = finishedWork.alternate;
    var flags = finishedWork.flags;
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
            // Check to see if the focused element was inside of a hidden (Suspense) subtree.
            // TODO: Move this out of the hot path using a dedicated effect tag.
            if (finishedWork.tag === work_tags_1.WorkTag.SuspenseComponent && (0, react_fiber_commit_work_1.isSuspenseBoundaryBeingHidden)(current, finishedWork) && // $FlowFixMe[incompatible-call] found when upgrading Flow
                (0, react_fiber_tree_reflection_1.doesFiberContain)(finishedWork, focusedInstanceHandle)) {
                shouldFireAfterActiveInstanceBlur = true;
                beforeActiveInstanceBlur(finishedWork);
            }
        }
    }
    if ((flags & fiber_flags_1.FiberFlags.Snapshot) !== fiber_flags_1.FiberFlags.NoFlags) {
        (0, react_current_fiber_1.setCurrentFiber)(finishedWork);
    }
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent: {
            if (react_feature_flags_1.enableUseEffectEventHook) {
                if ((flags & fiber_flags_1.FiberFlags.Update) !== fiber_flags_1.FiberFlags.NoFlags) {
                    commitUseEffectEventMount(finishedWork);
                }
            }
            break;
        }
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            break;
        }
        case work_tags_1.WorkTag.ClassComponent: {
            if ((flags & fiber_flags_1.FiberFlags.Snapshot) !== fiber_flags_1.FiberFlags.NoFlags) {
                if (current !== null) {
                    var prevProps = current.memoizedProps;
                    var prevState = current.memoizedState;
                    var instance = finishedWork.stateNode;
                    // We could update instance props and state here,
                    // but instead we rely on them being set during last render.
                    // TODO: revisit this when we implement resuming.
                    if (__DEV__) {
                        if (finishedWork.type === finishedWork.elementType && !(0, react_fiber_work_warn_about_reassigning_props_1.didWarnAboutReassigningProps)()) {
                            if (instance.props !== finishedWork.memoizedProps) {
                                console.error("Expected %s props to match memoized props before " + "getSnapshotBeforeUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                            }
                            if (instance.state !== finishedWork.memoizedState) {
                                console.error("Expected %s state to match memoized state before " + "getSnapshotBeforeUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", (0, react_get_component_name_from_fiber_1.default)(finishedWork) || "instance");
                            }
                        }
                    }
                    var snapshot = instance.getSnapshotBeforeUpdate(finishedWork.elementType === finishedWork.type ? prevProps : (0, react_fiber_lazy_component_1.resolveDefaultProps)(finishedWork.type, prevProps), prevState);
                    if (__DEV__) {
                        var didWarnSet = didWarnAboutUndefinedSnapshotBeforeUpdate;
                        if (snapshot === undefined && !didWarnSet.has(finishedWork.type)) {
                            didWarnSet.add(finishedWork.type);
                            console.error("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) " + "must be returned. You have returned undefined.", (0, react_get_component_name_from_fiber_1.default)(finishedWork));
                        }
                    }
                    instance.__reactInternalSnapshotBeforeUpdate = snapshot;
                }
            }
            break;
        }
        case work_tags_1.WorkTag.HostRoot: {
            if ((flags & fiber_flags_1.FiberFlags.Snapshot) !== fiber_flags_1.FiberFlags.NoFlags) {
                if (supportsMutation) {
                    var root = finishedWork.stateNode;
                    clearContainer(root.containerInfo);
                }
            }
            break;
        }
        case work_tags_1.WorkTag.HostComponent:
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostText:
        case work_tags_1.WorkTag.HostPortal:
        case work_tags_1.WorkTag.IncompleteClassComponent:
            // Nothing to do for these component types
            break;
        default: {
            if ((flags & fiber_flags_1.FiberFlags.Snapshot) !== fiber_flags_1.FiberFlags.NoFlags) {
                throw new Error("This unit of work tag should not have side-effects. This error is " + "likely caused by a bug in React. Please file an issue.");
            }
        }
    }
    if ((flags & fiber_flags_1.FiberFlags.Snapshot) !== fiber_flags_1.FiberFlags.NoFlags) {
        (0, react_current_fiber_1.resetCurrentFiber)();
    }
}
function commitBeforeMutationEffectsDeletion(deletion) {
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        // TODO (effects) It would be nice to avoid calling doesFiberContain()
        // Maybe we can repurpose one of the subtreeFlags positions for this instead?
        // Use it to store which part of the tree the focused instance is in?
        // This assumes we can safely determine that instance during the "render" phase.
        if ((0, react_fiber_tree_reflection_1.doesFiberContain)(deletion, focusedInstanceHandle)) {
            shouldFireAfterActiveInstanceBlur = true;
            beforeActiveInstanceBlur(deletion);
        }
    }
}
function commitUseEffectEventMount(finishedWork) {
    var updateQueue = finishedWork.updateQueue;
    var eventPayloads = updateQueue !== null ? updateQueue.events : null;
    if (eventPayloads !== null) {
        for (var ii = 0; ii < eventPayloads.length; ii++) {
            var _a = eventPayloads[ii], ref = _a.ref, nextImpl = _a.nextImpl;
            ref.impl = nextImpl;
        }
    }
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork, committedLanes) {
    // When updating this function, also update reappearLayoutEffects, which does
    // most of the same things when an offscreen tree goes from hidden -> visible.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            if (flags & fiber_flags_1.FiberFlags.Update) {
                commitHookLayoutEffects(finishedWork, hook_flags_1.HookFlags.Layout | hook_flags_1.HookFlags.HasEffect);
            }
            break;
        }
        case work_tags_1.WorkTag.ClassComponent: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            if (flags & fiber_flags_1.FiberFlags.Update) {
                commitClassLayoutLifecycles(finishedWork, current);
            }
            if (flags & fiber_flags_1.FiberFlags.Callback) {
                commitClassCallbacks(finishedWork);
            }
            if (flags & fiber_flags_1.FiberFlags.Ref) {
                safelyAttachRef(finishedWork, finishedWork.return);
            }
            break;
        }
        case work_tags_1.WorkTag.HostRoot: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            if (flags & fiber_flags_1.FiberFlags.Callback) {
                // TODO: I think this is now always non-null by the time it reaches the
                // commit phase. Consider removing the type check.
                var updateQueue = finishedWork.updateQueue;
                if (updateQueue !== null) {
                    var instance = null;
                    if (finishedWork.child !== null) {
                        switch (finishedWork.child.tag) {
                            case work_tags_1.WorkTag.HostSingleton:
                            case work_tags_1.WorkTag.HostComponent:
                                instance = getPublicInstance(finishedWork.child.stateNode);
                                break;
                            case work_tags_1.WorkTag.ClassComponent:
                                instance = finishedWork.child.stateNode;
                                break;
                        }
                    }
                    try {
                        (0, react_fiber_class_update_queue_1.commitCallbacks)(updateQueue, instance);
                    }
                    catch (error) {
                        (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                    }
                }
            }
            break;
        }
        case work_tags_1.WorkTag.HostHoistable: {
            if (react_feature_flags_1.enableFloat && supportsResources) {
                recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
                if (flags & fiber_flags_1.FiberFlags.Ref) {
                    safelyAttachRef(finishedWork, finishedWork.return);
                }
                break;
            } // Fall through
        }
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            // Renderers may schedule work to be done after host components are mounted
            // (eg DOM renderer may schedule auto-focus for inputs and form controls).
            // These effects should only be committed when components are first mounted,
            // aka when there is no current/alternate.
            if (current === null && flags & fiber_flags_1.FiberFlags.Update) {
                commitHostComponentMount(finishedWork);
            }
            if (flags & fiber_flags_1.FiberFlags.Ref) {
                safelyAttachRef(finishedWork, finishedWork.return);
            }
            break;
        }
        case work_tags_1.WorkTag.Profiler: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            // TODO: Should this fire inside an offscreen tree? Or should it wait to
            // fire when the tree becomes visible again.
            if (flags & fiber_flags_1.FiberFlags.Update) {
                commitProfilerUpdate(finishedWork, current);
            }
            break;
        }
        case work_tags_1.WorkTag.SuspenseComponent: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            if (flags & fiber_flags_1.FiberFlags.Update) {
                commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            }
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            var isModernRoot = (finishedWork.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
            if (isModernRoot) {
                var isHidden = finishedWork.memoizedState !== null;
                var newOffscreenSubtreeIsHidden = isHidden || offscreenSubtreeIsHidden;
                if (newOffscreenSubtreeIsHidden) { // The Offscreen tree is hidden. Skip over its layout effects.
                }
                else {
                    // The Offscreen tree is visible.
                    var wasHidden = current !== null && current.memoizedState !== null;
                    var newOffscreenSubtreeWasHidden = wasHidden || offscreenSubtreeWasHidden;
                    var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden;
                    var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
                    offscreenSubtreeIsHidden = newOffscreenSubtreeIsHidden;
                    offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden;
                    if (offscreenSubtreeWasHidden && !prevOffscreenSubtreeWasHidden) {
                        // This is the root of a reappearing boundary. As we continue
                        // traversing the layout effects, we must also re-mount layout
                        // effects that were unmounted when the Offscreen subtree was
                        // hidden. So this is a superset of the normal commitLayoutEffects.
                        var includeWorkInProgressEffects = (finishedWork.subtreeFlags & fiber_flags_1.FiberFlags.LayoutMask) !== fiber_flags_1.FiberFlags.NoFlags;
                        recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
                    }
                    else {
                        recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
                    }
                    offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
                    offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
                }
            }
            else {
                recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            }
            if (flags & fiber_flags_1.FiberFlags.Ref) {
                var props = finishedWork.memoizedProps;
                if (props.mode === "manual") {
                    safelyAttachRef(finishedWork, finishedWork.return);
                }
                else {
                    safelyDetachRef(finishedWork, finishedWork.return);
                }
            }
            break;
        }
        default: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
            break;
        }
    }
}
function commitLayoutEffects(finishedWork, root, committedLanes) {
    inProgressLanes = committedLanes;
    inProgressRoot = root;
    var current = finishedWork.alternate;
    commitLayoutEffectOnFiber(root, current, finishedWork, committedLanes);
    inProgressLanes = null;
    inProgressRoot = null;
}
exports.commitLayoutEffects = commitLayoutEffects;
function recursivelyTraverseLayoutEffects(root, parentFiber, lanes) {
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    if (parentFiber.subtreeFlags & fiber_flags_1.FiberFlags.LayoutMask) {
        var child = parentFiber.child;
        while (child !== null) {
            (0, react_current_fiber_1.setCurrentFiber)(child);
            var current = child.alternate;
            commitLayoutEffectOnFiber(root, current, child, lanes);
            child = child.sibling;
        }
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
    // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
    var child = parentFiber.child;
    while (child !== null) {
        disappearLayoutEffects(child);
        child = child.sibling;
    }
}
exports.recursivelyTraverseDisappearLayoutEffects = recursivelyTraverseDisappearLayoutEffects;
function recursivelyTraverseReappearLayoutEffects(finishedRoot, parentFiber, includeWorkInProgressEffects) {
    // This function visits both newly finished work and nodes that were re-used
    // from a previously committed tree. We cannot check non-static flags if the
    // node was reused.
    var childShouldIncludeWorkInProgressEffects = includeWorkInProgressEffects && (parentFiber.subtreeFlags & fiber_flags_1.FiberFlags.LayoutMask) !== fiber_flags_1.FiberFlags.NoFlags;
    // TODO (Offscreen) Check: flags & (RefStatic | LayoutStatic)
    var prevDebugFiber = (0, react_current_fiber_1.getCurrentFiber)();
    var child = parentFiber.child;
    while (child !== null) {
        var current = child.alternate;
        reappearLayoutEffects(finishedRoot, current, child, childShouldIncludeWorkInProgressEffects);
        child = child.sibling;
    }
    (0, react_current_fiber_1.setCurrentFiber)(prevDebugFiber);
}
function commitReconciliationEffects(finishedWork) {
    // Placement effects (insertions, reorders) can be scheduled on any fiber
    // type. They needs to happen after the children effects have fired, but
    // before the effects on this fiber have fired.
    var flags = finishedWork.flags;
    if (flags & fiber_flags_1.FiberFlags.Placement) {
        try {
            (0, react_fiber_commit_work_1.commitPlacement)(finishedWork);
        }
        catch (error) {
            (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
        }
        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.
        finishedWork.flags &= ~fiber_flags_1.FiberFlags.Placement;
    }
    if (flags & fiber_flags_1.FiberFlags.Hydrating) {
        finishedWork.flags &= ~fiber_flags_1.FiberFlags.Hydrating;
    }
}
function disappearLayoutEffects(finishedWork) {
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.MemoComponent:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            // TODO (Offscreen) Check: flags & LayoutStatic
            if ((0, react_fiber_commit_work_1.shouldProfile)(finishedWork)) {
                try {
                    (0, react_profile_timer_1.startLayoutEffectTimer)();
                    (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hook_flags_1.HookFlags.Layout, finishedWork, finishedWork.return);
                }
                finally {
                    (0, react_profile_timer_1.recordLayoutEffectDuration)(finishedWork);
                }
            }
            else {
                (0, react_fiber_commit_hook_effect_1.commitHookEffectListUnmount)(hook_flags_1.HookFlags.Layout, finishedWork, finishedWork.return);
            }
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
        case work_tags_1.WorkTag.ClassComponent: {
            // TODO (Offscreen) Check: flags & FiberFlags.RefStatic
            safelyDetachRef(finishedWork, finishedWork.return);
            var instance = finishedWork.stateNode;
            if (typeof instance.componentWillUnmount === "function") {
                safelyCallComponentWillUnmount(finishedWork, finishedWork.return, instance);
            }
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent: {
            // TODO (Offscreen) Check: flags & FiberFlags.RefStatic
            safelyDetachRef(finishedWork, finishedWork.return);
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            // TODO (Offscreen) Check: flags & FiberFlags.RefStatic
            safelyDetachRef(finishedWork, finishedWork.return);
            var isHidden = finishedWork.memoizedState !== null;
            if (isHidden) { // Nested Offscreen tree is already hidden. Don't disappear
                // its effects.
            }
            else {
                recursivelyTraverseDisappearLayoutEffects(finishedWork);
            }
            break;
        }
        default: {
            recursivelyTraverseDisappearLayoutEffects(finishedWork);
            break;
        }
    }
}
exports.disappearLayoutEffects = disappearLayoutEffects;
function reappearLayoutEffects(finishedRoot, current, finishedWork, // This function visits both newly finished work and nodes that were re-used
// from a previously committed tree. We cannot check non-static flags if the
// node was reused.
includeWorkInProgressEffects) {
    // Turn on layout effects in a tree that previously disappeared.
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.SimpleMemoComponent: {
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            // TODO: Check flags & LayoutStatic
            commitHookLayoutEffects(finishedWork, hook_flags_1.HookFlags.Layout);
            break;
        }
        case work_tags_1.WorkTag.ClassComponent: {
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            // TODO: Check for LayoutStatic flag
            var instance = finishedWork.stateNode;
            if (typeof instance.componentDidMount === "function") {
                try {
                    instance.componentDidMount();
                }
                catch (error) {
                    (0, react_fiber_commit_phase_error_1.captureCommitPhaseError)(finishedWork, finishedWork.return, error);
                }
            }
            // Commit any callbacks that would have fired while the component
            // was hidden.
            var updateQueue = finishedWork.updateQueue;
            if (updateQueue !== null) {
                (0, react_fiber_class_update_queue_1.commitHiddenCallbacks)(updateQueue, instance);
            }
            // If this is newly finished work, check for setState callbacks
            if (includeWorkInProgressEffects && flags & fiber_flags_1.FiberFlags.Callback) {
                commitClassCallbacks(finishedWork);
            }
            // TODO: Check flags & RefStatic
            safelyAttachRef(finishedWork, finishedWork.return);
            break;
        }
        // Unlike commitLayoutEffectsOnFiber, we don't need to handle HostRoot
        // because this function only visits nodes that are inside an
        // Offscreen fiber.
        // case WorkTag.HostRoot: {
        //  ...
        // }
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent: {
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            // Renderers may schedule work to be done after host components are mounted
            // (eg DOM renderer may schedule auto-focus for inputs and form controls).
            // These effects should only be committed when components are first mounted,
            // aka when there is no current/alternate.
            if (includeWorkInProgressEffects && current === null && flags & fiber_flags_1.FiberFlags.Update) {
                commitHostComponentMount(finishedWork);
            }
            // TODO: Check flags & Ref
            safelyAttachRef(finishedWork, finishedWork.return);
            break;
        }
        case work_tags_1.WorkTag.Profiler: {
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            // TODO: Figure out how Profiler updates should work with Offscreen
            if (includeWorkInProgressEffects && flags & fiber_flags_1.FiberFlags.Update) {
                commitProfilerUpdate(finishedWork, current);
            }
            break;
        }
        case work_tags_1.WorkTag.SuspenseComponent: {
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            // TODO: Figure out how Suspense hydration callbacks should work
            // with Offscreen.
            if (includeWorkInProgressEffects && flags & fiber_flags_1.FiberFlags.Update) {
                commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            }
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            var offscreenState = finishedWork.memoizedState;
            var isHidden = offscreenState !== null;
            if (isHidden) { // Nested Offscreen tree is still hidden. Don't re-appear its effects.
            }
            else {
                recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            }
            // TODO: Check flags & Ref
            safelyAttachRef(finishedWork, finishedWork.return);
            break;
        }
        default: {
            recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
            break;
        }
    }
}
exports.reappearLayoutEffects = reappearLayoutEffects;
