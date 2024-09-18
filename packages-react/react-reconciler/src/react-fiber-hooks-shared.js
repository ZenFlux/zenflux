"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactFiberHooksInvalidNestedHooksDispatcherInDEV = exports.ReactFiberHooksDispatcherInDEV = exports.ReactFiberHooksDispatcher = exports.ReactFiberHooksGlobals = exports.ReactFiberHooksInfra = exports.ReactFiberHooksFlags = exports.ReactFiberHooksCurrent = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
// These are set right before calling the component.
var renderLanes = fiber_lane_constants_1.NoLanes;
// Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
var currentHook = null;
var workInProgressHook = null;
// In DEV, this is the name of the currently executing primitive hook
var currentHookNameInDev = null;
// In DEV, this list ensures that hooks are called in the same order between renders.
// The list stores the order of hooks used during the initial render (mount).
// Subsequent renders (updates) reference this list.
var hookTypesDev = null;
var hookTypesUpdateIndexDev = -1;
// Counts the number of useId hooks in this component.
var localIdCounter = 0;
// Counts number of `use`-d thenables
var thenableIndexCounter = 0;
var thenableState = null;
// Where an update was scheduled only during the current render pass. This
// gets reset after each attempt.
// TODO: Maybe there's some way to consolidate this with
// `didScheduleRenderPhaseUpdate`. Or with `numberOfReRenders`.
var didScheduleRenderPhaseUpdateDuringThisPass = false;
var shouldDoubleInvokeUserFnsInHooksDEV = false;
// Whether an update was scheduled at any point during the render phase. This
// does not get reset if we do another render pass; only when we're completely
// finished evaluating this component. This is an optimization so we know
// whether we need to clear render phase updates after a throw.
var didScheduleRenderPhaseUpdate = false;
// Used for ids that are generated completely client-side (i.e. not during
// hydration). This counter is global, so client ids are not stable across
// render attempts.
var globalClientIdCounter = 0;
var didWarnAboutMismatchedHooksForComponent;
var didWarnUncachedGetSnapshot;
var didWarnAboutUseWrappedInTryCatch;
var didWarnAboutAsyncClientComponent;
var HooksDispatcherOnMountInDEV = null;
var HooksDispatcherOnMountWithHookTypesInDEV = null;
var HooksDispatcherOnUpdateInDEV = null;
var HooksDispatcherOnRerenderInDEV = null;
var InvalidNestedHooksDispatcherOnMountInDEV = null;
var InvalidNestedHooksDispatcherOnUpdateInDEV = null;
var InvalidNestedHooksDispatcherOnRerenderInDEV = null;
// NOTE: defining two versions of this function to avoid size impact when this feature is disabled.
// Previously this function was inlined, the additional `memoCache` property makes it not inlined.
var createFunctionComponentUpdateQueue;
// In DEV, this tracks whether currently rendering component needs to ignore
// the dependencies for Hooks that need them (e.g. useEffect or useMemo).
// When true, such Hooks will always be "remounted". Only used during hot reload.
var ignorePreviousDependencies = false;
var stackContainsErrorMessage = null;
var ReactFiberHooksCurrent = /** @class */ (function () {
    function ReactFiberHooksCurrent() {
    }
    ReactFiberHooksCurrent.renderLanes = renderLanes;
    ReactFiberHooksCurrent.hook = currentHook;
    ReactFiberHooksCurrent.workInProgressHook = workInProgressHook;
    ReactFiberHooksCurrent.hookNameInDev = currentHookNameInDev;
    ReactFiberHooksCurrent.hookTypesDev = hookTypesDev;
    ReactFiberHooksCurrent.hookTypesUpdateIndexDev = hookTypesUpdateIndexDev;
    ReactFiberHooksCurrent.localIdCounter = localIdCounter;
    ReactFiberHooksCurrent.thenableIndexCounter = thenableIndexCounter;
    ReactFiberHooksCurrent.thenableState = thenableState;
    return ReactFiberHooksCurrent;
}());
exports.ReactFiberHooksCurrent = ReactFiberHooksCurrent;
var ReactFiberHooksFlags = /** @class */ (function () {
    function ReactFiberHooksFlags() {
    }
    ReactFiberHooksFlags.didScheduleRenderPhaseUpdate = didScheduleRenderPhaseUpdate;
    ReactFiberHooksFlags.didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdateDuringThisPass;
    ReactFiberHooksFlags.didWarnAboutMismatchedHooksForComponent = didWarnAboutMismatchedHooksForComponent;
    ReactFiberHooksFlags.didWarnUncachedGetSnapshot = didWarnUncachedGetSnapshot;
    ReactFiberHooksFlags.didWarnAboutUseWrappedInTryCatch = didWarnAboutUseWrappedInTryCatch;
    ReactFiberHooksFlags.didWarnAboutAsyncClientComponent = didWarnAboutAsyncClientComponent;
    return ReactFiberHooksFlags;
}());
exports.ReactFiberHooksFlags = ReactFiberHooksFlags;
var ReactFiberHooksInfra = /** @class */ (function () {
    function ReactFiberHooksInfra() {
    }
    ReactFiberHooksInfra.createFunctionComponentUpdateQueue = createFunctionComponentUpdateQueue;
    ReactFiberHooksInfra.ignorePreviousDependencies = ignorePreviousDependencies;
    ReactFiberHooksInfra.stackContainsErrorMessage = stackContainsErrorMessage;
    ReactFiberHooksInfra.shouldDoubleInvokeUserFnsInHooksDEV = shouldDoubleInvokeUserFnsInHooksDEV;
    return ReactFiberHooksInfra;
}());
exports.ReactFiberHooksInfra = ReactFiberHooksInfra;
var ReactFiberHooksGlobals = /** @class */ (function () {
    function ReactFiberHooksGlobals() {
    }
    ReactFiberHooksGlobals.clientIdCounter = globalClientIdCounter;
    return ReactFiberHooksGlobals;
}());
exports.ReactFiberHooksGlobals = ReactFiberHooksGlobals;
var ReactFiberHooksDispatcher = /** @class */ (function () {
    function ReactFiberHooksDispatcher() {
    }
    ReactFiberHooksDispatcher.onMount = null;
    ReactFiberHooksDispatcher.onUpdate = null;
    ReactFiberHooksDispatcher.onRerender = null;
    ReactFiberHooksDispatcher.contextOnly = null;
    return ReactFiberHooksDispatcher;
}());
exports.ReactFiberHooksDispatcher = ReactFiberHooksDispatcher;
var ReactFiberHooksDispatcherInDEV = /** @class */ (function () {
    function ReactFiberHooksDispatcherInDEV() {
    }
    ReactFiberHooksDispatcherInDEV.onMount = HooksDispatcherOnMountInDEV;
    ReactFiberHooksDispatcherInDEV.onMountWithHookTypes = HooksDispatcherOnMountWithHookTypesInDEV;
    ReactFiberHooksDispatcherInDEV.onUpdate = HooksDispatcherOnUpdateInDEV;
    ReactFiberHooksDispatcherInDEV.onRerender = HooksDispatcherOnRerenderInDEV;
    return ReactFiberHooksDispatcherInDEV;
}());
exports.ReactFiberHooksDispatcherInDEV = ReactFiberHooksDispatcherInDEV;
var ReactFiberHooksInvalidNestedHooksDispatcherInDEV = /** @class */ (function () {
    function ReactFiberHooksInvalidNestedHooksDispatcherInDEV() {
    }
    ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onMount = InvalidNestedHooksDispatcherOnMountInDEV;
    ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onUpdate = InvalidNestedHooksDispatcherOnUpdateInDEV;
    ReactFiberHooksInvalidNestedHooksDispatcherInDEV.onRenderer = InvalidNestedHooksDispatcherOnRerenderInDEV;
    return ReactFiberHooksInvalidNestedHooksDispatcherInDEV;
}());
exports.ReactFiberHooksInvalidNestedHooksDispatcherInDEV = ReactFiberHooksInvalidNestedHooksDispatcherInDEV;
