import { NoLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import type { FiberRoot, Lane } from "@zenflux/react-shared/src/react-internal-types";

import type {
    EnsureRootScheduledCallback,
    ScheduleImmediateTaskCallback, ScheduleTaskForRootDuringMicrotaskCallback
} from "@zenflux/react-reconciler/src/react-fiber-work-on-root-schedule";

// A linked list of all the roots with pending work. In an idiomatic app,
// there's only a single root, but we do support multi root apps, hence this
// extra complexity. But this module is optimized for the single root case.

let firstScheduledRoot: FiberRoot | null = null;
let lastScheduledRoot: FiberRoot | null = null;

// Used to prevent redundant mircotasks from being scheduled.
let didScheduleMicrotask: boolean = false;
// `act` "microtasks" are scheduled on the `act` queue instead of an actual
// microtask, so we have to dedupe those separately. This wouldn't be an issue
// if we required all `act` calls to be awaited, which we might in the future.
let didScheduleMicrotask_act: boolean = false;

let currentEventTransitionLane: Lane = NoLane;

export class ReactFiberRootSchedulerShared {
    public static firstScheduledRoot: FiberRoot | null = firstScheduledRoot;
    public static lastScheduledRoot: FiberRoot | null = lastScheduledRoot;

    public static didScheduleMicrotask: boolean = didScheduleMicrotask;
    public static didScheduleMicrotask_act: boolean = didScheduleMicrotask_act;

    public static currentEventTransitionLane: Lane = currentEventTransitionLane;

    public static ensureRootScheduled: EnsureRootScheduledCallback;
    public static scheduleImmediateTask: ScheduleImmediateTaskCallback;
    public static scheduleTaskForRootDuringMicrotask: ScheduleTaskForRootDuringMicrotaskCallback;
}
