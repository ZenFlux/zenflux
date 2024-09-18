"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentHoistableRoot = exports.getCurrentHoistableRootSafe = exports.getCurrentHoistableRoot = void 0;
var currentHoistableRoot = null;
function getCurrentHoistableRoot() {
    return currentHoistableRoot;
}
exports.getCurrentHoistableRoot = getCurrentHoistableRoot;
function getCurrentHoistableRootSafe() {
    return currentHoistableRoot;
}
exports.getCurrentHoistableRootSafe = getCurrentHoistableRootSafe;
function setCurrentHoistableRoot(root) {
    currentHoistableRoot = root;
}
exports.setCurrentHoistableRoot = setCurrentHoistableRoot;
