"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCurrentTreeHidden = exports.popHiddenContext = exports.reuseHiddenContextOnStack = exports.pushHiddenContext = exports.prevEntangledRenderLanesCursor = exports.currentTreeHiddenStackCursor = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_entangled_lane_1 = require("@zenflux/react-reconciler/src/react-entangled-lane");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_fiber_stack_1 = require("@zenflux/react-reconciler/src/react-fiber-stack");
// TODO: This isn't being used yet, but it's intended to replace the
// InvisibleParentContext that is currently managed by SuspenseContext.
exports.currentTreeHiddenStackCursor = (0, react_fiber_stack_1.createCursor)(null);
exports.prevEntangledRenderLanesCursor = (0, react_fiber_stack_1.createCursor)(fiber_lane_constants_1.NoLanes);
function pushHiddenContext(fiber, context) {
    var prevEntangledRenderLanes = (0, react_entangled_lane_1.getEntangledRenderLanes)();
    (0, react_fiber_stack_1.push)(exports.prevEntangledRenderLanesCursor, prevEntangledRenderLanes, fiber);
    (0, react_fiber_stack_1.push)(exports.currentTreeHiddenStackCursor, context, fiber);
    // When rendering a subtree that's currently hidden, we must include all
    // lanes that would have rendered if the hidden subtree hadn't been deferred.
    // That is, in order to reveal content from hidden -> visible, we must commit
    // all the updates that we skipped when we originally hid the tree.
    (0, react_entangled_lane_1.setEntangledRenderLanes)((0, react_fiber_lane_1.mergeLanes)(prevEntangledRenderLanes, context.baseLanes));
}
exports.pushHiddenContext = pushHiddenContext;
function reuseHiddenContextOnStack(fiber) {
    // This subtree is not currently hidden, so we don't need to add any lanes
    // to the render lanes. But we still need to push something to avoid a
    // context mismatch. Reuse the existing context on the stack.
    (0, react_fiber_stack_1.push)(exports.prevEntangledRenderLanesCursor, (0, react_entangled_lane_1.getEntangledRenderLanes)(), fiber);
    (0, react_fiber_stack_1.push)(exports.currentTreeHiddenStackCursor, exports.currentTreeHiddenStackCursor.current, fiber);
}
exports.reuseHiddenContextOnStack = reuseHiddenContextOnStack;
function popHiddenContext(fiber) {
    // Restore the previous render lanes from the stack
    (0, react_entangled_lane_1.setEntangledRenderLanes)(exports.prevEntangledRenderLanesCursor.current);
    (0, react_fiber_stack_1.pop)(exports.currentTreeHiddenStackCursor, fiber);
    (0, react_fiber_stack_1.pop)(exports.prevEntangledRenderLanesCursor, fiber);
}
exports.popHiddenContext = popHiddenContext;
function isCurrentTreeHidden() {
    return exports.currentTreeHiddenStackCursor.current !== null;
}
exports.isCurrentTreeHidden = isCurrentTreeHidden;
