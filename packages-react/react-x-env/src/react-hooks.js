"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOptimistic = exports.useEffectEvent = exports.useMemoCache = exports.use = exports.useCacheRefresh = exports.useSyncExternalStore = exports.useId = exports.useDeferredValue = exports.useTransition = exports.useDebugValue = exports.useImperativeHandle = exports.useMemo = exports.useCallback = exports.useLayoutEffect = exports.useInsertionEffect = exports.useEffect = exports.useRef = exports.useReducer = exports.useState = exports.useContext = exports.getCacheForType = exports.getCacheSignal = void 0;
// eslint-disable-next-line no-restricted-imports
require("./react-internals");
/* Taken from packages/react */
var _a = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, ReactCurrentDispatcher = _a.ReactCurrentDispatcher, ReactCurrentCache = _a.ReactCurrentCache;
function resolveDispatcher() {
    var dispatcher = ReactCurrentDispatcher.current;
    if (__DEV__) {
        if (dispatcher === null) {
            console.error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" + " one of the following reasons:\n" + "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" + "2. You might be breaking the Rules of Hooks\n" + "3. You might have more than one copy of React in the same app\n" + "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
        }
    }
    // Will result in a null access error if accessed outside render phase. We
    // intentionally don't throw our own error because this is in a hot path.
    // Also helps ensure this is inlined.
    return dispatcher;
}
function getCacheSignal() {
    var dispatcher = ReactCurrentCache.current;
    if (!dispatcher) {
        // If we have no cache to associate with this call, then we don't know
        // its lifetime. We abort early since that's safer than letting it live
        // for ever. Unlike just caching which can be a functional noop outside
        // of React, these should generally always be associated with some React
        // render but we're not limiting quite as much as making it a Hook.
        // It's safer than erroring early at runtime.
        var controller = new AbortController();
        var reason = new Error("This CacheSignal was requested outside React which means that it is " + "immediately aborted.");
        controller.abort(reason);
        return controller.signal;
    }
    return dispatcher.getCacheSignal();
}
exports.getCacheSignal = getCacheSignal;
function getCacheForType(resourceType) {
    var dispatcher = ReactCurrentCache.current;
    if (!dispatcher) {
        // If there is no dispatcher, then we treat this as not being cached.
        return resourceType();
    }
    return dispatcher.getCacheForType(resourceType);
}
exports.getCacheForType = getCacheForType;
function useContext(Context) {
    var dispatcher = resolveDispatcher();
    if (__DEV__) {
        // TODO: add a more generic warning for invalid values.
        if (Context._context !== undefined) {
            var realContext = Context._context;
            // Don't deduplicate because this legitimately causes bugs
            // and nobody should be using this in existing code.
            if (realContext.Consumer === Context) {
                console.error("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be " + "removed in a future major release. Did you mean to call useContext(Context) instead?");
            }
            else if (realContext.Provider === Context) {
                console.error("Calling useContext(Context.Provider) is not supported. " + "Did you mean to call useContext(Context) instead?");
            }
        }
    }
    return dispatcher.useContext(Context);
}
exports.useContext = useContext;
function useState(initialState) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useState(initialState);
}
exports.useState = useState;
function useReducer(reducer, initialArg, init) {
    var dispatcher = resolveDispatcher();
    // @ts-ignore - types mismatch
    return dispatcher.useReducer(reducer, initialArg, init);
}
exports.useReducer = useReducer;
function useRef(initialValue) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useRef(initialValue);
}
exports.useRef = useRef;
function useEffect(create, deps) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useEffect(create, deps);
}
exports.useEffect = useEffect;
function useInsertionEffect(create, deps) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useInsertionEffect(create, deps);
}
exports.useInsertionEffect = useInsertionEffect;
function useLayoutEffect(create, deps) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useLayoutEffect(create, deps);
}
exports.useLayoutEffect = useLayoutEffect;
function useCallback(callback, deps) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useCallback(callback, deps);
}
exports.useCallback = useCallback;
function useMemo(create, deps) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useMemo(create, deps);
}
exports.useMemo = useMemo;
function useImperativeHandle(ref, create, deps) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useImperativeHandle(ref, create, deps);
}
exports.useImperativeHandle = useImperativeHandle;
function useDebugValue(value, format) {
    if (__DEV__) {
        var dispatcher = resolveDispatcher();
        return dispatcher.useDebugValue(value, format);
    }
}
exports.useDebugValue = useDebugValue;
function useTransition() {
    var dispatcher = resolveDispatcher();
    return dispatcher.useTransition();
}
exports.useTransition = useTransition;
function useDeferredValue(value, initialValue) {
    var dispatcher = resolveDispatcher();
    // @ts-ignore - types mismatch
    return dispatcher.useDeferredValue(value, initialValue);
}
exports.useDeferredValue = useDeferredValue;
function useId() {
    var dispatcher = resolveDispatcher();
    return dispatcher.useId();
}
exports.useId = useId;
function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
    var dispatcher = resolveDispatcher();
    return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
exports.useSyncExternalStore = useSyncExternalStore;
function useCacheRefresh(fetch, cachedValue) {
    var _a;
    var dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return (_a = dispatcher.useCacheRefresh) === null || _a === void 0 ? void 0 : _a.call(dispatcher, fetch, cachedValue);
}
exports.useCacheRefresh = useCacheRefresh;
function use(usable) {
    var dispatcher = resolveDispatcher();
    return dispatcher.use(usable);
}
exports.use = use;
function useMemoCache(size) {
    var _a;
    var dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return (_a = dispatcher.useMemoCache) === null || _a === void 0 ? void 0 : _a.call(dispatcher, size);
}
exports.useMemoCache = useMemoCache;
function useEffectEvent(callback) {
    var _a;
    var dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return (_a = dispatcher.useEffectEvent) === null || _a === void 0 ? void 0 : _a.call(dispatcher, callback);
}
exports.useEffectEvent = useEffectEvent;
function useOptimistic(passthrough, reducer) {
    var _a;
    var dispatcher = resolveDispatcher();
    // $FlowFixMe[not-a-function] This is unstable, thus optional
    return (_a = dispatcher.useOptimistic) === null || _a === void 0 ? void 0 : _a.call(dispatcher, passthrough, reducer);
}
exports.useOptimistic = useOptimistic;
