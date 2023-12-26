import { unstable_now as now } from "@zenflux/react-scheduler";
import {
    enableProfilerNestedUpdateScheduledHook,
    enableProfilerTimer,
    enableTransitionTracing,
    enableUpdaterTracking
} from "@zenflux/react-shared/src/react-feature-flags";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { NoLanes, SyncLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { markRootSuspended, markRootUpdated } from "@zenflux/react-reconciler/src/react-fiber-lane-mark-root";

import { ReactFiberRootSchedulerShared } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler-shared";
import {
    isExecutionContextCommitDeactivate,
    isExecutionContextEmpty,
    isExecutionContextNonEmpty,
    isExecutionContextRenderActivate, isExecutionContextRenderDeactivate
} from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import {
    getWorkInProgress,
    getWorkInProgressDeferredLane,
    getWorkInProgressRoot,
    getWorkInProgressRootExitStatus,
    getWorkInProgressRootInterleavedUpdatedLanes,
    getWorkInProgressRootRenderLanes,
    getWorkInProgressRootRenderPhaseUpdatedLanes,
    getWorkInProgressSuspendedReason,
    resetWorkInProgressRootRenderTimer,
    setWorkInProgressRootInterleavedUpdatedLanes,
    setWorkInProgressRootRenderPhaseUpdatedLanes
} from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { prepareWorkInProgressFreshStack } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-prepare-fresh-stack";
import { ReactFiberWorkOnRootShared } from "@zenflux/react-reconciler/src/react-fiber-work-on-root-shared";
import {
    isFlushPassiveEffects,
    setDidScheduleUpdateDuringPassiveEffects
} from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";
import {
    isRootCommittingMutationOrLayoutEffects
} from "@zenflux/react-reconciler/src/react-fiber-work-root-commiting-muation-or-layout-effects";
import { getIsRunningInsertionEffect } from "@zenflux/react-reconciler/src/react-fiber-work-running-insertion-effect";
import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";
import { SuspendedReason } from "@zenflux/react-reconciler/src/react-suspended-reason";
import {
    current as ReactCurrentFiberCurrent,
    isRendering as ReactCurrentDebugFiberIsRenderingInDEV,
    resetCurrentFiber as resetCurrentDebugFiberInDEV,
    setCurrentFiber as setCurrentDebugFiberInDEV
} from "@zenflux/react-reconciler/src/react-current-fiber";
import { isConcurrentActEnvironment, isLegacyActEnvironment } from "@zenflux/react-reconciler/src/react-fiber-act";
import { isDevToolsPresent } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import {
    addFiberToLanesMap,
    addTransitionToLanesMap,
    mergeLanes,
} from "@zenflux/react-reconciler/src/react-fiber-lane";

import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import type { Fiber, FiberRoot, Lane } from "@zenflux/react-shared/src/react-internal-types";
import type { Transition } from "@zenflux/react-shared/src/react-internal-types/transition";

const {
    ReactCurrentActQueue,
    ReactCurrentBatchConfig
} = ReactSharedInternals;

let didWarnAboutUpdateInRender = false;
let didWarnAboutUpdateInRenderForAnotherComponent: Set<string>;

if ( __DEV__ ) {
    didWarnAboutUpdateInRenderForAnotherComponent = new Set<string>();
}

function warnAboutRenderPhaseUpdatesInDEV( fiber: Fiber ) {
    if ( __DEV__ ) {
        if ( ReactCurrentDebugFiberIsRenderingInDEV ) {
            switch ( fiber.tag ) {
                case WorkTag.FunctionComponent:
                case WorkTag.ForwardRef:
                case WorkTag.SimpleMemoComponent: {
                    const WorkInProgress = getWorkInProgress();
                    const renderingComponentName = WorkInProgress && reactGetComponentNameFromFiber( WorkInProgress ) || "Unknown";
                    // Dedupe by the rendering component because it's the one that needs to be fixed.
                    const dedupeKey = renderingComponentName;

                    if ( ! didWarnAboutUpdateInRenderForAnotherComponent.has( dedupeKey ) ) {
                        didWarnAboutUpdateInRenderForAnotherComponent.add( dedupeKey );
                        const setStateComponentName = reactGetComponentNameFromFiber( fiber ) || "Unknown";
                        console.error( "Cannot update a component (`%s`) while rendering a " + "different component (`%s`). To locate the bad setState() call inside `%s`, " + "follow the stack trace as described in https://reactjs.org/link/setstate-in-render", setStateComponentName, renderingComponentName, renderingComponentName );
                    }

                    break;
                }

                case WorkTag.ClassComponent: {
                    if ( ! didWarnAboutUpdateInRender ) {
                        console.error( "Cannot update during an existing state transition (such as " + "within `render`). Render methods should be a pure " + "function of props and state." );
                        didWarnAboutUpdateInRender = true;
                    }

                    break;
                }
            }
        }
    }
}

function warnIfUpdatesNotWrappedWithActDEV( fiber: Fiber ): void {
    if ( __DEV__ ) {
        if ( fiber.mode & TypeOfMode.ConcurrentMode ) {
            if ( ! isConcurrentActEnvironment() ) {
                // Not in an act environment. No need to warn.
                return;
            }
        } else {
            // Legacy mode has additional cases where we suppress a warning.
            if ( ! isLegacyActEnvironment( fiber ) ) {
                // Not in an act environment. No need to warn.
                return;
            }

            if ( isExecutionContextNonEmpty() ) {
                // Legacy mode doesn't warn if the update is batched, i.e.
                // batchedUpdates or flushSync.
                return;
            }

            if ( fiber.tag !== WorkTag.FunctionComponent && fiber.tag !== WorkTag.ForwardRef && fiber.tag !== WorkTag.SimpleMemoComponent ) {
                // For backwards compatibility with pre-hooks code, legacy mode only
                // warns for updates that originate from a hook.
                return;
            }
        }

        if ( ReactCurrentActQueue.current === null ) {
            const previousFiber = ReactCurrentFiberCurrent;

            try {
                setCurrentDebugFiberInDEV( fiber );
                console.error( "An update to %s inside a test was not wrapped in act(...).\n\n" + "When testing, code that causes React state updates should be " + "wrapped into act(...):\n\n" + "act(() => {\n" + "  /* fire events that update state */\n" + "});\n" + "/* assert on the output */\n\n" + "This ensures that you're testing the behavior the user would see " + "in the browser." + " Learn more at https://reactjs.org/link/wrap-tests-with-act", reactGetComponentNameFromFiber( fiber ) );
            } finally {
                if ( previousFiber ) {
                    setCurrentDebugFiberInDEV( fiber );
                } else {
                    resetCurrentDebugFiberInDEV();
                }
            }
        }
    }
}

export function scheduleUpdateOnFiber( root: FiberRoot, fiber: Fiber, lane: Lane ) {
    if ( __DEV__ ) {
        if ( getIsRunningInsertionEffect() ) {
            console.error( "useInsertionEffect must not schedule updates." );
        }
    }

    if ( __DEV__ ) {
        if ( isFlushPassiveEffects() ) {
            setDidScheduleUpdateDuringPassiveEffects();
        }
    }

    // Check if the work loop is currently suspended and waiting for data to
    // finish loading.
    if ( // Suspended render phase
        root === getWorkInProgressRoot() && getWorkInProgressSuspendedReason() === SuspendedReason.SuspendedOnData || // Suspended commit phase
        root.cancelPendingCommit !== null ) {
        // The incoming update might unblock the current render. Interrupt the
        // current attempt and restart from the top.
        prepareWorkInProgressFreshStack( root, NoLanes );
        markRootSuspended( root, getWorkInProgressRootRenderLanes(), getWorkInProgressDeferredLane() );
    }

    // Mark that the root has a pending update.
    markRootUpdated( root, lane );

    if ( isExecutionContextRenderDeactivate() && root === getWorkInProgressRoot() ) {
        // This update was dispatched during the render phase. This is a mistake
        // if the update originates from user space (with the exception of local
        // hook updates, which are handled differently and don't reach this
        // function), but there are some internal React features that use this as
        // an implementation detail, like selective hydration.
        warnAboutRenderPhaseUpdatesInDEV( fiber );
        // Track lanes that were updated during the render phase
        setWorkInProgressRootRenderPhaseUpdatedLanes(
            mergeLanes( getWorkInProgressRootRenderPhaseUpdatedLanes(), lane )
        );
    } else {
        // This is a normal update, scheduled from outside the render phase. For
        // example, during an input event.
        if ( enableUpdaterTracking ) {
            if ( isDevToolsPresent ) {
                addFiberToLanesMap( root, fiber, lane );
            }
        }

        warnIfUpdatesNotWrappedWithActDEV( fiber );

        if ( enableProfilerTimer && enableProfilerNestedUpdateScheduledHook ) {
            if ( isExecutionContextCommitDeactivate() && isRootCommittingMutationOrLayoutEffects( root ) ) {
                if ( fiber.mode & TypeOfMode.ProfileMode ) {
                    let current: null | Fiber = fiber;

                    while ( current !== null ) {
                        if ( current.tag === WorkTag.Profiler ) {
                            const {
                                id,
                                onNestedUpdateScheduled
                            } = current.memoizedProps;

                            if ( typeof onNestedUpdateScheduled === "function" ) {
                                onNestedUpdateScheduled( id );
                            }
                        }

                        current = current.return;
                    }
                }
            }
        }

        if ( enableTransitionTracing ) {
            const transition = ReactCurrentBatchConfig.transition;

            if ( transition && transition.name != null ) {
                if ( transition.startTime === -1 ) {
                    transition.startTime = now();
                }

                addTransitionToLanesMap( root, transition as Transition, lane );
            }
        }

        if ( root === getWorkInProgressRoot() ) {
            // Received an update to a tree that's in the middle of rendering. Mark
            // that there was an interleaved update work on this root.
            if ( isExecutionContextRenderActivate() ) {
                setWorkInProgressRootInterleavedUpdatedLanes(
                    mergeLanes( getWorkInProgressRootInterleavedUpdatedLanes(), lane )
                );
                // WorkInProgressRootInterleavedUpdatedLanes = mergeLanes( WorkInProgressRootInterleavedUpdatedLanes, lane );
            }

            if ( getWorkInProgressRootExitStatus() === RootExitStatus.RootSuspendedWithDelay ) {
                // The root already suspended with a delay, which means this render
                // definitely won't finish. Since we have a new update, let's mark it as
                // suspended now, right before marking the incoming update. This has the
                // effect of interrupting the current render and switching to the update.
                // TODO: Make sure this doesn't override pings that happen while we've
                // already started rendering.
                markRootSuspended( root, getWorkInProgressRootRenderLanes(), getWorkInProgressDeferredLane() );
            }
        }

        ReactFiberRootSchedulerShared.ensureRootScheduled( root );

        if ( lane === SyncLane && isExecutionContextEmpty() && ( fiber.mode & TypeOfMode.ConcurrentMode ) === TypeOfMode.NoMode ) {

            if ( __DEV__ && ReactCurrentActQueue.isBatchingLegacy ) {// Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.

            } else {
                // Flush the synchronous work now, unless we're already working or inside
                // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
                // scheduleCallbackForFiber to preserve the ability to schedule a callback
                // without immediately flushing it. We only do this for user-initiated
                // updates, to preserve historical behavior of legacy mode.
                resetWorkInProgressRootRenderTimer();
                ReactFiberWorkOnRootShared.flushSyncWorkOnLegacyRootsOnly();
            }
        }
    }
}
