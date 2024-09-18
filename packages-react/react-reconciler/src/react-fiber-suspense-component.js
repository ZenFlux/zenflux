"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFirstSuspended = void 0;
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var _a = globalThis.__RECONCILER__CONFIG__, isSuspenseInstancePending = _a.isSuspenseInstancePending, isSuspenseInstanceFallback = _a.isSuspenseInstanceFallback;
function findFirstSuspended(row) {
    var node = row;
    while (node !== null) {
        if (node.tag === work_tags_1.WorkTag.SuspenseComponent) {
            var state = node.memoizedState;
            if (state !== null) {
                var dehydrated = state.dehydrated;
                if (dehydrated === null || isSuspenseInstancePending(dehydrated) || isSuspenseInstanceFallback(dehydrated)) {
                    return node;
                }
            }
        }
        else if (node.tag === work_tags_1.WorkTag.SuspenseListComponent && // revealOrder undefined can't be trusted because it don't
            // keep track of whether it suspended or not.
            node.memoizedProps.revealOrder !== undefined) {
            var didSuspend = (node.flags & fiber_flags_1.FiberFlags.DidCapture) !== fiber_flags_1.FiberFlags.NoFlags;
            if (didSuspend) {
                return node;
            }
        }
        else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === row) {
            return null;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === row) {
                return null;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
    return null;
}
exports.findFirstSuspended = findFirstSuspended;
