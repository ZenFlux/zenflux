"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetChildReconcilerOnUnwind = void 0;
var react_fiber_child_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-child-shared");
function resetChildReconcilerOnUnwind() {
    // On unwind, clear any pending thenables that were used.
    react_fiber_child_shared_1.ReactChildFiberCurrent.thenableState = null;
    react_fiber_child_shared_1.ReactChildFiberCurrent.thenableIndexCounter = 0;
}
exports.resetChildReconcilerOnUnwind = resetChildReconcilerOnUnwind;
