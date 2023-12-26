import {
    unstable_cancelCallback as Scheduler_cancelCallback,
    unstable_IdlePriority as IdleSchedulerPriority,
    unstable_ImmediatePriority as ImmediateSchedulerPriority,
    unstable_NormalPriority as NormalSchedulerPriority,
    unstable_now as now,
    unstable_scheduleCallback as Scheduler_scheduleCallback,
    unstable_UserBlockingPriority as UserBlockingSchedulerPriority
} from "@zenflux/react-scheduler";

import { enableDeferRootSchedulingToMicrotask } from "@zenflux/react-shared/src/react-feature-flags";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { LegacyRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import {
    getHighestPriorityLane, includesSyncLane, NoLane, NoLanes,
    SyncLane
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { ReactFiberWorkOnRootShared } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-shared";

import {
    isExecutionContextRenderOrCommitDeactivate
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";

import {
    getNextLanes,
    markStarvedLanesAsExpired,
    upgradePendingLaneToSync
} from "@zenflux/react-reconciler/src/react-fiber-lane";
import {
    getWorkInProgressRoot,
    getWorkInProgressRootRenderLanes,
    isWorkLoopSuspendedOnData
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import {
    ContinuousEventPriority,
    DefaultEventPriority,
    DiscreteEventPriority,
    IdleEventPriority,
    lanesToEventPriority
} from "@zenflux/react-reconciler/src/react-event-priorities";

import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";

import { performConcurrentWorkOnRoot } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-concurrent";

import type { FiberRoot, Lane } from "@zenflux/react-shared/src/react-internal-types";
import type { PriorityLevel, SchedulerCallback, SchedulerTask } from "@zenflux/react-scheduler";

const {
    supportsMicrotasks,
    scheduleMicrotask,
    shouldAttemptEagerTransition,
} = globalThis.__RECONCILER__CONFIG__;

const {
    ReactCurrentActQueue
} = ReactSharedInternals;

const fakeActCallbackNode = {};

// --- Find Better Solution ---
type EnsureRootScheduledCallback = typeof ensureRootScheduled;
type ScheduleImmediateTaskCallback = typeof scheduleImmediateTask;
type ScheduleTaskForRootDuringMicrotaskCallback = typeof scheduleTaskForRootDuringMicrotask;

export type {
    EnsureRootScheduledCallback,
    ScheduleImmediateTaskCallback,
    ScheduleTaskForRootDuringMicrotaskCallback
};

ReactFiberRootSchedulerShared.ensureRootScheduled = ensureRootScheduled;
ReactFiberRootSchedulerShared.scheduleImmediateTask = scheduleImmediateTask;
ReactFiberRootSchedulerShared.scheduleTaskForRootDuringMicrotask = scheduleTaskForRootDuringMicrotask;

// ---

function processRootScheduleInMicrotask() {
    // This function is always called inside a microtask. It should never be
    // called synchronously.
    ReactFiberRootSchedulerShared.didScheduleMicrotask = false;

    if ( __DEV__ ) {
        ReactFiberRootSchedulerShared.didScheduleMicrotask_act = false;
    }

    // We'll recompute this as we iterate through all the roots and schedule them.
    ReactFiberWorkOnRootShared.unsetHavePendingSyncWork();

    const currentTime = now();
    let prev: FiberRoot | null = null;
    let root = ReactFiberRootSchedulerShared.firstScheduledRoot;

    while ( root !== null ) {
        const next = root.next;

        if ( ReactFiberRootSchedulerShared.currentEventTransitionLane !== NoLane && shouldAttemptEagerTransition() ) {
            // A transition was scheduled during an event, but we're going to try to
            // render it synchronously anyway. We do this during a popstate event to
            // preserve the scroll position of the previous page.
            upgradePendingLaneToSync( root, ReactFiberRootSchedulerShared.currentEventTransitionLane );
        }

        const nextLanes = scheduleTaskForRootDuringMicrotask( root, currentTime );

        if ( nextLanes === NoLane ) {
            // This root has no more pending work. Remove it from the schedule. To
            // guard against subtle reentrancy bugs, this microtask is the only place
            // we do this — you can add roots to the schedule whenever, but you can
            // only remove them here.
            // Null this out so we know it's been removed from the schedule.
            root.next = null;

            if ( prev === null ) {
                // This is the new head of the list
                ReactFiberRootSchedulerShared.firstScheduledRoot = next;
            } else {
                // @ts-ignore
                prev.next = next;
            }

            if ( next === null ) {
                // This is the new tail of the list
                ReactFiberRootSchedulerShared.lastScheduledRoot = prev;
            }
        } else {
            // This root still has work. Keep it in the list.
            prev = root;

            if ( includesSyncLane( nextLanes ) ) {
                ReactFiberWorkOnRootShared.setHavePendingSyncWork();
            }
        }

        root = next;
    }

    ReactFiberRootSchedulerShared.currentEventTransitionLane = NoLane;
    // At the end of the microtask, flush any pending synchronous work. This has
    // to come at the end, because it does actual rendering work that might throw.
    ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
}

export function ensureRootScheduled( root: FiberRoot ): void {
    // This function is called whenever a root receives an update. It does two
    // things 1) it ensures the root is in the root schedule, and 2) it ensures
    // there's a pending microtask to process the root schedule.
    //
    // Most of the actual scheduling logic does not happen until
    // `scheduleTaskForRootDuringMicrotask` runs.
    // Add the root to the schedule
    if ( root === ReactFiberRootSchedulerShared.lastScheduledRoot || root.next !== null ) {// Fast path. This root is already scheduled.
    } else {
        if ( ReactFiberRootSchedulerShared.lastScheduledRoot === null ) {
            ReactFiberRootSchedulerShared.firstScheduledRoot = ReactFiberRootSchedulerShared.lastScheduledRoot = root;
        } else {
            ReactFiberRootSchedulerShared.lastScheduledRoot.next = root;
            ReactFiberRootSchedulerShared.lastScheduledRoot = root;
        }
    }

    // Any time a root received an update, we set this to true until the next time
    // we process the schedule. If it's false, then we can quickly exit flushSync
    // without consulting the schedule.
    ReactFiberWorkOnRootShared.setHavePendingSyncWork();

    // At the end of the current event, go through each of the roots and ensure
    // there's a task scheduled for each one at the correct priority.
    if ( __DEV__ && ReactCurrentActQueue.current !== null ) {
        // We're inside an `act` scope.
        if ( ! ReactFiberRootSchedulerShared.didScheduleMicrotask_act ) {
            ReactFiberRootSchedulerShared.didScheduleMicrotask_act = true;
            scheduleImmediateTask( processRootScheduleInMicrotask );
        }
    } else {
        if ( ! ReactFiberRootSchedulerShared.didScheduleMicrotask ) {
            ReactFiberRootSchedulerShared.didScheduleMicrotask = true;
            scheduleImmediateTask( processRootScheduleInMicrotask );
        }
    }

    if ( ! enableDeferRootSchedulingToMicrotask ) {
        // While this flag is disabled, we schedule the render task immediately
        // instead of waiting a microtask.
        // TODO: We need to land enableDeferRootSchedulingToMicrotask ASAP to
        // unblock additional features we have planned.
        scheduleTaskForRootDuringMicrotask( root, now() );
    }

    if ( __DEV__ && ReactCurrentActQueue.isBatchingLegacy && root.tag === LegacyRoot ) {
        // Special `act` case: Record whenever a legacy update is scheduled.
        ReactCurrentActQueue.didScheduleLegacyUpdate = true;
    }
}

export function scheduleImmediateTask( cb: SchedulerCallback ) {
    if ( __DEV__ && ReactCurrentActQueue.current !== null ) {
        // Special case: Inside an `act` scope, we push microtasks to the fake `act`
        // callback queue. This is because we currently support calling `act`
        // without awaiting the result. The plan is to deprecate that, and require
        // that you always await the result so that the microtasks have a chance to
        // run. But it hasn't happened yet.
        ReactCurrentActQueue.current.push( () => {
            cb();
            return null;
        } );
    }

    // TODO: Can we land supportsMicrotasks? Which environments don't support it?
    // Alternatively, can we move this check to the host config?
    if ( supportsMicrotasks ) {
        scheduleMicrotask( () => {
            // In Safari, appending an iframe forces microtasks to run.
            // https://github.com/facebook/react/issues/22459
            // We don't support running callbacks in the middle of render
            // or commit so we need to check against that.
            if ( isExecutionContextRenderOrCommitDeactivate() ) {
                // Note that this would still prematurely flush the callbacks
                // if this happens outside render or commit phase (e.g. in an event).
                // Intentionally using a macrotask instead of a microtask here. This is
                // wrong semantically but it prevents an infinite loop. The bug is
                // Safari's, not ours, so we just do our best to not crash even though
                // the behavior isn't completely correct.
                Scheduler_scheduleCallback( ImmediateSchedulerPriority, cb );
                return;
            }

            cb();
        } );
    } else {
        // If microtasks are not supported, use Scheduler.
        Scheduler_scheduleCallback( ImmediateSchedulerPriority, cb );
    }
}

export function scheduleTaskForRootDuringMicrotask( root: FiberRoot, currentTime: number ): Lane {
    // This function is always called inside a microtask, or at the very end of a
    // rendering task right before we yield to the main thread. It should never be
    // called synchronously.
    //
    // TODO: Unless enableDeferRootSchedulingToMicrotask is off. We need to land
    // that ASAP to unblock additional features we have planned.
    //
    // This function also never performs React work synchronously; it should
    // only schedule work to be performed later, in a separate task or microtask.
    // Check if any lanes are being starved by other work. If so, mark them as
    // expired so we know to work on those next.
    markStarvedLanesAsExpired( root, currentTime );
    // Determine the next lanes to work on, and their priority.
    const workInProgressRoot = getWorkInProgressRoot();
    const workInProgressRootRenderLanes = getWorkInProgressRootRenderLanes();
    const nextLanes = getNextLanes( root, root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes );
    const existingCallbackNode = root.callbackNode;

    if ( // Check if there's nothing to work on
        nextLanes === NoLanes || // If this root is currently suspended and waiting for data to resolve, don't
        // schedule a task to render it. We'll either wait for a ping, or wait to
        // receive an update.
        //
        // Suspended render phase
        root === workInProgressRoot && isWorkLoopSuspendedOnData() || // Suspended commit phase
        root.cancelPendingCommit !== null ) {
        // Fast path: There's nothing to work on.
        if ( existingCallbackNode !== null ) {
            cancelCallback( existingCallbackNode );
        }

        root.callbackNode = null;
        root.callbackPriority = NoLane;
        return NoLane;
    }

    // Schedule a new callback in the host environment.
    if ( includesSyncLane( nextLanes ) ) {
        // Synchronous work is always flushed at the end of the microtask, so we
        // don't need to schedule an additional task.
        if ( existingCallbackNode !== null ) {
            cancelCallback( existingCallbackNode );
        }

        root.callbackPriority = SyncLane;
        root.callbackNode = null;
        return SyncLane;
    } else {
        // We use the highest priority lane to represent the priority of the callback.
        const existingCallbackPriority = root.callbackPriority;
        const newCallbackPriority = getHighestPriorityLane( nextLanes );

        if ( newCallbackPriority === existingCallbackPriority && // Special case related to `act`. If the currently scheduled task is a
            // Scheduler task, rather than an `act` task, cancel it and re-schedule
            // on the `act` queue.
            ! ( __DEV__ && ReactCurrentActQueue.current !== null && existingCallbackNode !== fakeActCallbackNode ) ) {
            // The priority hasn't changed. We can reuse the existing task.
            return newCallbackPriority;
        } else {
            // Cancel the existing callback. We'll schedule a new one below.
            cancelCallback( existingCallbackNode );
        }

        let schedulerPriorityLevel: PriorityLevel;

        const result = lanesToEventPriority( nextLanes );

        switch ( result ) {
            case DiscreteEventPriority:
                schedulerPriorityLevel = ImmediateSchedulerPriority;
                break;

            case ContinuousEventPriority:
                schedulerPriorityLevel = UserBlockingSchedulerPriority;
                break;

            case DefaultEventPriority:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;

            case IdleEventPriority:
                schedulerPriorityLevel = IdleSchedulerPriority;
                break;

            default:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;
        }

        const newCallbackNode = scheduleCallback( schedulerPriorityLevel, performConcurrentWorkOnRoot.bind( null, root ) );
        root.callbackPriority = newCallbackPriority;
        root.callbackNode = newCallbackNode;
        return newCallbackPriority;
    }
}

function scheduleCallback( priorityLevel: PriorityLevel, callback: SchedulerCallback ) {
    if ( __DEV__ && ReactCurrentActQueue.current !== null ) {
        // Special case: We're inside an `act` scope (a testing utility).
        // Instead of scheduling work in the host environment, add it to a
        // fake internal queue that's managed by the `act` implementation.
        ReactCurrentActQueue.current.push( callback );
        return fakeActCallbackNode;
    } else {
        return Scheduler_scheduleCallback( priorityLevel, callback );
    }
}

function cancelCallback( callbackNode: SchedulerTask ) {
    if ( __DEV__ && callbackNode === fakeActCallbackNode ) {// Special `act` case: check if this is the fake callback node used by
        // the `act` implementation.
    } else if ( callbackNode !== null ) {
        Scheduler_cancelCallback( callbackNode );
    }
}
