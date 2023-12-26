import { enableProfilerTimer } from "@zenflux/react-shared/src/react-feature-flags";

import { unstable_now as now } from "@zenflux/react-scheduler";

import { NoLane, NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { SuspendedReason } from "@zenflux/react-reconciler/src/react-suspended-reason";

import { RootExitStatus } from "@zenflux/react-reconciler/src/root-exit-status";

import { mergeLanes } from "@zenflux/react-reconciler/src/react-fiber-lane";

import type { Fiber, FiberRoot, Lane, Lanes } from "@zenflux/react-shared/src/react-internal-types";

import type { CapturedValue } from "@zenflux/react-reconciler/src/react-captured-value";
import type { Transition } from "@zenflux/react-shared/src/react-internal-types/transition";

// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.
const RENDER_TIMEOUT_MS = 500;

// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The lanes we're rendering
let workInProgressRootRenderLanes: Lanes = NoLanes;

// When this is true, the work-in-progress fiber just suspended (or errored) and
// we've yet to unwind the stack. In some cases, we may yield to the main thread
// after this happens. If the fiber is pinged before we resume, we can retry
// immediately instead of unwinding the stack.
let workInProgressSuspendedReason: SuspendedReason = SuspendedReason.NotSuspended;
let workInProgressThrownValue: unknown = null;
// Whether a ping listener was attached during this render. This is slightly
// different is whether something suspended, because we don't add multiple
// listeners to a promise we've already seen (per root and lane).
let workInProgressRootDidAttachPingListener: boolean = false;

// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus: RootExitStatus = RootExitStatus.RootInProgress;
// A fatal error, if one is thrown
let workInProgressRootFatalError: unknown = null;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes: Lanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootInterleavedUpdatedLanes: Lanes = NoLanes;
// Lanes that were updated during the render phase (*not* an interleaved event).
let workInProgressRootRenderPhaseUpdatedLanes: Lanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes: Lanes = NoLanes;
// If this lane scheduled deferred work, this is the lane of the deferred task.
let workInProgressDeferredLane: Lane = NoLane;
// Errors that are thrown during the render phase.
let workInProgressRootConcurrentErrors: Array<CapturedValue<unknown>> | null = null;
// These are errors that we recovered from without surfacing them to the UI.
// We will log them once the tree commits.
let workInProgressRootRecoverableErrors: Array<CapturedValue<unknown>> | null = null;

// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
let workInProgressRootRenderTargetTime: number = Infinity;

let workInProgressTransitions: Array<Transition> | null = null;

// ----
// Get
// ----
export function getWorkInProgress(): Fiber | null {
    return workInProgress;
}

export function getWorkInProgressSafe(): Fiber {
    return workInProgress!;
}

export function getWorkInProgressTransitions(): null | Array<Transition> {
    return workInProgressTransitions;
}

export function getWorkInProgressRoot(): FiberRoot | null {
    return workInProgressRoot;
}

export function getWorkInProgressRootSafe(): FiberRoot {
    return workInProgressRoot!;
}

export function getWorkInProgressRootRenderLanes(): Lanes {
    return workInProgressRootRenderLanes;
}

export function getWorkInProgressRootExitStatus(): RootExitStatus {
    return workInProgressRootExitStatus;
}

export function getWorkInProgressRootPingedLanes() {
    return workInProgressRootPingedLanes;
}

export function getWorkInProgressRootRenderTargetTime() {
    return workInProgressRootRenderTargetTime;
}

export function getWorkInProgressSuspendedReason(): SuspendedReason {
    return workInProgressSuspendedReason;
}

export function getWorkInProgressThrownValue(): unknown {
    return workInProgressThrownValue;
}

export function getWorkInProgressRootConcurrentErrors() {
    return workInProgressRootConcurrentErrors;
}

export function getWorkInProgressDeferredLane(): Lane {
    return workInProgressDeferredLane;
}

export function getWorkInProgressRootSkippedLanes(): Lanes {
    return workInProgressRootSkippedLanes;
}

export function getWorkInProgressRootInterleavedUpdatedLanes(): Lanes {
    return workInProgressRootInterleavedUpdatedLanes;
}

export function getWorkInProgressRootRecoverableErrors() {
    return workInProgressRootRecoverableErrors;
}

export function getWorkInProgressRootFatalError(): unknown {
    return workInProgressRootFatalError;
}

export function getWorkInProgressRootRenderPhaseUpdatedLanes(): Lanes {
    return workInProgressRootRenderPhaseUpdatedLanes;
}

// ----
// Did
// ----
export function didWorkInProgressRootDidAttachPingListener(): boolean {
    return workInProgressRootDidAttachPingListener;
}

// ----
// Is
// ----
export function isWorkLoopSuspendedOnData(): boolean {
    return workInProgressSuspendedReason === SuspendedReason.SuspendedOnData;
}

// ----
// Has
// ----
export function hasWorkInProgressRoot(): boolean {
    return workInProgressRoot !== null;
}

// ----
// Set
// ----
export function setWorkInProgress( fiber: Fiber | null ) {
    workInProgress = fiber;
}

export function setWorkInProgressRoot( root: FiberRoot | null ) {
    workInProgressRoot = root;
}

export function setWorkInProgressRootRenderLanes( lanes: Lanes ) {
    workInProgressRootRenderLanes = lanes;
}

export function setWorkInProgressRootPingedLanes( lanes: Lanes ) {
    workInProgressRootPingedLanes = lanes;
}

export function setWorkInProgressRootExitStatus( status: RootExitStatus ) {
    workInProgressRootExitStatus = status;
}

export function setWorkInProgressSuspendedReason( reason: SuspendedReason ) {
    workInProgressSuspendedReason = reason;
}

export function setWorkInProgressThrownValue( value: unknown ) {
    workInProgressThrownValue = value;
}

export function setWorkInProgressRootRenderTargetTime( time: number ) {
    workInProgressRootRenderTargetTime = time;
}

export function setWorkInProgressRootDidAttachPingListener( didAttach: boolean ) {
    workInProgressRootDidAttachPingListener = didAttach;
}

export function setWorkInProgressTransitions( transitions: Array<Transition> | null ) {
    workInProgressTransitions = transitions;
}

export function setWorkInProgressRootConcurrentErrors( errors: Array<CapturedValue<unknown>> | null ) {
    workInProgressRootConcurrentErrors = errors;
}

export function setWorkInProgressRootRecoverableErrors( errors: Array<CapturedValue<unknown>> | null ) {
    workInProgressRootRecoverableErrors = errors;
}

export function setWorkInProgressRootSkippedLanes( lanes: Lanes ) {
    workInProgressRootSkippedLanes = lanes;
}

export function setWorkInProgressRootFatalError( error: unknown ) {
    workInProgressRootFatalError = error;
}

export function setWorkInProgressRootInterleavedUpdatedLanes( lanes: Lanes ) {
    workInProgressRootInterleavedUpdatedLanes = lanes;
}

export function setWorkInProgressRootRenderPhaseUpdatedLanes( lanes: Lanes ) {
    workInProgressRootRenderPhaseUpdatedLanes = lanes;
}

export function setWorkInProgressDeferredLane( lane: Lane ) {
    workInProgressDeferredLane = lane;
}

export function markSkippedUpdateLanes( lane: Lane | Lanes ): void {
    // Original name: `markSkippedUpdateLanes`.
    // TODO: Change to `markWorkInProgressRootSkippedLanes`.
    setWorkInProgressRootSkippedLanes( mergeLanes( lane, getWorkInProgressRootSkippedLanes() ) );
}

// ----
// Or
// ----
export function orWorkInProgressRootInterleavedUpdatedLanes( lanes: Lanes ) {
    workInProgressRootInterleavedUpdatedLanes |= lanes;
}

// ----
// Push
// ----
export function pushWorkInProgressRootConcurrentError( capturedError: CapturedValue<unknown> ) {
    // @ts-ignore
    workInProgressRootConcurrentErrors.push( capturedError );
}

export function pushWorkInProgressRootRecoverableErrors( capturedErrors: Array<CapturedValue<unknown>> ) {
    // @ts-ignore
    workInProgressRootRecoverableErrors.push( ... capturedErrors );
}

// ----
// Reset
// ----
export function resetWorkInProgressRootRenderTimer() {
    setWorkInProgressRootRenderTargetTime( now() + RENDER_TIMEOUT_MS );
}

// Used to reuse a Fiber for a second pass.
export function resetWorkInProgress( workInProgress: Fiber, renderLanes: Lanes ): Fiber {
    // This resets the Fiber to what createFiber or createWorkInProgress would
    // have set the values to before during the first pass. Ideally this wouldn't
    // be necessary but unfortunately many code paths reads from the workInProgress
    // when they should be reading from current and writing to workInProgress.
    // We assume pendingProps, index, key, ref, return are still untouched to
    // avoid doing another reconciliation.
    // Reset the effect flags but keep any Placement tags, since that's something
    // that child fiber is setting, not the reconciliation.
    workInProgress.flags &= FiberFlags.StaticMask | FiberFlags.Placement;
    // The effects are no longer valid.
    const current = workInProgress.alternate;

    if ( current === null ) {
        // Reset to createFiber's initial values.
        workInProgress.childLanes = NoLanes;
        workInProgress.lanes = renderLanes;
        workInProgress.child = null;
        workInProgress.subtreeFlags = FiberFlags.NoFlags;
        workInProgress.memoizedProps = null;
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        workInProgress.dependencies = null;
        workInProgress.stateNode = null;

        if ( enableProfilerTimer ) {
            // Note: We don't reset the actualTime counts. It's useful to accumulate
            // actual time across multiple render passes.
            workInProgress.selfBaseDuration = 0;
            workInProgress.treeBaseDuration = 0;
        }
    } else {
        // Reset to the cloned values that createWorkInProgress would've.
        workInProgress.childLanes = current.childLanes;
        workInProgress.lanes = current.lanes;
        workInProgress.child = current.child;
        workInProgress.subtreeFlags = FiberFlags.NoFlags;
        workInProgress.deletions = null;
        workInProgress.memoizedProps = current.memoizedProps;
        workInProgress.memoizedState = current.memoizedState;
        workInProgress.updateQueue = current.updateQueue;
        // Needed because Blocks store data on type.
        workInProgress.type = current.type;
        // Clone the dependencies object. This is mutated during the render phase, so
        // it cannot be shared with the current fiber.
        const currentDependencies = current.dependencies;
        workInProgress.dependencies = currentDependencies === null ? null : {
            lanes: currentDependencies.lanes,
            firstContext: currentDependencies.firstContext
        };

        if ( enableProfilerTimer ) {
            // Note: We don't reset the actualTime counts. It's useful to accumulate
            // actual time across multiple render passes.
            workInProgress.selfBaseDuration = current.selfBaseDuration;
            workInProgress.treeBaseDuration = current.treeBaseDuration;
        }
    }

    return workInProgress;
}

export function queueRecoverableErrors( errors: Array<CapturedValue<unknown>> ) {
    if ( getWorkInProgressRootRecoverableErrors() === null ) {
        setWorkInProgressRootRecoverableErrors( errors );
    } else {
        // $FlowFixMe[method-unbinding]
        // WorkInProgressRootRecoverableErrors.push.apply( WorkInProgressRootRecoverableErrors, errors );
        pushWorkInProgressRootRecoverableErrors( errors );
    }
}
