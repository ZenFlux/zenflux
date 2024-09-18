"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSuspenseNoBoundary = void 0;
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var react_fiber_work_in_progress_ping_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-ping");
var react_fiber_work_in_progress_render_did_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-render-did");
function handleSuspenseNoBoundary(root, wakeable, rootRenderLanes) {
    var result;
    // No boundary was found. Unless this is a sync update, this is OK.
    // We can suspend and wait for more data to arrive.
    if (root.tag === root_tags_1.ConcurrentRoot) {
        // In a concurrent root, suspending without a Suspense boundary is
        // allowed. It will suspend indefinitely without committing.
        //
        // TODO: Should we have different behavior for discrete updates? What
        // about flushSync? Maybe it should put the tree into an inert state,
        // and potentially log a warning. Revisit this for a future release.
        (0, react_fiber_work_in_progress_ping_1.attachPingListener)(root, wakeable, rootRenderLanes);
        (0, react_fiber_work_in_progress_render_did_1.renderDidSuspendDelayIfPossible)();
    }
    else {
        // In a legacy root, suspending without a boundary is always an error.
        result = new Error("A component suspended while responding to synchronous input. This " + "will cause the UI to be replaced with a loading indicator. To " + "fix, updates that suspend should be wrapped " + "with startTransition.");
    }
    return result;
}
exports.handleSuspenseNoBoundary = handleSuspenseNoBoundary;
