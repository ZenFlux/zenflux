"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRemainOnPreviousScreen = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_entangled_lane_1 = require("@zenflux/react-reconciler/src/react-entangled-lane");
var react_fiber_suspense_context_1 = require("@zenflux/react-reconciler/src/react-fiber-suspense-context");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
function shouldRemainOnPreviousScreen() {
    // This is asking whether it's better to suspend the transition and remain
    // on the previous screen, versus showing a fallback as soon as possible. It
    // takes into account both the priority of render and also whether showing a
    // fallback would produce a desirable user experience.
    var handler = (0, react_fiber_suspense_context_1.getSuspenseHandler)();
    if (handler === null) {
        // There's no Suspense boundary that can provide a fallback. We have no
        // choice but to remain on the previous screen.
        // NOTE: We do this even for sync updates, for lack of any better option. In
        // the future, we may change how we handle this, like by putting the whole
        // root into a "detached" mode.
        return true;
    }
    // TODO: Once `use` has fully replaced the `throw promise` pattern, we should
    // be able to remove the equivalent check in finishConcurrentRender, and rely
    // just on this one.
    if ((0, fiber_lane_constants_1.includesOnlyTransitions)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)())) {
        if ((0, react_fiber_suspense_context_1.getShellBoundary)() === null) {
            // We're rendering inside the "shell" of the app. Activating the nearest
            // fallback would cause visible content to disappear. It's better to
            // suspend the transition and remain on the previous screen.
            return true;
        }
        else {
            // We're rendering content that wasn't part of the previous screen.
            // Rather than block the transition, it's better to show a fallback as
            // soon as possible. The appearance of any nested fallbacks will be
            // throttled to avoid jank.
            return false;
        }
    }
    if ((0, fiber_lane_constants_1.includesOnlyRetries)((0, react_fiber_work_in_progress_1.getWorkInProgressRootRenderLanes)())
        || // In this context, an OffscreenLane counts as a Retry
            // TODO: It's become increasingly clear that Retries and Offscreen are
            // deeply connected. They probably can be unified further.
            (0, react_fiber_lane_1.includesSomeLane)((0, react_entangled_lane_1.getEntangledRenderLanes)(), fiber_lane_constants_1.OffscreenLane)) {
        // During a retry, we can suspend rendering if the nearest Suspense boundary
        // is the boundary of the "shell", because we're guaranteed not to block
        // any new content from appearing.
        //
        // The reason we must check if this is a retry is because it guarantees
        // that suspending the work loop won't block an actual update, because
        // retries don't "update" anything; they fill in fallbacks that were left
        // behind by a previous transition.
        return handler === (0, react_fiber_suspense_context_1.getShellBoundary)();
    }
    // For all other Lanes besides Transitions and Retries, we should not wait
    // for the data to load.
    return false;
}
exports.shouldRemainOnPreviousScreen = shouldRemainOnPreviousScreen;
