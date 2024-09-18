"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accumulateSuspenseyCommit = exports.isSuspenseBoundaryBeingHidden = exports.commitPlacement = exports.commitAttachRef = exports.reportUncaughtErrorInDEV = exports.restorePendingUpdaters = exports.shouldProfile = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_error_utils_1 = require("@zenflux/react-shared/src/react-error-utils");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_lane_1 = require("@zenflux/react-reconciler/src/react-fiber-lane");
var react_profile_timer_1 = require("@zenflux/react-reconciler/src/react-profile-timer");
var react_fiber_dev_tools_hook_1 = require("@zenflux/react-reconciler/src/react-fiber-dev-tools-hook");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_commit_current_hoistable_root_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-current-hoistable-root");
var _a = globalThis.__RECONCILER__CONFIG__, appendChild = _a.appendChild, appendChildToContainer = _a.appendChildToContainer, getHoistableRoot = _a.getHoistableRoot, getPublicInstance = _a.getPublicInstance, insertBefore = _a.insertBefore, insertInContainerBefore = _a.insertInContainerBefore, resetTextContent = _a.resetTextContent, supportsMutation = _a.supportsMutation, supportsResources = _a.supportsResources, supportsSingletons = _a.supportsSingletons, suspendInstance = _a.suspendInstance, suspendResource = _a.suspendResource;
function shouldProfile(current) {
    return react_feature_flags_1.enableProfilerTimer &&
        react_feature_flags_1.enableProfilerCommitHooks &&
        (current.mode & type_of_mode_1.TypeOfMode.ProfileMode) !== type_of_mode_1.TypeOfMode.NoMode &&
        (0, react_fiber_work_excution_context_1.isExecutionContextCommitDeactivate)();
}
exports.shouldProfile = shouldProfile;
function restorePendingUpdaters(root, lanes) {
    if (react_feature_flags_1.enableUpdaterTracking) {
        if (react_fiber_dev_tools_hook_1.isDevToolsPresent) {
            var memoizedUpdaters = root.memoizedUpdaters;
            memoizedUpdaters.forEach(function (schedulingFiber) {
                (0, react_fiber_lane_1.addFiberToLanesMap)(root, schedulingFiber, lanes);
            }); // This function intentionally does not clear memoized updaters.
            // Those may still be relevant to the current commit
            // and a future one (e.g. Suspense).
        }
    }
}
exports.restorePendingUpdaters = restorePendingUpdaters;
function reportUncaughtErrorInDEV(error) {
    // Wrapping each small part of the commit phase into a guarded
    // callback is a bit too slow (https://github.com/facebook/react/pull/21666).
    // But we rely on it to surface errors to DEV tools like overlays
    // (https://github.com/facebook/react/issues/21712).
    // As a compromise, rethrow only caught errors in a guard.
    if (__DEV__) {
        (0, react_error_utils_1.invokeGuardedCallback)(null, function () {
            throw error;
        });
        (0, react_error_utils_1.clearCaughtError)();
    }
}
exports.reportUncaughtErrorInDEV = reportUncaughtErrorInDEV;
function commitAttachRef(finishedWork) {
    var ref = finishedWork.ref;
    if (ref !== null) {
        var instance = finishedWork.stateNode;
        var instanceToUse = void 0;
        switch (finishedWork.tag) {
            case work_tags_1.WorkTag.HostHoistable:
            case work_tags_1.WorkTag.HostSingleton:
            case work_tags_1.WorkTag.HostComponent:
                instanceToUse = getPublicInstance(instance);
                break;
            default:
                instanceToUse = instance;
        }
        // Moved outside to ensure DCE works with this flag
        if (react_feature_flags_1.enableScopeAPI && finishedWork.tag === work_tags_1.WorkTag.ScopeComponent) {
            instanceToUse = instance;
        }
        if (typeof ref === "function") {
            if (shouldProfile(finishedWork)) {
                try {
                    (0, react_profile_timer_1.startLayoutEffectTimer)();
                    // @ts-ignore
                    finishedWork.refCleanup = ref(instanceToUse);
                }
                finally {
                    (0, react_profile_timer_1.recordLayoutEffectDuration)(finishedWork);
                }
            }
            else {
                // @ts-ignore
                finishedWork.refCleanup = ref(instanceToUse);
            }
        }
        else {
            if (__DEV__) {
                if (!ref.hasOwnProperty("current")) {
                    console.error("Unexpected ref object provided for %s. " + "Use either a ref-setter function or React.createRef().", (0, react_get_component_name_from_fiber_1.default)(finishedWork));
                }
            }
            // $FlowFixMe[incompatible-use] unable to narrow type to the non-function case
            ref.current = instanceToUse;
        }
    }
}
exports.commitAttachRef = commitAttachRef;
function getHostParentFiber(fiber) {
    var parent = fiber.return;
    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
    throw new Error("Expected to find a host parent. This error is likely caused by a bug " + "in React. Please file an issue.");
}
function isHostParent(fiber) {
    return fiber.tag === work_tags_1.WorkTag.HostComponent || fiber.tag === work_tags_1.WorkTag.HostRoot || (react_feature_flags_1.enableFloat && supportsResources ? fiber.tag === work_tags_1.WorkTag.HostHoistable : false) || (react_feature_flags_1.enableHostSingletons && supportsSingletons ? fiber.tag === work_tags_1.WorkTag.HostSingleton : false) || fiber.tag === work_tags_1.WorkTag.HostPortal;
}
function getHostSibling(fiber) {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    // TODO: Find a more efficient way to do this.
    var node = fiber;
    siblings: while (true) {
        // If we didn't find anything, let's try the next sibling.
        while (node.sibling === null) {
            if (node.return === null || isHostParent(node.return)) {
                // If we pop out of the root or hit the parent the fiber we are the
                // last sibling.
                return null;
            }
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
        while (node.tag !== work_tags_1.WorkTag.HostComponent && node.tag !== work_tags_1.WorkTag.HostText && (!(react_feature_flags_1.enableHostSingletons && supportsSingletons) ? true : node.tag !== work_tags_1.WorkTag.HostSingleton) && node.tag !== work_tags_1.WorkTag.DehydratedFragment) {
            // If it is not host node and, we might have a host node inside it.
            // Try to search down until we find one.
            if (node.flags & fiber_flags_1.FiberFlags.Placement) {
                // If we don't have a child, try the siblings instead.
                continue siblings;
            }
            // If we don't have a child, try the siblings instead.
            // We also skip portals because they are not part of this host tree.
            if (node.child === null || node.tag === work_tags_1.WorkTag.HostPortal) {
                continue siblings;
            }
            else {
                node.child.return = node;
                node = node.child;
            }
        }
        // Check if this host node is stable or about to be placed.
        if (!(node.flags & fiber_flags_1.FiberFlags.Placement)) {
            // Found it!
            return node.stateNode;
        }
    }
}
function commitPlacement(finishedWork) {
    if (!supportsMutation) {
        return;
    }
    if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
        if (finishedWork.tag === work_tags_1.WorkTag.HostSingleton) {
            // Singletons are already in the Host and don't need to be placed
            // Since they operate somewhat like Portals though their children will
            // have Placement and will get placed inside them
            return;
        }
    }
    // Recursively insert all host nodes into the parent.
    var parentFiber = getHostParentFiber(finishedWork);
    switch (parentFiber.tag) {
        case work_tags_1.WorkTag.HostSingleton: {
            if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
                var parent_1 = parentFiber.stateNode;
                var before = getHostSibling(finishedWork);
                // We only have the top Fiber that was inserted but we need to recurse down its
                // children to find all the terminal nodes.
                insertOrAppendPlacementNode(finishedWork, before, parent_1);
                break;
            } // Fall through
        }
        case work_tags_1.WorkTag.HostComponent: {
            var parent_2 = parentFiber.stateNode;
            if (parentFiber.flags & fiber_flags_1.FiberFlags.ContentReset) {
                // Reset the text content of the parent before doing any insertions
                resetTextContent(parent_2);
                // Clear ContentReset from the effect tag
                parentFiber.flags &= ~fiber_flags_1.FiberFlags.ContentReset;
            }
            var before = getHostSibling(finishedWork);
            // We only have the top Fiber that was inserted but we need to recurse down its
            // children to find all the terminal nodes.
            insertOrAppendPlacementNode(finishedWork, before, parent_2);
            break;
        }
        case work_tags_1.WorkTag.HostRoot:
        case work_tags_1.WorkTag.HostPortal: {
            var parent_3 = parentFiber.stateNode.containerInfo;
            var before = getHostSibling(finishedWork);
            insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent_3);
            break;
        }
        default:
            throw new Error("Invalid host parent fiber. This error is likely caused by a bug " + "in React. Please file an issue.");
    }
}
exports.commitPlacement = commitPlacement;
function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === work_tags_1.WorkTag.HostComponent || tag === work_tags_1.WorkTag.HostText;
    if (isHost) {
        var stateNode = node.stateNode;
        if (before) {
            insertInContainerBefore(parent, stateNode, before);
        }
        else {
            appendChildToContainer(parent, stateNode);
        }
    }
    else if (tag === work_tags_1.WorkTag.HostPortal || (react_feature_flags_1.enableHostSingletons && supportsSingletons ? tag === work_tags_1.WorkTag.HostSingleton : false)) { // If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
        // If the insertion is a HostSingleton then it will be placed independently
    }
    else {
        var child = node.child;
        if (child !== null) {
            insertOrAppendPlacementNodeIntoContainer(child, before, parent);
            var sibling = child.sibling;
            while (sibling !== null) {
                insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
}
function insertOrAppendPlacementNode(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === work_tags_1.WorkTag.HostComponent || tag === work_tags_1.WorkTag.HostText;
    if (isHost) {
        var stateNode = node.stateNode;
        if (before) {
            insertBefore(parent, stateNode, before);
        }
        else {
            appendChild(parent, stateNode);
        }
    }
    else if (tag === work_tags_1.WorkTag.HostPortal || (react_feature_flags_1.enableHostSingletons && supportsSingletons ? tag === work_tags_1.WorkTag.HostSingleton : false)) { // If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
        // If the insertion is a HostSingleton then it will be placed independently
    }
    else {
        var child = node.child;
        if (child !== null) {
            insertOrAppendPlacementNode(child, before, parent);
            var sibling = child.sibling;
            while (sibling !== null) {
                insertOrAppendPlacementNode(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
}
// This function detects when a Suspense boundary goes from visible to hidden.
// It returns false if the boundary is already hidden.
// TODO: Use an effect tag.
function isSuspenseBoundaryBeingHidden(current, finishedWork) {
    if (current !== null) {
        var oldState = current.memoizedState;
        if (oldState === null || oldState.dehydrated !== null) {
            var newState = finishedWork.memoizedState;
            return newState !== null && newState.dehydrated === null;
        }
    }
    return false;
}
exports.isSuspenseBoundaryBeingHidden = isSuspenseBoundaryBeingHidden;
// If we're inside a brand new tree, or a tree that was already visible, then we
// should only suspend host components that have a ShouldSuspendCommit flag.
// Components without it haven't changed since the last commit, so we can skip
// over those.
//
// When we enter a tree that is being revealed (going from hidden -> visible),
// we need to suspend _any_ component that _may_ suspend. Even if they're
// already in the "current" tree. Because their visibility has changed, the
// browser may not have prerendered them yet. So we check the MaySuspendCommit
// flag instead.
var suspenseyCommitFlag = fiber_flags_1.FiberFlags.ShouldSuspendCommit;
function accumulateSuspenseyCommit(finishedWork) {
    accumulateSuspenseyCommitOnFiber(finishedWork);
}
exports.accumulateSuspenseyCommit = accumulateSuspenseyCommit;
function recursivelyAccumulateSuspenseyCommit(parentFiber) {
    if (parentFiber.subtreeFlags & suspenseyCommitFlag) {
        var child = parentFiber.child;
        while (child !== null) {
            accumulateSuspenseyCommitOnFiber(child);
            child = child.sibling;
        }
    }
}
function accumulateSuspenseyCommitOnFiber(fiber) {
    switch (fiber.tag) {
        case work_tags_1.WorkTag.HostHoistable: {
            recursivelyAccumulateSuspenseyCommit(fiber);
            if (fiber.flags & suspenseyCommitFlag) {
                if (fiber.memoizedState !== null) {
                    suspendResource(
                    // This should always be set by visiting HostRoot first
                    (0, react_fiber_commit_current_hoistable_root_1.getCurrentHoistableRootSafe)(), fiber.memoizedState, fiber.memoizedProps);
                }
                else {
                    var type = fiber.type;
                    var props = fiber.memoizedProps;
                    suspendInstance(type, props);
                }
            }
            break;
        }
        case work_tags_1.WorkTag.HostComponent: {
            recursivelyAccumulateSuspenseyCommit(fiber);
            if (fiber.flags & suspenseyCommitFlag) {
                var type = fiber.type;
                var props = fiber.memoizedProps;
                suspendInstance(type, props);
            }
            break;
        }
        case work_tags_1.WorkTag.HostRoot:
        case work_tags_1.WorkTag.HostPortal: {
            if (react_feature_flags_1.enableFloat && supportsResources) {
                var previousHoistableRoot = (0, react_fiber_commit_current_hoistable_root_1.getCurrentHoistableRoot)();
                var container = fiber.stateNode.containerInfo;
                (0, react_fiber_commit_current_hoistable_root_1.setCurrentHoistableRoot)(getHoistableRoot(container));
                recursivelyAccumulateSuspenseyCommit(fiber);
                (0, react_fiber_commit_current_hoistable_root_1.setCurrentHoistableRoot)(previousHoistableRoot);
            }
            else {
                recursivelyAccumulateSuspenseyCommit(fiber);
            }
            break;
        }
        case work_tags_1.WorkTag.OffscreenComponent: {
            var isHidden = fiber.memoizedState !== null;
            if (isHidden) { // Don't suspend in hidden trees
            }
            else {
                var current = fiber.alternate;
                var wasHidden = current !== null && current.memoizedState !== null;
                if (wasHidden) {
                    // This tree is being revealed. Visit all newly visible suspensey
                    // instances, even if they're in the current tree.
                    var prevFlags = suspenseyCommitFlag;
                    suspenseyCommitFlag = fiber_flags_1.FiberFlags.MaySuspendCommit;
                    recursivelyAccumulateSuspenseyCommit(fiber);
                    suspenseyCommitFlag = prevFlags;
                }
                else {
                    recursivelyAccumulateSuspenseyCommit(fiber);
                }
            }
            break;
        }
        default: {
            recursivelyAccumulateSuspenseyCommit(fiber);
        }
    }
}
