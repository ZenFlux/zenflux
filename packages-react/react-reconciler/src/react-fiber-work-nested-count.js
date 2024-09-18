"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwIfInfiniteUpdateLoopDetected = exports.resetNestedRootWithPassiveNestedUpdates = exports.setNestedRootWithPassiveUpdate = exports.isNestedRootWithPassiveUpdate = exports.setNestedRootWithNestedUpdates = exports.isNestedRootWithNestedUpdates = exports.incrementNestedPassiveUpdateCount = exports.resetNestedPassiveUpdateCount = exports.isNestedUpdateLimitExceeded = exports.incrementNestedUpdateCount = exports.resetNestedUpdateCount = void 0;
// Use these to prevent an infinite loop of nested updates
var NESTED_UPDATE_LIMIT = 50;
var NESTED_PASSIVE_UPDATE_LIMIT = 50;
var nestedUpdateCount = 0;
var nestedPassiveUpdateCount = 0;
var rootWithNestedUpdates = null;
var rootWithPassiveNestedUpdates = null;
// ----
// Nested update count
// ----
function resetNestedUpdateCount() {
    nestedUpdateCount = 0;
}
exports.resetNestedUpdateCount = resetNestedUpdateCount;
function incrementNestedUpdateCount() {
    nestedUpdateCount++;
}
exports.incrementNestedUpdateCount = incrementNestedUpdateCount;
function isNestedUpdateLimitExceeded() {
    return nestedUpdateCount > NESTED_UPDATE_LIMIT;
}
exports.isNestedUpdateLimitExceeded = isNestedUpdateLimitExceeded;
// ----
// Nested passive update count
// ----
function resetNestedPassiveUpdateCount() {
    nestedPassiveUpdateCount = 0;
}
exports.resetNestedPassiveUpdateCount = resetNestedPassiveUpdateCount;
function incrementNestedPassiveUpdateCount() {
    nestedPassiveUpdateCount++;
}
exports.incrementNestedPassiveUpdateCount = incrementNestedPassiveUpdateCount;
// ----
// Root with nested updates
// ----
function isNestedRootWithNestedUpdates(root) {
    return root === rootWithNestedUpdates;
}
exports.isNestedRootWithNestedUpdates = isNestedRootWithNestedUpdates;
function setNestedRootWithNestedUpdates(root) {
    rootWithNestedUpdates = root;
}
exports.setNestedRootWithNestedUpdates = setNestedRootWithNestedUpdates;
// ----
// Root with nested passive updates
// ----
function isNestedRootWithPassiveUpdate(root) {
    return root === rootWithPassiveNestedUpdates;
}
exports.isNestedRootWithPassiveUpdate = isNestedRootWithPassiveUpdate;
function setNestedRootWithPassiveUpdate(root) {
    rootWithPassiveNestedUpdates = root;
}
exports.setNestedRootWithPassiveUpdate = setNestedRootWithPassiveUpdate;
function resetNestedRootWithPassiveNestedUpdates() {
    rootWithPassiveNestedUpdates = null;
}
exports.resetNestedRootWithPassiveNestedUpdates = resetNestedRootWithPassiveNestedUpdates;
function throwIfInfiniteUpdateLoopDetected() {
    if (isNestedUpdateLimitExceeded()) {
        resetNestedUpdateCount();
        nestedPassiveUpdateCount = 0;
        rootWithNestedUpdates = null;
        rootWithPassiveNestedUpdates = null;
        throw new Error("Maximum update depth exceeded. This can happen when a component " + "repeatedly calls setState inside componentWillUpdate or " + "componentDidUpdate. React limits the number of nested updates to " + "prevent infinite loops.");
    }
    if (__DEV__) {
        if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
            nestedPassiveUpdateCount = 0;
            rootWithPassiveNestedUpdates = null;
            console.error("Maximum update depth exceeded. This can happen when a component " + "calls setState inside useEffect, but useEffect either doesn't " + "have a dependency array, or one of the dependencies changes on " + "every render.");
        }
    }
}
exports.throwIfInfiniteUpdateLoopDetected = throwIfInfiniteUpdateLoopDetected;
