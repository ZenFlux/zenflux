"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSuspendedWorkLoopOnUnwind = void 0;
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_hooks_unwind_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-unwind");
var react_fiber_child_rest_reconciler_on_unwind_1 = require("@zenflux/react-reconciler/src/react-fiber-child-rest-reconciler-on-unwind");
function resetSuspendedWorkLoopOnUnwind(fiber) {
    // Reset module-level state that was set during the render phase.
    (0, react_fiber_new_context_1.resetContextDependencies)();
    (0, react_fiber_hooks_unwind_1.resetHooksOnUnwind)(fiber);
    (0, react_fiber_child_rest_reconciler_on_unwind_1.resetChildReconcilerOnUnwind)();
}
exports.resetSuspendedWorkLoopOnUnwind = resetSuspendedWorkLoopOnUnwind;
