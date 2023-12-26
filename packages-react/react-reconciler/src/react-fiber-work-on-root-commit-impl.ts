import * as Scheduler from "@zenflux/react-scheduler";
import {
    enableCreateEventHandleAPI,
    enableDebugTracing,
    enableProfilerNestedUpdatePhase,
    enableProfilerNestedUpdateScheduledHook,
    enableProfilerTimer,
    enableSchedulingProfiler,
    enableTransitionTracing,
    enableUpdaterTracking
} from "@zenflux/react-shared/src/react-feature-flags";
import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { LegacyRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import {
    includesSyncLane, NoLane, NoLanes,
    SyncUpdateLanes,
    UpdateLanes
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import {
    logCommitStarted,
    logCommitStopped,
    logLayoutEffectsStarted,
    logLayoutEffectsStopped,
} from "@zenflux/react-reconciler/src/react-debug-tracing";
import {
    commitBeforeMutationEffects,
    commitLayoutEffects,
    commitMutationEffects
} from "@zenflux/react-reconciler/src/react-fiber-commit-effect";

import { markRootFinished } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";
import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";
import {
    clearFirstUncaughtError,
    clearUncaughtError,
    getFirstUncaughtError,
    hasUncaughtError
} from "@zenflux/react-reconciler/src/react-fiber-throw-uncaught-error";
import {
    getCurrentPendingTransitionCallbacks,
    setCurrentPendingTransitionCallbacks
} from "@zenflux/react-reconciler/src/react-fiber-work-current-transaction";
import { ReactFiberWorkDoubleInvokeSharedDev } from "@zenflux/react-reconciler/src/react-fiber-work-double-invoke-shared-dev";
import {
    activateExecutionCommitContext,
    getExecutionContext,
    isExecutionContextRenderOrCommitDeactivate,
    setExecutionContext
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import {
    getWorkInProgressRoot,
    setWorkInProgress,
    setWorkInProgressRoot,
    setWorkInProgressRootRenderLanes,
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import {
    clearLegacyErrorBoundariesThatAlreadyFailed
} from "@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary";
import {
    incrementNestedUpdateCount,
    isNestedRootWithNestedUpdates,
    resetNestedPassiveUpdateCount,
    resetNestedRootWithPassiveNestedUpdates,
    resetNestedUpdateCount,
    setNestedRootWithNestedUpdates
} from "@zenflux/react-reconciler/src/react-fiber-work-nested-count";
import { ReactFiberWorkOnRootShared } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-shared";
import {
    clearRootHavePassiveEffects,
    flushPassiveEffects,
    getPendingPassiveEffectsLanes,
    hasRootWithPassiveEffects,
    hasRootWithPendingPassiveEffects,
    setCurrentEndTime,
    setPendingPassiveEffectsLanes,
    setPendingPassiveEffectsRemainingLanes,
    setPendingPassiveTransitions,
    setRootHavePassiveEffects,
    setRootWithPendingPassiveEffects
} from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";
import {
    clearRootCommittingMutationOrLayoutEffects,
    setRootCommittingMutationOrLayoutEffects
} from "@zenflux/react-reconciler/src/react-fiber-work-root-commiting-muation-or-layout-effects";
import { fiberWorkScheduleCallback } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-callback";
import {
    DiscreteEventPriority,
    getCurrentUpdatePriority,
    setCurrentUpdatePriority
} from "@zenflux/react-reconciler/src/react-event-priorities";
import { getConcurrentlyUpdatedLanes } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import {
    isDevToolsPresent,
    markCommitStarted,
    markCommitStopped,
    markLayoutEffectsStarted,
    markLayoutEffectsStopped,
    onCommitRoot as onCommitRootDevTools,
} from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import { includesSomeLane, mergeLanes, } from "@zenflux/react-reconciler/src/react-fiber-lane";

import { processTransitionCallbacks } from "@zenflux/react-reconciler/src/react-fiber-tracing-marker-component";

import { schedulePostPaintCallback } from "@zenflux/react-reconciler/src/react-post-paint-callback";
import { markNestedUpdateScheduled, recordCommitTime } from "@zenflux/react-reconciler/src/react-profile-timer";
import ReactStrictModeWarnings from "@zenflux/react-reconciler/src/react-strict-mode-warnings";
import { onCommitRoot as onCommitRootTestSelector } from "@zenflux/react-reconciler/src/react-test-selectors";
import { reactReleaseRootPooledCache } from "@zenflux/react-reconciler/src/react-release-root-pooled-cache";

import type { CapturedValue } from "@zenflux/react-reconciler/src/react-captured-value";
import type { EventPriority } from "@zenflux/react-reconciler/src/react-event-priorities";
import type { FiberRoot, Lane } from "@zenflux/react-shared/src/react-internal-types";

import type { Transition } from "@zenflux/react-shared/src/react-internal-types/transition";

const {
    resetAfterCommit,
    afterActiveInstanceBlur,
} = globalThis.__RECONCILER__CONFIG__;

const {
    ReactCurrentBatchConfig,
    ReactCurrentOwner,
} = ReactSharedInternals;

function flushRenderPhaseStrictModeWarningsInDEV() {
    if ( __DEV__ ) {
        ReactStrictModeWarnings.flushLegacyContextWarning();
        ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
    }
}

function makeErrorInfo( digest: string | null | undefined, componentStack: string | null | undefined ) {
    if ( __DEV__ ) {
        const errorInfo = {
            componentStack,
            digest
        };
        Object.defineProperty( errorInfo, "digest", {
            configurable: false,
            enumerable: true,

            get() {
                console.error( "You are accessing \"digest\" from the errorInfo object passed to onRecoverableError." + " This property is deprecated and will be removed in a future version of React." + " To access the digest of an Error look for this property on the Error instance itself." );
                return digest;
            }

        } );
        return errorInfo;
    } else {
        return {
            digest,
            componentStack
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
export function commitRootImpl( root: FiberRoot, recoverableErrors: null | Array<CapturedValue<unknown>>, transitions: Array<Transition> | null, renderPriorityLevel: EventPriority, spawnedLane: Lane ) {
    do {
        // `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
        // means `flushPassiveEffects` will sometimes result in additional
        // passive effects. So we need to keep flushing in a loop until there are
        // no more pending effects.
        // TODO: Might be better if `flushPassiveEffects` did not automatically
        // flush synchronous work at the end, to avoid factoring hazards like this.
        flushPassiveEffects();
    } while ( hasRootWithPendingPassiveEffects() );

    flushRenderPhaseStrictModeWarningsInDEV();

    if ( isExecutionContextRenderOrCommitDeactivate() ) {
        throw new Error( "Should not already be working." );
    }

    const finishedWork = root.finishedWork;
    const lanes = root.finishedLanes;

    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            logCommitStarted( lanes );
        }
    }

    if ( enableSchedulingProfiler ) {
        markCommitStarted( lanes );
    }

    if ( finishedWork === null ) {
        if ( __DEV__ ) {
            if ( enableDebugTracing ) {
                logCommitStopped();
            }
        }

        if ( enableSchedulingProfiler ) {
            markCommitStopped();
        }

        return null;
    } else {
        if ( __DEV__ ) {
            if ( lanes === NoLanes ) {
                console.error( "root.finishedLanes should not be empty during a commit. This is a " + "bug in React." );
            }
        }
    }

    root.finishedWork = null;
    root.finishedLanes = NoLanes;

    if ( finishedWork === root.current ) {
        throw new Error( "Cannot commit the same tree as before. This error is likely caused by " + "a bug in React. Please file an issue." );
    }

    // commitRoot never returns a continuation; it always finishes synchronously.
    // So we can clear these now to allow a new callback to be scheduled.
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    root.cancelPendingCommit = null;
    // Check which lanes no longer have any work scheduled on them, and mark
    // those as finished.
    let remainingLanes = mergeLanes( finishedWork.lanes, finishedWork.childLanes );
    // Make sure to account for lanes that were updated by a concurrent event
    // during the render phase; don't mark them as finished.
    const concurrentlyUpdatedLanes = getConcurrentlyUpdatedLanes();
    remainingLanes = mergeLanes( remainingLanes, concurrentlyUpdatedLanes );
    markRootFinished( root, remainingLanes, spawnedLane );

    if ( root === getWorkInProgressRoot() ) {
        // We can reset these now that they are finished.
        setWorkInProgressRoot( null );
        setWorkInProgress( null );
        setWorkInProgressRootRenderLanes( NoLanes );
    } else {// This indicates that the last root we worked on is not the same one that
        // we're committing now. This most commonly happens when a suspended root
        // times out.
    }

    // If there are pending passive effects, schedule a callback to process them.
    // Do this as early as possible, so it is queued before anything else that
    // might get scheduled in the commit phase. (See #16714.)
    // TODO: Delete all other places that schedule the passive effect callback
    // They're redundant.
    if ( ( finishedWork.subtreeFlags & FiberFlags.PassiveMask ) !== FiberFlags.NoFlags || ( finishedWork.flags & FiberFlags.PassiveMask ) !== FiberFlags.NoFlags ) {
        if ( ! hasRootWithPassiveEffects() ) {
            setRootHavePassiveEffects();
            setPendingPassiveEffectsRemainingLanes( remainingLanes );
            // WorkInProgressTransitions might be overwritten, so we want
            // to store it in pendingPassiveTransitions until they get processed
            // We need to pass this through as an argument to commitRoot
            // because WorkInProgressTransitions might have changed between
            // the previous render and commit if we throttle the commit
            // with setTimeout
            setPendingPassiveTransitions( transitions );
            fiberWorkScheduleCallback( Scheduler.unstable_NormalPriority, () => {
                flushPassiveEffects();
                // This render triggered passive effects: release the root cache pool
                // *after* passive effects fire to avoid freeing a cache pool that may
                // be referenced by a node in the tree (HostRoot, Cache boundary etc)
                return null;
            } );
        }
    }

    // Check if there are any effects in the whole tree.
    // TODO: This is left over from the effect list implementation, where we had
    // to check for the existence of `firstEffect` to satisfy Flow. I think the
    // only other reason this optimization exists is because it affects profiling.
    // Reconsider whether this is necessary.
    const subtreeHasEffects = ( finishedWork.subtreeFlags &
        ( FiberFlags.BeforeMutationMask | FiberFlags.MutationMask | FiberFlags.LayoutMask | FiberFlags.PassiveMask ) ) !== FiberFlags.NoFlags;

    const rootHasEffect = ( finishedWork.flags &
        ( FiberFlags.BeforeMutationMask | FiberFlags.MutationMask | FiberFlags.LayoutMask | FiberFlags.PassiveMask ) ) !== FiberFlags.NoFlags;

    if ( subtreeHasEffects || rootHasEffect ) {
        const prevTransition = ReactCurrentBatchConfig.transition;
        ReactCurrentBatchConfig.transition = null;
        const previousPriority = getCurrentUpdatePriority();
        setCurrentUpdatePriority( DiscreteEventPriority );
        const prevExecutionContext = getExecutionContext();
        activateExecutionCommitContext();
        // Reset this to null before calling lifecycles
        ReactCurrentOwner.current = null;
        // The commit phase is broken into several sub-phases. We do a separate pass
        // of the effect list for each phase: all mutation effects come before all
        // layout effects, and so on.
        // The first phase a "before mutation" phase. We use this phase to read the
        // state of the host tree right before we mutate it. This is where
        // getSnapshotBeforeUpdate is called.
        const shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects( root, finishedWork );

        if ( enableProfilerTimer ) {
            // Mark the current commit time to be shared by all Profilers in this
            // batch. This enables them to be grouped later.
            recordCommitTime();
        }

        if ( enableProfilerTimer && enableProfilerNestedUpdateScheduledHook ) {
            // Track the root here, rather than in commitLayoutEffects(), because of ref setters.
            // Updates scheduled during ref detachment should also be flagged.
            setRootCommittingMutationOrLayoutEffects( root );
        }

        // The next phase is the mutation phase, where we mutate the host tree.
        commitMutationEffects( root, finishedWork, lanes );

        if ( enableCreateEventHandleAPI ) {
            if ( shouldFireAfterActiveInstanceBlur ) {
                afterActiveInstanceBlur();
            }
        }

        resetAfterCommit( root.containerInfo );
        // The work-in-progress tree is now the current tree. This must come after
        // the mutation phase, so that the previous tree is still current during
        // componentWillUnmount, but before the layout phase, so that the finished
        // work is current during componentDidMount/Update.
        root.current = finishedWork;

        // The next phase is the layout phase, where we call effects that read
        // the host tree after it's been mutated. The idiomatic use case for this is
        // layout, but class component lifecycles also fire here for legacy reasons.
        if ( __DEV__ ) {
            if ( enableDebugTracing ) {
                logLayoutEffectsStarted( lanes );
            }
        }

        if ( enableSchedulingProfiler ) {
            markLayoutEffectsStarted( lanes );
        }

        commitLayoutEffects( finishedWork, root, lanes );

        if ( __DEV__ ) {
            if ( enableDebugTracing ) {
                logLayoutEffectsStopped();
            }
        }

        if ( enableSchedulingProfiler ) {
            markLayoutEffectsStopped();
        }

        if ( enableProfilerTimer && enableProfilerNestedUpdateScheduledHook ) {
            clearRootCommittingMutationOrLayoutEffects();
        }

        // Tell Scheduler to yield at the end of the frame, so the browser has an
        // opportunity to paint.
        Scheduler.unstable_requestPaint();
        setExecutionContext( prevExecutionContext );
        // Reset the priority to the previous non-sync value.
        setCurrentUpdatePriority( previousPriority );
        ReactCurrentBatchConfig.transition = prevTransition;
    } else {
        // No effects.
        root.current = finishedWork;

        // Measure these anyway so the flamegraph explicitly shows that there were
        // no effects.
        // TODO: Maybe there's a better way to report this.
        if ( enableProfilerTimer ) {
            recordCommitTime();
        }
    }

    const rootDidHavePassiveEffects = hasRootWithPassiveEffects();

    if ( rootDidHavePassiveEffects ) {
        // This commit has passive effects. Stash a reference to them. But don't
        // schedule a callback until after flushing layout work.
        clearRootHavePassiveEffects();
        setRootWithPendingPassiveEffects( root );
        setPendingPassiveEffectsLanes( lanes );
    } else {
        // There were no passive effects, so we can immediately release the cache
        // pool for this render.
        reactReleaseRootPooledCache( root, remainingLanes );

        if ( __DEV__ ) {
            // nestedPassiveUpdateCount = 0;
            resetNestedPassiveUpdateCount();
            // rootWithPassiveNestedUpdates = null;
            resetNestedRootWithPassiveNestedUpdates();
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
    if ( remainingLanes === NoLanes ) {
        // If there's no remaining work, we can clear the set of already failed
        // error boundaries.
        clearLegacyErrorBoundariesThatAlreadyFailed();
    }

    if ( __DEV__ ) {
        if ( ! rootDidHavePassiveEffects ) {
            ReactFiberWorkDoubleInvokeSharedDev.commitDoubleInvokeEffectsInDEV( root, false );
        }
    }

    onCommitRootDevTools( finishedWork.stateNode, renderPriorityLevel );

    if ( enableUpdaterTracking ) {
        if ( isDevToolsPresent ) {
            root.memoizedUpdaters.clear();
        }
    }

    if ( __DEV__ ) {
        onCommitRootTestSelector();
    }

    // Always call this before exiting `commitRoot`, to ensure that any
    // additional work on this root is scheduled.
    ReactFiberRootSchedulerShared.ensureRootScheduled( root );

    if ( recoverableErrors !== null ) {
        // There were errors during this render, but recovered from them without
        // needing to surface it to the UI. We log them here.
        const onRecoverableError = root.onRecoverableError;

        for ( let i = 0 ; i < recoverableErrors.length ; i++ ) {
            const recoverableError = recoverableErrors[ i ];
            const errorInfo = makeErrorInfo( recoverableError.digest, recoverableError.stack );
            onRecoverableError( recoverableError.value, errorInfo );
        }
    }

    if ( hasUncaughtError() ) {
        clearUncaughtError();

        const error = getFirstUncaughtError();

        clearFirstUncaughtError();

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
    if ( includesSyncLane( getPendingPassiveEffectsLanes() ) && root.tag !== LegacyRoot ) {
        flushPassiveEffects();
    }

    // Read this again, since a passive effect might have updated it
    remainingLanes = root.pendingLanes;

    // Check if this render scheduled a cascading synchronous update. This is a
    // heurstic to detect infinite update loops. We are intentionally excluding
    // hydration lanes in this check, because render triggered by selective
    // hydration is conceptually not an update.
    if ( // Was the finished render the result of an update (not hydration)?
        includesSomeLane( lanes, UpdateLanes ) && // Did it schedule a sync update?
        includesSomeLane( remainingLanes, SyncUpdateLanes ) ) {
        if ( enableProfilerTimer && enableProfilerNestedUpdatePhase ) {
            markNestedUpdateScheduled();
        }

        // Count the number of times the root synchronously re-renders without
        // finishing. If there are too many, it indicates an infinite update loop.
        // if ( root === rootWithNestedUpdates ) {
        if ( isNestedRootWithNestedUpdates( root ) ) {
            // nestedUpdateCount++;
            incrementNestedUpdateCount();
        } else {
            // nestedUpdateCount = 0;
            resetNestedUpdateCount();
            // rootWithNestedUpdates = root;
            setNestedRootWithNestedUpdates( root );
        }
    } else {
        // nestedUpdateCount = 0;
        resetNestedUpdateCount();
    }

    // If layout work was scheduled, flush it now.
    ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();

    if ( __DEV__ ) {
        if ( enableDebugTracing ) {
            logCommitStopped();
        }
    }

    if ( enableSchedulingProfiler ) {
        markCommitStopped();
    }

    if ( enableTransitionTracing ) {
        // We process transitions during passive effects. However, passive effects can be
        // processed synchronously during the commit phase as well as asynchronously after
        // paint. At the end of the commit phase, we schedule a callback that will be called
        // after the next paint. If the transitions have already been processed (passive
        // effect phase happened synchronously), we will schedule a callback to process
        // the transitions. However, if we don't have any pending transition callbacks, this
        // means that the transitions have yet to be processed (passive effects processed after paint)
        // so we will store the end time of paint so that we can process the transitions
        // and then call the callback via the correct end time.
        const prevRootTransitionCallbacks = root.transitionCallbacks;

        if ( prevRootTransitionCallbacks !== null ) {
            schedulePostPaintCallback( endTime => {
                const prevPendingTransitionCallbacks = getCurrentPendingTransitionCallbacks();

                if ( prevPendingTransitionCallbacks !== null ) {
                    setCurrentPendingTransitionCallbacks( null );
                    fiberWorkScheduleCallback( Scheduler.unstable_IdlePriority, () => {
                        processTransitionCallbacks( prevPendingTransitionCallbacks, endTime, prevRootTransitionCallbacks );
                    } );
                } else {
                    setCurrentEndTime( endTime );
                }
            } );
        }
    }

    return null;
}
