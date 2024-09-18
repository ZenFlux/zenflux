"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetStackAfterFatalErrorInDev = exports.checkThatStackIsEmpty = exports.push = exports.pop = exports.isEmpty = exports.createCursor = void 0;
var valueStack = [];
var fiberStack;
if (__DEV__) {
    fiberStack = [];
}
var index = -1;
function createCursor(defaultValue) {
    return {
        current: defaultValue
    };
}
exports.createCursor = createCursor;
function isEmpty() {
    return index === -1;
}
exports.isEmpty = isEmpty;
function pop(cursor, fiber) {
    if (index < 0) {
        if (__DEV__) {
            console.error("Unexpected pop.");
        }
        return;
    }
    if (__DEV__) {
        if (fiber !== fiberStack[index]) {
            console.error("Unexpected Fiber popped.");
        }
    }
    cursor.current = valueStack[index];
    valueStack[index] = null;
    if (__DEV__) {
        fiberStack[index] = null;
    }
    index--;
}
exports.pop = pop;
function push(cursor, value, fiber) {
    index++;
    valueStack[index] = cursor.current;
    if (__DEV__) {
        fiberStack[index] = fiber;
    }
    cursor.current = value;
}
exports.push = push;
function checkThatStackIsEmpty() {
    if (__DEV__) {
        if (index !== -1) {
            console.error("Expected an empty stack. Something was not reset properly.");
        }
    }
}
exports.checkThatStackIsEmpty = checkThatStackIsEmpty;
function resetStackAfterFatalErrorInDev() {
    if (__DEV__) {
        index = -1;
        valueStack.length = 0;
        fiberStack.length = 0;
    }
}
exports.resetStackAfterFatalErrorInDev = resetStackAfterFatalErrorInDev;
