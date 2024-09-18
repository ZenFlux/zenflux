"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOffscreenComponent = void 0;
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_fiber_thenable_1 = require("@zenflux/react-reconciler/src/react-fiber-thenable");
var react_fiber_work_in_progress_ping_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress-ping");
function handleOffscreenComponent(sourceFiber, returnFiber, suspenseBoundary, root, rootRenderLanes, wakeable) {
    var halt = suspenseBoundary.mode & type_of_mode_1.TypeOfMode.ConcurrentMode;
    if (halt) {
        suspenseBoundary.flags |= fiber_flags_1.FiberFlags.ShouldCapture;
        var isSuspenseyResource = wakeable === react_fiber_thenable_1.noopSuspenseyCommitThenable;
        if (isSuspenseyResource) {
            suspenseBoundary.flags |= fiber_flags_1.FiberFlags.ScheduleRetry;
        }
        else {
            var offscreenQueue = suspenseBoundary.updateQueue;
            if (offscreenQueue === null) {
                suspenseBoundary.updateQueue = {
                    transitions: null,
                    markerInstances: null,
                    retryQueue: new Set([wakeable])
                };
            }
            else {
                var retryQueue = offscreenQueue.retryQueue;
                if (retryQueue === null) {
                    offscreenQueue.retryQueue = new Set([wakeable]);
                }
                else {
                    retryQueue.add(wakeable);
                }
            }
            (0, react_fiber_work_in_progress_ping_1.attachPingListener)(root, wakeable, rootRenderLanes);
        }
    }
    return halt;
}
exports.handleOffscreenComponent = handleOffscreenComponent;
