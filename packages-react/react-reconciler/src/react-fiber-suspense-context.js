"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popSuspenseListContext = exports.pushSuspenseListContext = exports.setShallowSuspenseListContext = exports.setDefaultShallowSuspenseListContext = exports.hasSuspenseListContext = exports.suspenseStackCursor = exports.ForceSuspenseFallback = exports.popSuspenseHandler = exports.getSuspenseHandler = exports.reuseSuspenseHandlerOnStack = exports.pushOffscreenSuspenseHandler = exports.pushFallbackTreeSuspenseHandler = exports.pushPrimaryTreeSuspenseHandler = exports.getShellBoundary = void 0;
/* eslint-disable import/no-cycle */
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_fiber_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-stack");
var react_fiber_hidden_context_1 = require("@zenflux/react-reconciler/src/react-fiber-hidden-context");
// The Suspense handler is the boundary that should capture if something
// suspends, i.e. it's the nearest `catch` block on the stack.
var suspenseHandlerStackCursor = (0, react_fiber_stack_1.createCursor)(null);
// Represents the outermost boundary that is not visible in the current tree.
// Everything above this is the "shell". When this is null, it means we're
// rendering in the shell of the app. If it's non-null, it means we're rendering
// deeper than the shell, inside a new tree that wasn't already visible.
//
// The main way we use this concept is to determine whether showing a fallback
// would result in a desirable or undesirable loading state. Activing a fallback
// in the shell is considered an undersirable loading state, because it would
// mean hiding visible (albeit stale) content in the current tree — we prefer to
// show the stale content, rather than switch to a fallback. But showing a
// fallback in a new tree is fine, because there's no stale content to
// prefer instead.
var shellBoundary = null;
function getShellBoundary() {
    return shellBoundary;
}
exports.getShellBoundary = getShellBoundary;
function pushPrimaryTreeSuspenseHandler(handler) {
    // TODO: Pass as argument
    var current = handler.alternate;
    var props = handler.pendingProps;
    // Shallow Suspense context fields, like ForceSuspenseFallback, should only be
    // propagated a single level. For example, when ForceSuspenseFallback is set,
    // it should only force the nearest Suspense boundary into fallback mode.
    pushSuspenseListContext(handler, setDefaultShallowSuspenseListContext(exports.suspenseStackCursor.current));
    // Experimental feature: Some Suspense boundaries are marked as having an
    // undesirable fallback state. These have special behavior where we only
    // activate the fallback if there's no other boundary on the stack that we can
    // use instead.
    if (react_feature_flags_1.enableSuspenseAvoidThisFallback && props.unstable_avoidThisFallback === true && ( // If an avoided boundary is already visible, it behaves identically to
    // a regular Suspense boundary.
    current === null || (0, react_fiber_hidden_context_1.isCurrentTreeHidden)())) {
        if (shellBoundary === null) {
            // We're rendering in the shell. There's no parent Suspense boundary that
            // can provide a desirable fallback state. We'll use this boundary.
            (0, react_fiber_stack_1.push)(suspenseHandlerStackCursor, handler, handler); // However, because this is not a desirable fallback, the children are
            // still considered part of the shell. So we intentionally don't assign
            // to `shellBoundary`.
        }
        else {
            // There's already a parent Suspense boundary that can provide a desirable
            // fallback state. Prefer that one.
            var handlerOnStack = suspenseHandlerStackCursor.current;
            (0, react_fiber_stack_1.push)(suspenseHandlerStackCursor, handlerOnStack, handler);
        }
        return;
    }
    // TODO: If the parent Suspense handler already suspended, there's no reason
    // to push a nested Suspense handler, because it will get replaced by the
    // outer fallback, anyway. Consider this as a future optimization.
    (0, react_fiber_stack_1.push)(suspenseHandlerStackCursor, handler, handler);
    if (shellBoundary === null) {
        if (current === null || (0, react_fiber_hidden_context_1.isCurrentTreeHidden)()) {
            // This boundary is not visible in the current UI.
            shellBoundary = handler;
        }
        else {
            var prevState = current.memoizedState;
            if (prevState !== null) {
                // This boundary is showing a fallback in the current UI.
                shellBoundary = handler;
            }
        }
    }
}
exports.pushPrimaryTreeSuspenseHandler = pushPrimaryTreeSuspenseHandler;
function pushFallbackTreeSuspenseHandler(fiber) {
    // We're about to render the fallback. If something in the fallback suspends,
    // it's akin to throwing inside a `catch` block. This boundary should not
    // capture. Reuse the existing handler on the stack.
    reuseSuspenseHandlerOnStack(fiber);
}
exports.pushFallbackTreeSuspenseHandler = pushFallbackTreeSuspenseHandler;
function pushOffscreenSuspenseHandler(fiber) {
    if (fiber.tag === work_tags_1.WorkTag.OffscreenComponent) {
        // A SuspenseList context is only pushed here to avoid a push/pop mismatch.
        // Reuse the current value on the stack.
        // TODO: We can avoid needing to push here by by forking popSuspenseHandler
        // into separate functions for Suspense and Offscreen.
        pushSuspenseListContext(fiber, exports.suspenseStackCursor.current);
        (0, react_fiber_stack_1.push)(suspenseHandlerStackCursor, fiber, fiber);
        if (shellBoundary !== null) { // A parent boundary is showing a fallback, so we've already rendered
            // deeper than the shell.
        }
        else {
            var current = fiber.alternate;
            if (current !== null) {
                var prevState = current.memoizedState;
                if (prevState !== null) {
                    // This is the first boundary in the stack that's already showing
                    // a fallback. So everything outside is considered the shell.
                    shellBoundary = fiber;
                }
            }
        }
    }
    else {
        // This is a LegacyHidden component.
        reuseSuspenseHandlerOnStack(fiber);
    }
}
exports.pushOffscreenSuspenseHandler = pushOffscreenSuspenseHandler;
function reuseSuspenseHandlerOnStack(fiber) {
    pushSuspenseListContext(fiber, exports.suspenseStackCursor.current);
    (0, react_fiber_stack_1.push)(suspenseHandlerStackCursor, getSuspenseHandler(), fiber);
}
exports.reuseSuspenseHandlerOnStack = reuseSuspenseHandlerOnStack;
function getSuspenseHandler() {
    return suspenseHandlerStackCursor.current;
}
exports.getSuspenseHandler = getSuspenseHandler;
function popSuspenseHandler(fiber) {
    (0, react_fiber_stack_1.pop)(suspenseHandlerStackCursor, fiber);
    if (shellBoundary === fiber) {
        // Popping back into the shell.
        shellBoundary = null;
    }
    popSuspenseListContext(fiber);
}
exports.popSuspenseHandler = popSuspenseHandler;
var DefaultSuspenseContext = 0;
var SubtreeSuspenseContextMask = 1;
// ForceSuspenseFallback can be used by SuspenseList to force newly added
// items into their fallback state during one of the render passes.
exports.ForceSuspenseFallback = 2;
exports.suspenseStackCursor = (0, react_fiber_stack_1.createCursor)(DefaultSuspenseContext);
function hasSuspenseListContext(parentContext, flag) {
    return (parentContext & flag) !== 0;
}
exports.hasSuspenseListContext = hasSuspenseListContext;
function setDefaultShallowSuspenseListContext(parentContext) {
    return parentContext & SubtreeSuspenseContextMask;
}
exports.setDefaultShallowSuspenseListContext = setDefaultShallowSuspenseListContext;
function setShallowSuspenseListContext(parentContext, shallowContext) {
    return parentContext & SubtreeSuspenseContextMask | shallowContext;
}
exports.setShallowSuspenseListContext = setShallowSuspenseListContext;
function pushSuspenseListContext(fiber, newContext) {
    (0, react_fiber_stack_1.push)(exports.suspenseStackCursor, newContext, fiber);
}
exports.pushSuspenseListContext = pushSuspenseListContext;
function popSuspenseListContext(fiber) {
    (0, react_fiber_stack_1.pop)(exports.suspenseStackCursor, fiber);
}
exports.popSuspenseListContext = popSuspenseListContext;
