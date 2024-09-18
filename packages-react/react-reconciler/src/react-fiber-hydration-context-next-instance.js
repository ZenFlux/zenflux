"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearNextHydratableInstance = exports.hasNextHydratableInstance = exports.setNextHydratableInstance = exports.getNextHydratableInstanceSafe = exports.getNextHydratableInstance = void 0;
var nextHydratableInstance = null;
function getNextHydratableInstance() {
    return nextHydratableInstance;
}
exports.getNextHydratableInstance = getNextHydratableInstance;
function getNextHydratableInstanceSafe() {
    return nextHydratableInstance;
}
exports.getNextHydratableInstanceSafe = getNextHydratableInstanceSafe;
function setNextHydratableInstance(nextInstance) {
    nextHydratableInstance = nextInstance;
}
exports.setNextHydratableInstance = setNextHydratableInstance;
function hasNextHydratableInstance() {
    return nextHydratableInstance !== null;
}
exports.hasNextHydratableInstance = hasNextHydratableInstance;
function clearNextHydratableInstance() {
    nextHydratableInstance = null;
}
exports.clearNextHydratableInstance = clearNextHydratableInstance;
