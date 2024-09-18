"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferActualDuration = exports.syncNestedUpdateFlag = exports.stopProfilerTimerIfRunningAndRecordDelta = exports.stopProfilerTimerIfRunning = exports.startProfilerTimer = exports.startPassiveEffectTimer = exports.startLayoutEffectTimer = exports.resetNestedUpdateFlag = exports.recordPassiveEffectDuration = exports.recordLayoutEffectDuration = exports.recordCommitTime = exports.markNestedUpdateScheduled = exports.isCurrentUpdateNested = exports.getCommitTime = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var Scheduler = require("@zenflux/react-scheduler");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var now = Scheduler.unstable_now;
var commitTime = 0;
var layoutEffectStartTime = -1;
var profilerStartTime = -1;
var passiveEffectStartTime = -1;
/**
 * Tracks whether the current update was a nested/cascading update (scheduled from a layout effect).
 *
 * The overall sequence is:
 *   1. render
 *   2. commit (and call `onRender`, `onCommit`)
 *   3. check for nested updates
 *   4. flush passive effects (and call `onPostCommit`)
 *
 * Nested updates are identified in step 3 above,
 * but step 4 still applies to the work that was just committed.
 * We use two flags to track nested updates then:
 * one tracks whether the upcoming update is a nested update,
 * and the other tracks whether the current update was a nested update.
 * The first value gets synced to the second at the start of the render phase.
 */
var currentUpdateIsNested = false;
var nestedUpdateScheduled = false;
function isCurrentUpdateNested() {
    return currentUpdateIsNested;
}
exports.isCurrentUpdateNested = isCurrentUpdateNested;
function markNestedUpdateScheduled() {
    if (react_feature_flags_1.enableProfilerNestedUpdatePhase) {
        nestedUpdateScheduled = true;
    }
}
exports.markNestedUpdateScheduled = markNestedUpdateScheduled;
function resetNestedUpdateFlag() {
    if (react_feature_flags_1.enableProfilerNestedUpdatePhase) {
        currentUpdateIsNested = false;
        nestedUpdateScheduled = false;
    }
}
exports.resetNestedUpdateFlag = resetNestedUpdateFlag;
function syncNestedUpdateFlag() {
    if (react_feature_flags_1.enableProfilerNestedUpdatePhase) {
        currentUpdateIsNested = nestedUpdateScheduled;
        nestedUpdateScheduled = false;
    }
}
exports.syncNestedUpdateFlag = syncNestedUpdateFlag;
function getCommitTime() {
    return commitTime;
}
exports.getCommitTime = getCommitTime;
function recordCommitTime() {
    if (!react_feature_flags_1.enableProfilerTimer) {
        return;
    }
    commitTime = now();
}
exports.recordCommitTime = recordCommitTime;
function startProfilerTimer(fiber) {
    if (!react_feature_flags_1.enableProfilerTimer) {
        return;
    }
    profilerStartTime = now();
    if (fiber.actualStartTime < 0) {
        fiber.actualStartTime = now();
    }
}
exports.startProfilerTimer = startProfilerTimer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function stopProfilerTimerIfRunning(fiber) {
    if (!react_feature_flags_1.enableProfilerTimer) {
        return;
    }
    profilerStartTime = -1;
}
exports.stopProfilerTimerIfRunning = stopProfilerTimerIfRunning;
function stopProfilerTimerIfRunningAndRecordDelta(fiber, overrideBaseTime) {
    if (!react_feature_flags_1.enableProfilerTimer) {
        return;
    }
    if (profilerStartTime >= 0) {
        var elapsedTime = now() - profilerStartTime;
        // @ts-ignore
        fiber.actualDuration += elapsedTime;
        if (overrideBaseTime) {
            fiber.selfBaseDuration = elapsedTime;
        }
        profilerStartTime = -1;
    }
}
exports.stopProfilerTimerIfRunningAndRecordDelta = stopProfilerTimerIfRunningAndRecordDelta;
function recordLayoutEffectDuration(fiber) {
    if (!react_feature_flags_1.enableProfilerTimer || !react_feature_flags_1.enableProfilerCommitHooks) {
        return;
    }
    if (layoutEffectStartTime >= 0) {
        var elapsedTime = now() - layoutEffectStartTime;
        layoutEffectStartTime = -1;
        // Store duration on the next nearest Profiler ancestor
        // Or the root (for the DevTools Profiler to read)
        var parentFiber = fiber.return;
        while (parentFiber !== null) {
            switch (parentFiber.tag) {
                case work_tags_1.WorkTag.HostRoot:
                    var root = parentFiber.stateNode;
                    root.effectDuration += elapsedTime;
                    return;
                case work_tags_1.WorkTag.Profiler:
                    var parentStateNode = parentFiber.stateNode;
                    parentStateNode.effectDuration += elapsedTime;
                    return;
            }
            parentFiber = parentFiber.return;
        }
    }
}
exports.recordLayoutEffectDuration = recordLayoutEffectDuration;
function recordPassiveEffectDuration(fiber) {
    if (!react_feature_flags_1.enableProfilerTimer || !react_feature_flags_1.enableProfilerCommitHooks) {
        return;
    }
    if (passiveEffectStartTime >= 0) {
        var elapsedTime = now() - passiveEffectStartTime;
        passiveEffectStartTime = -1;
        // Store duration on the next nearest Profiler ancestor
        // Or the root (for the DevTools Profiler to read)
        var parentFiber = fiber.return;
        while (parentFiber !== null) {
            switch (parentFiber.tag) {
                case work_tags_1.WorkTag.HostRoot:
                    var root = parentFiber.stateNode;
                    if (root !== null) {
                        root.passiveEffectDuration += elapsedTime;
                    }
                    return;
                case work_tags_1.WorkTag.Profiler:
                    var parentStateNode = parentFiber.stateNode;
                    if (parentStateNode !== null) {
                        // Detached fibers have their state node cleared out.
                        // In this case, the return pointer is also cleared out,
                        // so we won't be able to report the time spent in this Profiler's subtree.
                        parentStateNode.passiveEffectDuration += elapsedTime;
                    }
                    return;
            }
            parentFiber = parentFiber.return;
        }
    }
}
exports.recordPassiveEffectDuration = recordPassiveEffectDuration;
function startLayoutEffectTimer() {
    if (!react_feature_flags_1.enableProfilerTimer || !react_feature_flags_1.enableProfilerCommitHooks) {
        return;
    }
    layoutEffectStartTime = now();
}
exports.startLayoutEffectTimer = startLayoutEffectTimer;
function startPassiveEffectTimer() {
    if (!react_feature_flags_1.enableProfilerTimer || !react_feature_flags_1.enableProfilerCommitHooks) {
        return;
    }
    passiveEffectStartTime = now();
}
exports.startPassiveEffectTimer = startPassiveEffectTimer;
function transferActualDuration(fiber) {
    // Transfer time spent rendering these children so we don't lose it
    // after we rerender. This is used as a helper in special cases
    // where we should count the work of multiple passes.
    var child = fiber.child;
    while (child) {
        // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
        // @ts-ignore
        fiber.actualDuration += child.actualDuration;
        child = child.sibling;
    }
}
exports.transferActualDuration = transferActualDuration;
