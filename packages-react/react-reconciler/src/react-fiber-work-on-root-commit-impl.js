"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitRootImpl = void 0;
var Scheduler = require("@zenflux/react-scheduler");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_debug_tracing_1 = require("@zenflux/react-reconciler/src/react-debug-tracing");
var react_fiber_commit_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-effect");
var react_fiber_lane_mark_root_1 = require("@zenflux/react-reconciler/src/react-fiber-lane-mark-root");
var react_fiber_root_scheduler_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared");
var react_fiber_throw_uncaught_error_1 = require("@zenflux/react-reconciler/src/react-fiber-throw-uncaught-error");
var react_fiber_work_current_transaction_1 = require("@zenflux/react-reconciler/src/react-fiber-work-current-transaction");
var react_fiber_work_double_invoke_shared_dev_1 = require("@zenflux/react-reconciler/src/react-fiber-work-double-invoke-shared-dev");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_work_legacy_error_boundary_1 = require("@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary");
var react_fiber_work_nested_count_1 = require("@zenflux/react-reconciler/src/react-fiber-work-nested-count");
var react_fiber_work_on_root_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-shared");
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
var react_fiber_work_root_commiting_muation_or_layout_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-root-commiting-muation-or-layout-effects");
var react_fiber_work_schedule_callback_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-callback");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_tracing_marker_component_1 = require("@zenflux/react-reconciler/src/react-fiber-tracing-marker-component");
var react_post_paint_callback_1 = require("@zenflux/react-reconciler/src/react-post-paint-callback");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_strict_mode_warnings_1 = require("@zenflux/react-reconciler/src/react-strict-mode-warnings");
var react_test_selectors_1 = require("@zenflux/react-reconciler/src/react-test-selectors");
var react_release_root_pooled_cache_1 = require("@zenflux/react-reconciler/src/react-release-root-pooled-cache");
var _a = globalThis.__RECONCILER__CONFIG__, resetAfterCommit = _a.resetAfterCommit, afterActiveInstanceBlur = _a.afterActiveInstanceBlur;
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig, ReactCurrentOwner = react_shared_internals_1.default.ReactCurrentOwner;
function flushRenderPhaseStrictModeWarningsInDEV() {
    if (__DEV__) {
        react_strict_mode_warnings_1.default.flushLegacyContextWarning();
        react_strict_mode_warnings_1.default.flushPendingUnsafeLifecycleWarnings();
    }
}
function makeErrorInfo(digest, componentStack) {
    if (__DEV__) {
        var errorInfo = {
            componentStack: componentStack,
            digest: digest
        };
        Object.defineProperty(errorInfo, "digest", {
            configurable: false,
            enumerable: true,
            get: function () {
                console.error("You are accessing \"digest\" from the errorInfo object passed to onRecoverableError." + " This property is deprecated and will be removed in a future version of React." + " To access the digest of an Error look for this property on the Error instance itself.");
                return digest;
            }
        });
        return errorInfo;
    }
    else {
        return {
            digest: digest,
            componentStack: componentStack
        };
    }
}
/**
 * This function is the main implementation of the commit phase in the React Fiber Reconciler.
 * It is responsible for finalizing the updates to the DOM and executing any remaining tasks.
 * The commit phase is divided into several sub-phases, including before mutation, mutation,
 * and layout phases, each handling specific types of effects.
 *
 * The function starts with a loop that continues to call flushPassiveEffects() until rootWithPendingPassiveEffects is null.
 * This suggests that the function is responsible for handling and flushing passive effects that might have been registered during the rendering or layout phases.
 *
 * The function then checks if the current execution context includes either RenderContext or CommitContext. If it does, an error is thrown, indicating that the function expects to be in a clean state when it starts executing.
 *
 * The function then retrieves the finishedWork and finishedLanes from the root object. If finishedWork is null, it stops the commit process and returns null. If finishedWork is not null, it checks if finishedWork is the same as the current root. If it is, an error is thrown, indicating that the same tree cannot be committed twice.
 *
 * The function then clears some properties on the root object and calculates the remainingLanes by merging the lanes of finishedWork and its children. It also takes into account lanes that were updated concurrently during the render phase.
 *
 * Finally, if the root is the same as the WorkInProgressRoot, it resets some properties, indicating that the work is finished.
 *
 * To improve the readability of this code, it might be beneficial to break down the function into smaller, more manageable functions. Each of these smaller functions could handle a specific part of the commit process. This would make the code easier to read and maintain. Additionally, adding more comments to explain the purpose and functionality of each part of the code could also improve its readability.
 */
