"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getText = exports.getData = exports.reset = exports.initialize = void 0;
/**
 * These variables store information about text content of a target node,
 * allowing comparison of content before and after a given event.
 *
 * Identify the node where selection currently begins, then observe
 * both its text content and its current position in the DOM. Since the
 * browser may natively replace the target node during composition, we can
 * use its position to find its replacement.
 *
 *
 */
var root = null;
var startText = null;
var fallbackText = null;
function initialize(nativeEventTarget) {
    root = nativeEventTarget;
    startText = getText();
    return true;
}
exports.initialize = initialize;
function reset() {
    root = null;
    startText = null;
    fallbackText = null;
}
exports.reset = reset;
function getData() {
    if (fallbackText) {
        return fallbackText;
    }
    var start;
    var startValue = startText;
    var startLength = startValue ? startValue.length : 0;
    var end;
    var endValue = getText();
    var endLength = endValue.length;
    for (start = 0; start < startLength; start++) {
        if (startValue[start] !== endValue[start]) {
            break;
        }
    }
    var minEnd = startLength - start;
    for (end = 1; end <= minEnd; end++) {
        if (startValue[startLength - end] !== endValue[endLength - end]) {
            break;
        }
    }
    var sliceTail = end > 1 ? 1 - end : undefined;
    fallbackText = endValue.slice(start, sliceTail);
    return fallbackText;
}
exports.getData = getData;
function getText() {
    if ("value" in root) {
        return root.value;
    }
    return root.textContent;
}
exports.getText = getText;
