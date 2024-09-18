"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThenable = exports.use = void 0;
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_fiber_thenable_1 = require("@zenflux/react-reconciler/src/react-fiber-thenable");
var ReactCurrentDispatcher = react_shared_internals_1.default.ReactCurrentDispatcher;
function use(usable) {
    if (usable !== null && typeof usable === "object") {
        if (typeof usable.then === "function") {
            // This is a thenable.
            var thenable = usable;
            return useThenable(thenable);
        }
        else if (usable.$$typeof === react_symbols_1.REACT_CONTEXT_TYPE || usable.$$typeof === react_symbols_1.REACT_SERVER_CONTEXT_TYPE) {
            var context = usable;
            return (0, react_fiber_new_context_1.readContext)(context);
        }
    }
    // not-used: eslint-disable-next-line react-internal/safe-string-coercion
    throw new Error("An unsupported type was passed to use(): " + String(usable));
}
exports.use = use;
function useThenable(thenable) {
    // Track the position of the thenable within this fiber.
    var index = react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableIndexCounter;
    react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableIndexCounter += 1;
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableState === null) {
        react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableState = (0, react_fiber_thenable_1.createThenableState)();
    }
    var result = (0, react_fiber_thenable_1.trackUsedThenable)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.thenableState, thenable, index);
    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.alternate === null && (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook === null ? react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber.memoizedState === null : react_fiber_hooks_shared_1.ReactFiberHooksCurrent.workInProgressHook.next === null)) {
        // Initial render, and either this is the first time the component is
        // called, or there were no Hooks called after this use() the previous
        // time (perhaps because it threw). Subsequent Hook calls should use the
        // mount dispatcher.
        if (__DEV__) {
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcherInDEV.onMount;
        }
        else {
            ReactCurrentDispatcher.current = react_fiber_hooks_shared_1.ReactFiberHooksDispatcher.onMount;
        }
    }
    return result;
}
exports.useThenable = useThenable;
