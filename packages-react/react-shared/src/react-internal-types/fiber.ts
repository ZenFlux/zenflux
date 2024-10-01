
import type { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import type { ConcurrentUpdate } from "@zenflux/react-shared/src/react-internal-types/update";

import type { ReactFormState, RefObject, Wakeable } from "@zenflux/react-shared/src/react-types";

import type { Lane, LaneMap, Lanes } from "@zenflux/react-shared/src/react-internal-types/lanes";

import type { Transition, TransitionTracingCallbacks } from "@zenflux/react-shared/src/react-internal-types/transition";
import type { TracingMarkerInstance } from "@zenflux/react-shared/src/react-internal-types/tracing";
import type { SuspenseHydrationCallbacks, SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";

import type { Container, NoTimeout, TimeoutHandle } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";
import type { FunctionComponentUpdateQueue, RetryQueue, FiberUpdateQueue } from "@zenflux/react-shared/src/react-internal-types/queue";
import type { OffscreenQueue } from "@zenflux/react-shared/src/react-internal-types/offscreen";

import type { Dependencies } from "@zenflux/react-shared/src/react-internal-types/dependencies";

import type { Source } from "@zenflux/react-shared/src/react-element-type";
import type { HookType } from "@zenflux/react-shared/src/react-internal-types/hook";
import type { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import type { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";
import type { RootTag } from "@zenflux/react-shared/src/react-internal-constants/root-tags";
import type { Cache } from "@zenflux/react-shared/src/react-internal-types/cache";

// The following fields are only used in transition tracing in Profile builds
type TransitionTracingOnlyFiberRootProperties = {
    transitionCallbacks: null | TransitionTracingCallbacks;
    transitionLanes: Array<Set<Transition> | null>;
    // Transitions on the root can be represented as a bunch of tracing markers.
    // Each entangled group of transitions can be treated as a tracing marker.
    // It will have a set of pending suspense boundaries. These transitions
    // are considered complete when the pending suspense boundaries set is
    // empty. We can represent this as a Map of transitions to suspense
    // boundary sets
    incompleteTransitions: Map<Transition, TracingMarkerInstance>;
};

// The following attributes are only used by DevTools and are only present in DEV builds.
// They enable DevTools Profiler UI to show which Fiber(s) scheduled a given commit.
type UpdaterTrackingOnlyFiberRootProperties = {
    memoizedUpdaters: Set<Fiber>;
    pendingUpdatersLaneMap: LaneMap<Set<Fiber>>;
};

// The follow fields are only used by enableSuspenseCallback for hydration.
type SuspenseCallbackOnlyFiberRootProperties<TSuspenseInstance extends SuspenseInstance = SuspenseInstance> = {
    hydrationCallbacks: null | SuspenseHydrationCallbacks<TSuspenseInstance>;
};

// Exported FiberRoot type includes all properties,
// To avoid requiring potentially error-prone :any casts throughout the project.
// The types are defined separately within this file to ensure they stay in sync.
export type FiberRoot =
    BaseFiberRootProperties
    & SuspenseCallbackOnlyFiberRootProperties
    & UpdaterTrackingOnlyFiberRootProperties
    & TransitionTracingOnlyFiberRootProperties;

type BaseFiberRootProperties = {
    // The type of root (legacy, batched, concurrent, etc.)
    tag: RootTag;
    // Any additional information from the host associated with this root.
    containerInfo: Container;
    // Used only by persistent updates.
    pendingChildren: any;
    // The currently active root fiber. This is the mutable root of the tree.
    current: Fiber;
    pingCache: WeakMap<Wakeable, Set<unknown>> | Map<Wakeable, Set<unknown>> | null;
    // A finished work-in-progress HostRoot that's ready to be committed.
    finishedWork: Fiber | null;
    // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
    // it's superseded by a new one.
    timeoutHandle: TimeoutHandle | NoTimeout;
    // When a root has a pending commit scheduled, calling this function will
    // cancel it.
    // TODO: Can this be consolidated with timeoutHandle?
    cancelPendingCommit: null | ( () => void );
    // Top context object, used by renderSubtreeIntoContainer
    context: Record<string, any> | null;
    pendingContext: Record<string, any> | null;
    // Used to create a linked list that represent all the roots that have
    // pending work scheduled on them.
    next: FiberRoot | null;
    // Node returned by Scheduler.scheduleCallback. Represents the next rendering
    // task that the root will work on.
    callbackNode: any;
    callbackPriority: Lane;
    expirationTimes: LaneMap<number>;
    hiddenUpdates: LaneMap<Array<ConcurrentUpdate> | null>;
    pendingLanes: Lanes;
    suspendedLanes: Lanes;
    pingedLanes: Lanes;
    expiredLanes: Lanes;
    errorRecoveryDisabledLanes: Lanes;
    shellSuspendCounter: number;
    finishedLanes: Lanes;
    entangledLanes: Lanes;
    entanglements: LaneMap<Lanes>;
    pooledCache: Cache | null;
    pooledCacheLanes: Lanes;
    // TODO: In Fizz, id generation is specific to each server config. Maybe we
    // should do this in Fiber, too? Deferring this decision for now because
    // there's no other place to store the prefix except for an internal field on
    // the public createRoot object, which the fiber tree does not currently have
    // a reference to.
    identifierPrefix: string;
    onRecoverableError: ( error: unknown, errorInfo: {
        digest?: string | null | undefined;
        componentStack?: string | null | undefined;
    } ) => void;
    formState: ReactFormState<any, any> | null;
};

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber<TQueue extends FiberUpdateQueue<any> | RetryQueue | FunctionComponentUpdateQueue | OffscreenQueue = any > = {
    // These first fields are conceptually members of an Instance. This used to
    // be split into a separate type and intersected with the other Fiber fields,
    // but until Flow fixes its intersection bugs, we've merged them into a
    // single type.
    // An Instance is shared between all versions of a component. We can easily
    // break this out into a separate object to avoid copying so much to the
    // alternate versions of the tree. We put this on a single object for now to
    // minimize the number of objects created during the initial render.
    // Tag identifying the type of fiber.
    tag: WorkTag;
    // Unique identifier of this child.
    key: null | string;
    // The value of element.type which is used to preserve the identity during
    // reconciliation of this child.
    elementType: any;
    // The resolved function/class/ associated with this fiber.
    type: any;
    // The local state associated with this fiber.
    stateNode: any;
    // Conceptual aliases
    // parent : Instance -> return The parent happens to be the same as the
    // return fiber since we've merged the fiber and instance.
    // Remaining fields belong to Fiber
    // The Fiber to return to after finishing processing this one.
    // This is effectively the parent, but there can be multiple parents (two)
    // so this is only the parent of the thing we're currently processing.
    // It is conceptually the same as the return address of a stack frame.
    return: Fiber | null;
    // Singly Linked List Tree Structure.
    child: Fiber | null;
    sibling: Fiber | null;
    index: number;
    // The ref last used to attach this node.
    // I'll avoid adding an owner field for prod and model that as functions.
    ref: null | ( ( ( handle: unknown ) => void ) & {
        _stringRef: string | null | undefined;
    } ) | RefObject;
    refCleanup: null | ( () => void );
    // Input is the data coming into process this fiber. Arguments. Props.
    pendingProps: any;
    // This type will be more specific once we overload the tag.
    memoizedProps: any;
    // The props used to create the output.
    // A queue of state updates and callbacks.
    // updateQueue: unknown;
    // Modified By ZenFlux
    updateQueue: TQueue | null;
    // The state used to create the output
    memoizedState: any;
    // Dependencies (contexts, events) for this fiber, if it has any
    dependencies: Dependencies | null;
    // Bitfield that describes properties about the fiber and its subtree. E.g.
    // the ConcurrentMode flag indicates whether the subtree should be async-by-
    // default. When a fiber is created, it inherits the mode of its
    // parent. Additional flags can be set at creation time, but after that the
    // value should remain unchanged throughout the fiber's lifetime, particularly
    // before its child fibers are created.
    mode: TypeOfMode;
    // Effect
    flags: FiberFlags;
    subtreeFlags: FiberFlags;
    deletions: Array<Fiber> | null;
    // Singly linked list fast path to the next fiber with side-effects.
    nextEffect: Fiber | null;
    // The first and last fiber with side-effect within this subtree. This allows
    // us to reuse a slice of the linked list when we reuse the work done within
    // this fiber.
    firstEffect: Fiber | null;
    lastEffect: Fiber | null;
    lanes: Lanes;
    childLanes: Lanes;
    // This is a pooled version of a Fiber. Every fiber that gets updated will
    // eventually have a pair. There are cases when we can clean up pairs to save
    // memory if we need to.
    alternate: Fiber<TQueue> | null;
    // Time spent rendering this Fiber and its descendants for the current update.
    // This tells us how well the tree makes use of sCU for memoization.
    // It is reset to 0 each time we render and only updated when we don't bailout.
    // This field is only set when the enableProfilerTimer flag is enabled.
    actualDuration?: number;
    // If the Fiber is currently active in the "render" phase,
    // This marks the time at which the work began.
    // This field is only set when the enableProfilerTimer flag is enabled.
    actualStartTime?: number;
    // Duration of the most recent render time for this Fiber.
    // This value is not updated when we bailout for memoization purposes.
    // This field is only set when the enableProfilerTimer flag is enabled.
    selfBaseDuration?: number;
    // Sum of base times for all descendants of this Fiber.
    // This value bubbles up during the "complete" phase.
    // This field is only set when the enableProfilerTimer flag is enabled.
    treeBaseDuration?: number;
    // Conceptual aliases
    // workInProgress : Fiber ->  alternate The alternate used for reuse happens
    // to be the same as work in progress.
    // __DEV__ only
    _debugSource?: Source | null;
    _debugOwner?: Fiber | null;
    _debugIsCurrentlyTiming?: boolean;
    _debugNeedsRemount?: boolean;
    // Used to verify that the order of hooks does not change between renders.
    _debugHookTypes?: Array<HookType> | null;
};
