"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findInstanceBlockingTarget = exports.return_targetInst = exports.findInstanceBlockingEvent = void 0;
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_fiber_shell_hydration_1 = require("@zenflux/react-reconciler/src/react-fiber-shell-hydration");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var getEventTarget_1 = require("@zenflux/react-dom-bindings/src/events/getEventTarget");
function findInstanceBlockingEvent(nativeEvent) {
    var nativeEventTarget = (0, getEventTarget_1.default)(nativeEvent);
    return findInstanceBlockingTarget(nativeEventTarget);
}
exports.findInstanceBlockingEvent = findInstanceBlockingEvent;
exports.return_targetInst = null;
// Returns a SuspenseInstance or Container if it's blocked.
// The return_targetInst field above is conceptually part of the return value.
function findInstanceBlockingTarget(targetNode) {
    // TODO: Warn if _enabled is false.
    exports.return_targetInst = null;
    var targetInst = (0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(targetNode);
    if (targetInst !== null) {
        var nearestMounted = (0, react_fiber_tree_reflection_1.getNearestMountedFiber)(targetInst);
        if (nearestMounted === null) {
            // This tree has been unmounted already. Dispatch without a target.
            targetInst = null;
        }
        else {
            var tag = nearestMounted.tag;
            if (tag === work_tags_1.WorkTag.SuspenseComponent) {
                var instance = (0, react_fiber_tree_reflection_1.getSuspenseInstanceFromFiber)(nearestMounted);
                if (instance !== null) {
                    // Queue the event to be replayed later. Abort dispatching since we
                    // don't want this event dispatched twice through the event system.
                    // TODO: If this is the first discrete event in the queue. Schedule an increased
                    // priority for this boundary.
                    return instance;
                }
                // This shouldn't happen, something went wrong but to avoid blocking
                // the whole system, dispatch the event without a target.
                // TODO: Warn.
                targetInst = null;
            }
            else if (tag === work_tags_1.WorkTag.HostRoot) {
                var root = nearestMounted.stateNode;
                if ((0, react_fiber_shell_hydration_1.isRootDehydrated)(root)) {
                    // If this happens during a replay something went wrong and it might block
                    // the whole system.
                    return (0, react_fiber_tree_reflection_1.getContainerFromFiber)(nearestMounted);
                }
                targetInst = null;
            }
            else if (nearestMounted !== targetInst) {
                // If we get an event (ex: img onload) before committing that
                // component's mount, ignore it for now (that is, treat it as if it was an
                // event on a non-React tree). We might also consider queueing events and
                // dispatching them after the mount.
                targetInst = null;
            }
        }
    }
    exports.return_targetInst = targetInst;
    // We're not blocked on anything.
    return null;
}
exports.findInstanceBlockingTarget = findInstanceBlockingTarget;
