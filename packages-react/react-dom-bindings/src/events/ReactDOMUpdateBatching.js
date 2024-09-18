"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discreteUpdates = exports.batchedUpdates = void 0;
/* eslint-disable import/no-cycle */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var react_fiber_reconciler_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler");
var ReactDOMControlledComponent_1 = require("@zenflux/react-dom-bindings/src/events/ReactDOMControlledComponent");
// Used as a way to call batchedUpdates when we don't have a reference to
// the renderer. Such as when we're dispatching events or if third party
// libraries need to call batchedUpdates. Eventually, this API will go away when
// everything is batched by default. We'll then have a similar API to opt-out of
// scheduled work and instead do synchronous work.
var isInsideEventHandler = false;
function finishEventHandler() {
    // Here we wait until all updates have propagated, which is important
    // when using controlled components within layers:
    // https://github.com/facebook/react/issues/1698
    // Then we restore state of any controlled component.
    var controlledComponentsHavePendingUpdates = (0, ReactDOMControlledComponent_1.needsStateRestore)();
    if (controlledComponentsHavePendingUpdates) {
        // If a controlled event was fired, we may need to restore the state of
        // the DOM node back to the controlled value. This is necessary when React
        // bails out of the update without touching the DOM.
        // TODO: Restore state in the microtask, after the discrete updates flush,
        // instead of early flushing them here.
        (0, react_fiber_reconciler_1.flushSync)();
        (0, ReactDOMControlledComponent_1.restoreStateIfNeeded)();
    }
}
function batchedUpdates(fn, a, b) {
    if (isInsideEventHandler) {
        // If we are currently inside another batch, we need to wait until it
        // fully completes before restoring state.
        return fn(a, b);
    }
    isInsideEventHandler = true;
    try {
        return (0, react_fiber_reconciler_1.batchedUpdates)(fn, a, b);
    }
    finally {
        isInsideEventHandler = false;
        finishEventHandler();
    }
}
exports.batchedUpdates = batchedUpdates;
// TODO: Replace with flushSync
function discreteUpdates(fn, a, b, c, d) {
    return (0, react_fiber_reconciler_1.discreteUpdates)(fn, a, b, c, d);
}
exports.discreteUpdates = discreteUpdates;
