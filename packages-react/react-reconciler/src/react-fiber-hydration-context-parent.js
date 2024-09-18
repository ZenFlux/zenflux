"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasHydrationParentFiber = exports.clearHydrationParentFiber = exports.getHydrationParentFiberSafe = exports.getHydrationParentFiber = exports.setHydrationParentFiber = void 0;
var hydrationParentFiber = null;
function setHydrationParentFiber(fiber) {
    hydrationParentFiber = fiber;
}
exports.setHydrationParentFiber = setHydrationParentFiber;
function getHydrationParentFiber() {
    return hydrationParentFiber;
}
exports.getHydrationParentFiber = getHydrationParentFiber;
function getHydrationParentFiberSafe() {
    return hydrationParentFiber;
}
exports.getHydrationParentFiberSafe = getHydrationParentFiberSafe;
function clearHydrationParentFiber() {
    hydrationParentFiber = null;
}
exports.clearHydrationParentFiber = clearHydrationParentFiber;
function hasHydrationParentFiber() {
    return !!hydrationParentFiber;
}
exports.hasHydrationParentFiber = hasHydrationParentFiber;
