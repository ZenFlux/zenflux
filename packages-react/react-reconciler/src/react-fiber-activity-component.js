"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOffscreenManual = void 0;
function isOffscreenManual(offscreenFiber) {
    return offscreenFiber.memoizedProps !== null && offscreenFiber.memoizedProps.mode === "manual";
}
exports.isOffscreenManual = isOffscreenManual;