function commitRootImpl(root, recoverableErrors, transitions, renderPriorityLevel, spawnedLane) {
    do {
        // `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
        // means `flushPassiveEffects` will sometimes result in additional
        // passive effects. So we need to keep flushing in a loop until there are
        // no more pending effects.
        // TODO: Might be better if `flushPassiveEffects` did not automatically
        // flush synchronous work at the end, to avoid factoring hazards like this.
        (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
    } while ((0, react_fiber_work_passive_effects_1.hasRootWithPendingPassiveEffects)());
    flushRenderPhaseStrictModeWarningsInDEV();
    if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitDeactivate)()) {
        throw new Error("Should not already be working.");
    }
    var finishedWork = root.finishedWork;
    var lanes = root.finishedLanes;
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logCommitStarted)(lanes);
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markCommitStarted)(lanes);
    }
    if (finishedWork === null) {
        if (__DEV__) {
            if (react_feature_flags_1.enableDebugTracing) {
                (0, react_debug_tracing_1.logCommitStopped)();
            }
        }
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markCommitStopped)();
        }
        return null;
    }
    else {
        if (__DEV__) {
            if (lanes === fiber_lane_constants_1.NoLanes) {
                console.error("root.finishedLanes should not be empty during a commit. This is a " + "bug in React.");
            }
        }
    }
    root.finishedWork = null;
    root.finishedLanes = fiber_lane_constants_1.NoLanes;
    if (finishedWork === root.current) {
        throw new Error("Cannot commit the same tree as before. This error is likely caused by " + "a bug in React. Please file an issue.");
    }
    // commitRoot never returns a continuation; it always finishes synchronously.
    // So we can clear these now to allow a new callback to be scheduled.
    root.callbackNode = null;
    root.callbackPriority = fiber_lane_constants_1.NoLane;
    root.cancelPendingCommit = null;
    // Check which lanes no longer have any work scheduled on them, and mark
    // those as finished.
    var remainingLanes = (0, react_fiber_lane_1.mergeLanes)(finishedWork.lanes, finishedWork.childLanes);
    // Make sure to account for lanes that were updated by a concurrent event
    // during the render phase; don't mark them as finished.
    var concurrentlyUpdatedLanes = (0, react_fiber_concurrent_updates_1.getConcurrentlyUpdatedLanes)();
    remainingLanes = (0, react_fiber_lane_1.mergeLanes)(remainingLanes, concurrentlyUpdatedLanes);
    (0, react_fiber_lane_mark_root_1.markRootFinished)(root, remainingLanes, spawnedLane);
    if (root === (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)()) {
        // We can reset these now that they are finished.
        (0, react_fiber_work_in_progress_1.setWorkInProgressRoot)(null);
        (0, react_fiber_work_in_progress_1.setWorkInProgress)(null);
        (0, react_fiber_work_in_progress_1.setWorkInProgressRootRenderLanes)(fiber_lane_constants_1.NoLanes);
    }
    else { // This indicates that the last root we worked on is not the same one that
        // we're committing now. This most commonly happens when a suspended root
        // times out.
    }
    // If there are pending passive effects, schedule a callback to process them.
    // Do this as early as possible, so it is queued before anything else that
    // might get scheduled in the commit phase. (See #16714.)
    // TODO: Delete all other places that schedule the passive effect callback
    // They're redundant.
    if ((finishedWork.subtreeFlags & fiber_flags_1.FiberFlags.PassiveMask) !== fiber_flags_1.FiberFlags.NoFlags || (finishedWork.flags & fiber_flags_1.FiberFlags.PassiveMask) !== fiber_flags_1.FiberFlags.NoFlags) {
        if (!(0, react_fiber_work_passive_effects_1.hasRootWithPassiveEffects)()) {
            (0, react_fiber_work_passive_effects_1.setRootHavePassiveEffects)();
            (0, react_fiber_work_passive_effects_1.setPendingPassiveEffectsRemainingLanes)(remainingLanes);
            // WorkInProgressTransitions might be overwritten, so we want
            // to store it in pendingPassiveTransitions until they get processed
            // We need to pass this through as an argument to commitRoot
            // because WorkInProgressTransitions might have changed between
            // the previous render and commit if we throttle the commit
            // with setTimeout
            (0, react_fiber_work_passive_effects_1.setPendingPassiveTransitions)(transitions);
            (0, react_fiber_work_schedule_callback_1.fiberWorkScheduleCallback)(Scheduler.unstable_NormalPriority, function () {
                (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
                // This render triggered passive effects: release the root cache pool
                // *after* passive effects fire to avoid freeing a cache pool that may
                // be referenced by a node in the tree (HostRoot, Cache boundary etc)
                return null;
            });
        }
    }
    // Check if there are any effects in the whole tree.
    // TODO: This is left over from the effect list implementation, where we had
    // to check for the existence of `firstEffect` to satisfy Flow. I think the
    // only other reason this optimization exists is because it affects profiling.
    // Reconsider whether this is necessary.
    var subtreeHasEffects = (finishedWork.subtreeFlags &
        (fiber_flags_1.FiberFlags.BeforeMutationMask | fiber_flags_1.FiberFlags.MutationMask | fiber_flags_1.FiberFlags.LayoutMask | fiber_flags_1.FiberFlags.PassiveMask)) !== fiber_flags_1.FiberFlags.NoFlags;
    var rootHasEffect = (finishedWork.flags &
        (fiber_flags_1.FiberFlags.BeforeMutationMask | fiber_flags_1.FiberFlags.MutationMask | fiber_flags_1.FiberFlags.LayoutMask | fiber_flags_1.FiberFlags.PassiveMask)) !== fiber_flags_1.FiberFlags.NoFlags;
    if (subtreeHasEffects || rootHasEffect) {
        var prevTransition = ReactCurrentBatchConfig.transition;
        ReactCurrentBatchConfig.transition = null;
        var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
        (0, react_event_priorities_1.setCurrentUpdatePriority)(react_event_priorities_1.DiscreteEventPriority);
        var prevExecutionContext = (0, react_fiber_work_excution_context_1.getExecutionContext)();
        (0, react_fiber_work_excution_context_1.activateExecutionCommitContext)();
        // Reset this to null before calling lifecycles
        ReactCurrentOwner.current = null;
        // The commit phase is broken into several sub-phases. We do a separate pass
        // of the effect list for each phase: all mutation effects come before all
        // layout effects, and so on.
        // The first phase a "before mutation" phase. We use this phase to read the
        // state of the host tree right before we mutate it. This is where
        // getSnapshotBeforeUpdate is called.
        var shouldFireAfterActiveInstanceBlur = (0, react_fiber_commit_effect_1.commitBeforeMutationEffects)(root, finishedWork);
        if (react_feature_flags_1.enableProfilerTimer) {
            // Mark the current commit time to be shared by all Profilers in this
            // batch. This enables them to be grouped later.
            (0, react_profile_timer_1.recordCommitTime)();
        }
        if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerNestedUpdateScheduledHook) {
            // Track the root here, rather than in commitLayoutEffects(), because of ref setters.
            // Updates scheduled during ref detachment should also be flagged.
            (0, react_fiber_work_root_commiting_muation_or_layout_effects_1.setRootCommittingMutationOrLayoutEffects)(root);
        }
        // The next phase is the mutation phase, where we mutate the host tree.
        (0, react_fiber_commit_effect_1.commitMutationEffects)(root, finishedWork, lanes);
        if (react_feature_flags_1.enableCreateEventHandleAPI) {
            if (shouldFireAfterActiveInstanceBlur) {
                afterActiveInstanceBlur();
            }
        }
        resetAfterCommit(root.containerInfo);
        // The work-in-progress tree is now the current tree. This must come after
        // the mutation phase, so that the previous tree is still current during
        // componentWillUnmount, but before the layout phase, so that the finished
        // work is current during componentDidMount/Update.
        root.current = finishedWork;
        // The next phase is the layout phase, where we call effects that read
        // the host tree after it's been mutated. The idiomatic use case for this is
        // layout, but class component lifecycles also fire here for legacy reasons.
        if (__DEV__) {
            if (react_feature_flags_1.enableDebugTracing) {
                (0, react_debug_tracing_1.logLayoutEffectsStarted)(lanes);
            }
        }
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markLayoutEffectsStarted)(lanes);
        }
        (0, react_fiber_commit_effect_1.commitLayoutEffects)(finishedWork, root, lanes);
        if (__DEV__) {
            if (react_feature_flags_1.enableDebugTracing) {
                (0, react_debug_tracing_1.logLayoutEffectsStopped)();
            }
        }
        if (react_feature_flags_1.enableSchedulingProfiler) {
            (0, react_fiber_dev_tools_hook_1.markLayoutEffectsStopped)();
        }
        if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerNestedUpdateScheduledHook) {
            (0, react_fiber_work_root_commiting_muation_or_layout_effects_1.clearRootCommittingMutationOrLayoutEffects)();
        }
        // Tell Scheduler to yield at the end of the frame, so the browser has an
        // opportunity to paint.
        Scheduler.unstable_requestPaint();
        (0, react_fiber_work_excution_context_1.setExecutionContext)(prevExecutionContext);
        // Reset the priority to the previous non-sync value.
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
    }
    else {
        // No effects.
        root.current = finishedWork;
        // Measure these anyway so the flamegraph explicitly shows that there were
        // no effects.
        // TODO: Maybe there's a better way to report this.
        if (react_feature_flags_1.enableProfilerTimer) {
            (0, react_profile_timer_1.recordCommitTime)();
        }
    }
    var rootDidHavePassiveEffects = (0, react_fiber_work_passive_effects_1.hasRootWithPassiveEffects)();
    if (rootDidHavePassiveEffects) {
        // This commit has passive effects. Stash a reference to them. But don't
        // schedule a callback until after flushing layout work.
        (0, react_fiber_work_passive_effects_1.clearRootHavePassiveEffects)();
        (0, react_fiber_work_passive_effects_1.setRootWithPendingPassiveEffects)(root);
        (0, react_fiber_work_passive_effects_1.setPendingPassiveEffectsLanes)(lanes);
    }
    else {
        // There were no passive effects, so we can immediately release the cache
        // pool for this render.
        (0, react_release_root_pooled_cache_1.reactReleaseRootPooledCache)(root, remainingLanes);
        if (__DEV__) {
            // nestedPassiveUpdateCount = 0;
            (0, react_fiber_work_nested_count_1.resetNestedPassiveUpdateCount)();
            // rootWithPassiveNestedUpdates = null;
            (0, react_fiber_work_nested_count_1.resetNestedRootWithPassiveNestedUpdates)();
        }
    }
    // Read this again, since an effect might have updated it
    remainingLanes = root.pendingLanes;
    // Check if there's remaining work on this root
    // TODO: This is part of the `componentDidCatch` implementation. Its purpose
    // is to detect whether something might have called setState inside
    // `componentDidCatch`. The mechanism is known to be flawed because `setState`
    // inside `componentDidCatch` is itself flawed — that's why we recommend
    // `getDerivedStateFromError` instead. However, it could be improved by
    // checking if remainingLanes includes Sync work, instead of whether there's
    // any work remaining at all (which would also include stuff like Suspense
    // retries or transitions). It's been like this for a while, though, so fixing
    // it probably isn't that urgent.
    if (remainingLanes === fiber_lane_constants_1.NoLanes) {
        // If there's no remaining work, we can clear the set of already failed
        // error boundaries.
        (0, react_fiber_work_legacy_error_boundary_1.clearLegacyErrorBoundariesThatAlreadyFailed)();
    }
    if (__DEV__) {
        if (!rootDidHavePassiveEffects) {
            react_fiber_work_double_invoke_shared_dev_1.ReactFiberWorkDoubleInvokeSharedDev.commitDoubleInvokeEffectsInDEV(root, false);
        }
    }
    (0, react_fiber_dev_tools_hook_1.onCommitRoot)(finishedWork.stateNode, renderPriorityLevel);
    if (react_feature_flags_1.enableUpdaterTracking) {
        if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
            root.memoizedUpdaters.clear();
        }
    }
    if (__DEV__) {
        (0, react_test_selectors_1.onCommitRoot)();
    }
    // Always call this before exiting `commitRoot`, to ensure that any
    // additional work on this root is scheduled.
    react_fiber_root_scheduler_shared_1.ReactFiberRootSchedulerShared.ensureRootScheduled(root);
    if (recoverableErrors !== null) {
        // There were errors during this render, but recovered from them without
        // needing to surface it to the UI. We log them here.
        var onRecoverableError = root.onRecoverableError;
        for (var i = 0; i < recoverableErrors.length; i++) {
            var recoverableError = recoverableErrors[i];
            var errorInfo = makeErrorInfo(recoverableError.digest, recoverableError.stack);
            onRecoverableError(recoverableError.value, errorInfo);
        }
    }
    if ((0, react_fiber_throw_uncaught_error_1.hasUncaughtError)()) {
        (0, react_fiber_throw_uncaught_error_1.clearUncaughtError)();
        var error = (0, react_fiber_throw_uncaught_error_1.getFirstUncaughtError)();
        (0, react_fiber_throw_uncaught_error_1.clearFirstUncaughtError)();
        throw error;
    }
    // If the passive effects are the result of a discrete render, flush them
    // synchronously at the end of the current task so that the result is
    // immediately observable. Otherwise, we assume that they are not
    // order-dependent and do not need to be observed by external systems, so we
    // can wait until after paint.
    // TODO: We can optimize this by not scheduling the callback earlier. Since we
    // currently schedule the callback in multiple places, will wait until those
    // are consolidated.
    if ((0, fiber_lane_constants_1.includesSyncLane)((0, react_fiber_work_passive_effects_1.getPendingPassiveEffectsLanes)()) && root.tag !== root_tags_1.LegacyRoot) {
        (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
    }
    // Read this again, since a passive effect might have updated it
    remainingLanes = root.pendingLanes;
    // Check if this render scheduled a cascading synchronous update. This is a
    // heurstic to detect infinite update loops. We are intentionally excluding
    // hydration lanes in this check, because render triggered by selective
    // hydration is conceptually not an update.
    if ( // Was the finished render the result of an update (not hydration)?
    (0, react_fiber_lane_1.includesSomeLane)(lanes, fiber_lane_constants_1.UpdateLanes) && // Did it schedule a sync update?
        (0, react_fiber_lane_1.includesSomeLane)(remainingLanes, fiber_lane_constants_1.SyncUpdateLanes)) {
        if (react_feature_flags_1.enableProfilerTimer && react_feature_flags_1.enableProfilerNestedUpdatePhase) {
            (0, react_profile_timer_1.markNestedUpdateScheduled)();
        }
        // Count the number of times the root synchronously re-renders without
        // finishing. If there are too many, it indicates an infinite update loop.
        // if ( root === rootWithNestedUpdates ) {
        if ((0, react_fiber_work_nested_count_1.isNestedRootWithNestedUpdates)(root)) {
            // nestedUpdateCount++;
            (0, react_fiber_work_nested_count_1.incrementNestedUpdateCount)();
        }
        else {
            // nestedUpdateCount = 0;
            (0, react_fiber_work_nested_count_1.resetNestedUpdateCount)();
            // rootWithNestedUpdates = root;
            (0, react_fiber_work_nested_count_1.setNestedRootWithNestedUpdates)(root);
        }
    }
    else {
        // nestedUpdateCount = 0;
        (0, react_fiber_work_nested_count_1.resetNestedUpdateCount)();
    }
    // If layout work was scheduled, flush it now.
    react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            (0, react_debug_tracing_1.logCommitStopped)();
        }
    }
    if (react_feature_flags_1.enableSchedulingProfiler) {
        (0, react_fiber_dev_tools_hook_1.markCommitStopped)();
    }
    if (react_feature_flags_1.enableTransitionTracing) {
        // We process transitions during passive effects. However, passive effects can be
        // processed synchronously during the commit phase as well as asynchronously after
        // paint. At the end of the commit phase, we schedule a callback that will be called
        // after the next paint. If the transitions have already been processed (passive
        // effect phase happened synchronously), we will schedule a callback to process
        // the transitions. However, if we don't have any pending transition callbacks, this
        // means that the transitions have yet to be processed (passive effects processed after paint)
        // so we will store the end time of paint so that we can process the transitions
        // and then call the callback via the correct end time.
        var prevRootTransitionCallbacks_1 = root.transitionCallbacks;
        if (prevRootTransitionCallbacks_1 !== null) {
            (0, react_post_paint_callback_1.schedulePostPaintCallback)(function (endTime) {
                var prevPendingTransitionCallbacks = (0, react_fiber_work_current_transaction_1.getCurrentPendingTransitionCallbacks)();
                if (prevPendingTransitionCallbacks !== null) {
                    (0, react_fiber_work_current_transaction_1.setCurrentPendingTransitionCallbacks)(null);
                    (0, react_fiber_work_schedule_callback_1.fiberWorkScheduleCallback)(Scheduler.unstable_IdlePriority, function () {
                        (0, react_fiber_tracing_marker_component_1.processTransitionCallbacks)(prevPendingTransitionCallbacks, endTime, prevRootTransitionCallbacks_1);
                    });
                }
                else {
                    (0, react_fiber_work_passive_effects_1.setCurrentEndTime)(endTime);
                }
            });
        }
    }
    return null;
}
exports.commitRootImpl = commitRootImpl;
