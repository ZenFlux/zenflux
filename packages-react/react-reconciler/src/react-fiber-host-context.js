"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushHostContext = exports.pushHostContainer = exports.popHostContext = exports.popHostContainer = exports.getRootHostContainer = exports.getCurrentRootHostContainer = exports.getHostContext = exports.getHostTransitionProvider = exports.HostTransitionContext = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var react_fiber_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-stack");
var _a = globalThis.__RECONCILER__CONFIG__, getChildHostContext = _a.getChildHostContext, getRootHostContext = _a.getRootHostContext, isPrimaryRenderer = _a.isPrimaryRenderer;
var contextStackCursor = (0, react_fiber_stack_1.createCursor)(null);
var contextFiberStackCursor = (0, react_fiber_stack_1.createCursor)(null);
var rootInstanceStackCursor = (0, react_fiber_stack_1.createCursor)(null);
// Represents the nearest host transition provider (in React DOM, a <form />)
// NOTE: Since forms cannot be nested, and this feature is only implemented by
// React DOM, we don't technically need this to be a stack. It could be a single
// module variable instead.
var hostTransitionProviderCursor = (0, react_fiber_stack_1.createCursor)(null);
// TODO: This should initialize to NotPendingTransition, a constant
// imported from the fiber config. However, because of a cycle in the module
// graph, that value isn't defined during this module's initialization. I can't
// think of a way to work around this without moving that value out of the
// fiber config. For now, the "no provider" case is handled when reading,
// inside useHostTransitionStatus.
exports.HostTransitionContext = {
    $$typeof: react_symbols_1.REACT_CONTEXT_TYPE,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0,
    Provider: null,
    Consumer: null,
    _defaultValue: null,
    _globalName: null
};
function requiredContext(c) {
    if (__DEV__) {
        if (c === null) {
            console.error("Expected host context to exist. This error is likely caused by a bug " + "in React. Please file an issue.");
        }
    }
    return c;
}
function getCurrentRootHostContainer() {
    return rootInstanceStackCursor.current;
}
exports.getCurrentRootHostContainer = getCurrentRootHostContainer;
function getRootHostContainer() {
    return requiredContext(rootInstanceStackCursor.current);
}
exports.getRootHostContainer = getRootHostContainer;
function getHostTransitionProvider() {
    return hostTransitionProviderCursor.current;
}
exports.getHostTransitionProvider = getHostTransitionProvider;
function pushHostContainer(fiber, nextRootInstance) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    (0, react_fiber_stack_1.push)(rootInstanceStackCursor, nextRootInstance, fiber);
    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    (0, react_fiber_stack_1.push)(contextFiberStackCursor, fiber, fiber);
    // Finally, we need to push the host context to the stack.
    // However, we can't just call getRootHostContext() and push it because
    // we'd have a different number of entries on the stack depending on
    // whether getRootHostContext() throws somewhere in renderer code or not.
    // So we push an empty value first. This lets us safely unwind on errors.
    (0, react_fiber_stack_1.push)(contextStackCursor, null, fiber);
    var nextRootContext = getRootHostContext(nextRootInstance);
    // Now we know this function doesn't throw, replace it.
    (0, react_fiber_stack_1.pop)(contextStackCursor, fiber);
    (0, react_fiber_stack_1.push)(contextStackCursor, nextRootContext, fiber);
}
exports.pushHostContainer = pushHostContainer;
function popHostContainer(fiber) {
    (0, react_fiber_stack_1.pop)(contextStackCursor, fiber);
    (0, react_fiber_stack_1.pop)(contextFiberStackCursor, fiber);
    (0, react_fiber_stack_1.pop)(rootInstanceStackCursor, fiber);
}
exports.popHostContainer = popHostContainer;
function getHostContext() {
    return requiredContext(contextStackCursor.current);
}
exports.getHostContext = getHostContext;
function pushHostContext(fiber) {
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        var stateHook = fiber.memoizedState;
        if (stateHook !== null) {
            // Only provide context if this fiber has been upgraded by a host
            // transition. We use the same optimization for regular host context below.
            (0, react_fiber_stack_1.push)(hostTransitionProviderCursor, fiber, fiber);
        }
    }
    var context = requiredContext(contextStackCursor.current);
    var nextContext = getChildHostContext(context, fiber.type);
    // Don't push this Fiber's context unless it's unique.
    if (context !== nextContext) {
        // Track the context and the Fiber that provided it.
        // This enables us to pop only Fibers that provide unique contexts.
        (0, react_fiber_stack_1.push)(contextFiberStackCursor, fiber, fiber);
        (0, react_fiber_stack_1.push)(contextStackCursor, nextContext, fiber);
    }
}
exports.pushHostContext = pushHostContext;
function popHostContext(fiber) {
    if (contextFiberStackCursor.current === fiber) {
        // Do not pop unless this Fiber provided the current context.
        // pushHostContext() only pushes Fibers that provide unique contexts.
        (0, react_fiber_stack_1.pop)(contextStackCursor, fiber);
        (0, react_fiber_stack_1.pop)(contextFiberStackCursor, fiber);
    }
    if (react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions) {
        if (hostTransitionProviderCursor.current === fiber) {
            // Do not pop unless this Fiber provided the current context. This is mostly
            // a performance optimization, but conveniently it also prevents a potential
            // data race where a host provider is upgraded (i.e. memoizedState becomes
            // non-null) during a concurrent event. This is a bit of a flaw in the way
            // we upgrade host components, but because we're accounting for it here, it
            // should be fine.
            (0, react_fiber_stack_1.pop)(hostTransitionProviderCursor, fiber);
            // When popping the transition provider, we reset the context value back
            // to `null`. We can do this because you're not allowd to nest forms. If
            // we allowed for multiple nested host transition providers, then we'd
            // need to reset this to the parent provider's status.
            if (isPrimaryRenderer) {
                exports.HostTransitionContext._currentValue = null;
            }
            else {
                exports.HostTransitionContext._currentValue2 = null;
            }
        }
    }
}
exports.popHostContext = popHostContext;
