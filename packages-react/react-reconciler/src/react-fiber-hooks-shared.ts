import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import type { Dispatcher } from "@zenflux/react-shared/src/react-internal-types/dispatcher";
import type { FunctionComponentUpdateQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

import type { Hook } from "@zenflux/react-reconciler/src/react-fiber-hooks-types";

import type { HookType } from "@zenflux/react-shared/src/react-internal-types/hook";
import type { ThenableState } from "@zenflux/react-reconciler/src/react-fiber-thenable";
import type { Fiber, Lanes } from "@zenflux/react-shared/src/react-internal-types";

// These are set right before calling the component.
let renderLanes: Lanes = NoLanes;

// Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;

// In DEV, this is the name of the currently executing primitive hook
let currentHookNameInDev: HookType | null | undefined = null;
// In DEV, this list ensures that hooks are called in the same order between renders.
// The list stores the order of hooks used during the initial render (mount).
// Subsequent renders (updates) reference this list.
let hookTypesDev: Array<HookType> | null = null;
let hookTypesUpdateIndexDev: number = -1;

// Counts the number of useId hooks in this component.
let localIdCounter: number = 0;
// Counts number of `use`-d thenables
let thenableIndexCounter: number = 0;
let thenableState: ThenableState | null = null;

// Where an update was scheduled only during the current render pass. This
// gets reset after each attempt.
// TODO: Maybe there's some way to consolidate this with
// `didScheduleRenderPhaseUpdate`. Or with `numberOfReRenders`.
let didScheduleRenderPhaseUpdateDuringThisPass: boolean = false;
let shouldDoubleInvokeUserFnsInHooksDEV: boolean = false;

// Whether an update was scheduled at any point during the render phase. This
// does not get reset if we do another render pass; only when we're completely
// finished evaluating this component. This is an optimization so we know
// whether we need to clear render phase updates after a throw.
let didScheduleRenderPhaseUpdate: boolean = false;

// Used for ids that are generated completely client-side (i.e. not during
// hydration). This counter is global, so client ids are not stable across
// render attempts.
let globalClientIdCounter: number = 0;

let didWarnAboutMismatchedHooksForComponent: Set<string | null>;
let didWarnUncachedGetSnapshot: void | true;
let didWarnAboutUseWrappedInTryCatch: Set<string | null>;
let didWarnAboutAsyncClientComponent: Set<string | null>;

let HooksDispatcherOnMountInDEV: Dispatcher | null = null;
let HooksDispatcherOnMountWithHookTypesInDEV: Dispatcher | null = null;
let HooksDispatcherOnUpdateInDEV: Dispatcher | null = null;
let HooksDispatcherOnRerenderInDEV: Dispatcher | null = null;

let InvalidNestedHooksDispatcherOnMountInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnUpdateInDEV: Dispatcher | null = null;
let InvalidNestedHooksDispatcherOnRerenderInDEV: Dispatcher | null = null;

// NOTE: defining two versions of this function to avoid size impact when this feature is disabled.
// Previously this function was inlined, the additional `memoCache` property makes it not inlined.
let createFunctionComponentUpdateQueue: () => FunctionComponentUpdateQueue;

// In DEV, this tracks whether currently rendering component needs to ignore
// the dependencies for Hooks that need them (e.g. useEffect or useMemo).
// When true, such Hooks will always be "remounted". Only used during hot reload.
let ignorePreviousDependencies: boolean = false;

let stackContainsErrorMessage: boolean | null = null;

export class ReactFiberHooksCurrent {
    public static renderLanes: Lanes = renderLanes;

    // The work-in-progress fiber. I've named it differently to distinguish it from
    // the work-in-progress hook.
    public static renderingFiber: Fiber<FunctionComponentUpdateQueue>;
    public static hook: Hook | null = currentHook;
    public static workInProgressHook: Hook | null = workInProgressHook;
    public static hookNameInDev: HookType | null | undefined = currentHookNameInDev;
    public static hookTypesDev: Array<HookType> | null = hookTypesDev;
    public static hookTypesUpdateIndexDev: number = hookTypesUpdateIndexDev;
    public static localIdCounter: number = localIdCounter;
    public static thenableIndexCounter: number = thenableIndexCounter;
    public static thenableState: ThenableState | null = thenableState;
}

export class ReactFiberHooksFlags {
    public static didScheduleRenderPhaseUpdate: boolean = didScheduleRenderPhaseUpdate;
    public static didScheduleRenderPhaseUpdateDuringThisPass: boolean = didScheduleRenderPhaseUpdateDuringThisPass;

    public static didWarnAboutMismatchedHooksForComponent: Set<string | null> = didWarnAboutMismatchedHooksForComponent;
    public static didWarnUncachedGetSnapshot: void | true = didWarnUncachedGetSnapshot;
    public static didWarnAboutUseWrappedInTryCatch: Set<string | null> = didWarnAboutUseWrappedInTryCatch;
    public static didWarnAboutAsyncClientComponent: Set<string | null> = didWarnAboutAsyncClientComponent;
}

export class ReactFiberHooksInfra {
    public static createFunctionComponentUpdateQueue: () => FunctionComponentUpdateQueue = createFunctionComponentUpdateQueue;
    public static ignorePreviousDependencies: boolean = ignorePreviousDependencies;
    public static stackContainsErrorMessage: boolean | null = stackContainsErrorMessage;
    public static shouldDoubleInvokeUserFnsInHooksDEV: boolean = shouldDoubleInvokeUserFnsInHooksDEV;
}

export class ReactFiberHooksGlobals {
    public static clientIdCounter: number = globalClientIdCounter;
}

export class ReactFiberHooksDispatcher {
    public static onMount: Dispatcher | null = null;
    public static onUpdate: Dispatcher | null = null;
    public static onRerender: Dispatcher | null = null;
    public static contextOnly: Dispatcher | null = null;
}

export class ReactFiberHooksDispatcherInDEV {
    public static onMount: Dispatcher | null = HooksDispatcherOnMountInDEV;
    public static onMountWithHookTypes: Dispatcher | null = HooksDispatcherOnMountWithHookTypesInDEV;

    public static onUpdate: Dispatcher | null = HooksDispatcherOnUpdateInDEV;
    public static onRerender: Dispatcher | null = HooksDispatcherOnRerenderInDEV;
}

export class ReactFiberHooksInvalidNestedHooksDispatcherInDEV {
    public static onMount: Dispatcher | null = InvalidNestedHooksDispatcherOnMountInDEV;
    public static onUpdate: Dispatcher | null = InvalidNestedHooksDispatcherOnUpdateInDEV;
    public static onRenderer: Dispatcher | null = InvalidNestedHooksDispatcherOnRerenderInDEV;
}
