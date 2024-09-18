"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreStateIfNeeded = exports.needsStateRestore = exports.enqueueStateRestore = void 0;
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var ReactDOMTextarea_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMTextarea");
// Use to restore controlled state after a change event has fired.
var restoreTarget = null;
var restoreQueue = null;
function restoreStateOfTarget(target) {
    // We perform this translation at the end of the event loop so that we
    // always receive the correct fiber here
    var internalInstance = (0, ReactDOMComponentTree_1.getInstanceFromNode)(target);
    if (!internalInstance) {
        // Unmounted
        return;
    }
    var stateNode = internalInstance.stateNode;
    // Guard against Fiber being unmounted.
    if (stateNode) {
        var props = (0, ReactDOMComponentTree_1.getFiberCurrentPropsFromNode)(stateNode);
        (0, ReactDOMTextarea_1.restoreControlledState)(internalInstance.stateNode, internalInstance.type, props);
    }
}
function enqueueStateRestore(target) {
    if (restoreTarget) {
        if (restoreQueue) {
            restoreQueue.push(target);
        }
        else {
            restoreQueue = [target];
        }
    }
    else {
        restoreTarget = target;
    }
}
exports.enqueueStateRestore = enqueueStateRestore;
function needsStateRestore() {
    return restoreTarget !== null || restoreQueue !== null;
}
exports.needsStateRestore = needsStateRestore;
function restoreStateIfNeeded() {
    if (!restoreTarget) {
        return;
    }
    var target = restoreTarget;
    var queuedTargets = restoreQueue;
    restoreTarget = null;
    restoreQueue = null;
    restoreStateOfTarget(target);
    if (queuedTargets) {
        for (var i = 0; i < queuedTargets.length; i++) {
            restoreStateOfTarget(queuedTargets[i]);
        }
    }
}
exports.restoreStateIfNeeded = restoreStateIfNeeded;
