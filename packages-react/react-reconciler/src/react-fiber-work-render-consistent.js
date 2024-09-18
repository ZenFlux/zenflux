"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRenderConsistentWithExternalStores = void 0;
var object_is_1 = require("@zenflux/react-shared/src/object-is");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
function isRenderConsistentWithExternalStores(finishedWork) {
    // Search the rendered tree for external store reads, and check whether the
    // stores were mutated in a concurrent event. Intentionally using an iterative
    // loop instead of recursion so we can exit early.
    var node = finishedWork;
    while (true) {
        if (node.flags & fiber_flags_1.FiberFlags.StoreConsistency) {
            var updateQueue = node.updateQueue;
            if (updateQueue !== null) {
                var checks = updateQueue.stores;
                if (checks !== null) {
                    for (var i = 0; i < checks.length; i++) {
                        var check = checks[i];
                        var getSnapshot = check.getSnapshot;
                        var renderedValue = check.value;
                        try {
                            if (!(0, object_is_1.default)(getSnapshot(), renderedValue)) {
                                // Found an inconsistent store.
                                return false;
                            }
                        }
                        catch (error) {
                            // If `getSnapshot` throws, return `false`. This will schedule
                            // a re-render, and the error will be rethrown during render.
                            return false;
                        }
                    }
                }
            }
        }
        var child = node.child;
        if (node.subtreeFlags & fiber_flags_1.FiberFlags.StoreConsistency && child !== null) {
            child.return = node;
            node = child;
            continue;
        }
        if (node === finishedWork) {
            return true;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === finishedWork) {
                return true;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
    // Flow doesn't know this is unreachable, but eslint does
    // eslint-disable-next-line no-unreachable
    return true;
}
exports.isRenderConsistentWithExternalStores = isRenderConsistentWithExternalStores;
