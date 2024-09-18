"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var react_fiber_work_commit_passive_1 = require("@zenflux/react-reconciler/src/react-fiber-work-commit-passive");
var react_fiber_commit_effect_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-effect");
var react_fiber_work_double_invoke_shared_dev_1 = require("@zenflux/react-reconciler/src/react-fiber-work-double-invoke-shared-dev");
react_fiber_work_double_invoke_shared_dev_1.ReactFiberWorkDoubleInvokeSharedDev.commitDoubleInvokeEffectsInDEV = commitDoubleInvokeEffectsInDEV;
// ---
function invokeEffectsInDev(firstChild, fiberFlags, invokeEffectFn) {
    var current = firstChild;
    var subtreeRoot = null;
    while (current != null) {
        var primarySubtreeFlag = current.subtreeFlags & fiberFlags;
        if (current !== subtreeRoot && current.child != null && primarySubtreeFlag !== fiber_flags_1.FiberFlags.NoFlags) {
            current = current.child;
        }
        else {
            if ((current.flags & fiberFlags) !== fiber_flags_1.FiberFlags.NoFlags) {
                invokeEffectFn(current);
            }
            if (current.sibling !== null) {
                current = current.sibling;
            }
            else {
                current = subtreeRoot = current.return;
            }
        }
    }
}
function legacyCommitDoubleInvokeEffectsInDEV(fiber, hasPassiveEffects) {
    // TODO (StrictEffects) Should we set a marker on the root if it contains strict effects
    // so we don't traverse unnecessarily? similar to subtreeFlags but just at the root level.
    // Maybe not a big deal since this is DEV only behavior.
    (0, react_current_fiber_1.setCurrentFiber)(fiber);
    invokeEffectsInDev(fiber, fiber_flags_1.FiberFlags.MountLayoutDev, react_fiber_commit_effect_1.invokeLayoutEffectUnmountInDEV);
    if (hasPassiveEffects) {
        invokeEffectsInDev(fiber, fiber_flags_1.FiberFlags.MountPassiveDev, react_fiber_commit_effect_1.invokePassiveEffectUnmountInDEV);
    }
    invokeEffectsInDev(fiber, fiber_flags_1.FiberFlags.MountLayoutDev, react_fiber_commit_effect_1.invokeLayoutEffectMountInDEV);
    if (hasPassiveEffects) {
        invokeEffectsInDev(fiber, fiber_flags_1.FiberFlags.MountPassiveDev, react_fiber_commit_effect_1.invokePassiveEffectMountInDEV);
    }
    (0, react_current_fiber_1.resetCurrentFiber)();
}
// Unconditionally disconnects and connects passive and layout effects.
function doubleInvokeEffectsOnFiber(root, fiber, shouldDoubleInvokePassiveEffects) {
    if (shouldDoubleInvokePassiveEffects === void 0) { shouldDoubleInvokePassiveEffects = true; }
    (0, react_fiber_commit_effect_1.disappearLayoutEffects)(fiber);
    if (shouldDoubleInvokePassiveEffects) {
        (0, react_fiber_work_commit_passive_1.disconnectPassiveEffect)(fiber);
    }
    (0, react_fiber_commit_effect_1.reappearLayoutEffects)(root, fiber.alternate, fiber, false);
    if (shouldDoubleInvokePassiveEffects) {
        (0, react_fiber_work_commit_passive_1.reconnectPassiveEffects)(root, fiber, fiber_lane_constants_1.NoLanes, null, false);
    }
}
function doubleInvokeEffectsInDEVIfNecessary(root, fiber, parentIsInStrictMode) {
    var isStrictModeFiber = fiber.type === react_symbols_1.REACT_STRICT_MODE_TYPE;
    var isInStrictMode = parentIsInStrictMode || isStrictModeFiber;
    // First case: the fiber **is not** of type OffscreenComponent. No
    // special rules apply to double invoking effects.
    if (fiber.tag !== work_tags_1.WorkTag.OffscreenComponent) {
        if (fiber.flags & fiber_flags_1.FiberFlags.PlacementDEV) {
            (0, react_current_fiber_1.setCurrentFiber)(fiber);
            if (isInStrictMode) {
                doubleInvokeEffectsOnFiber(root, fiber, (fiber.mode & type_of_mode_1.TypeOfMode.NoStrictPassiveEffectsMode) === type_of_mode_1.TypeOfMode.NoMode);
            }
            (0, react_current_fiber_1.resetCurrentFiber)();
        }
        else {
            recursivelyTraverseAndDoubleInvokeEffectsInDEV(root, fiber, isInStrictMode);
        }
        return;
    }
    // Second case: the fiber **is** of type OffscreenComponent.
    // This branch contains cases specific to Offscreen.
    if (fiber.memoizedState === null) {
        // Only consider Offscreen that is visible.
        // TODO (Offscreen) Handle manual mode.
        (0, react_current_fiber_1.setCurrentFiber)(fiber);
        if (isInStrictMode && fiber.flags & fiber_flags_1.FiberFlags.Visibility) {
            // Double invoke effects on Offscreen's subtree only
            // if it is visible and its visibility has changed.
            doubleInvokeEffectsOnFiber(root, fiber);
        }
        else if (fiber.subtreeFlags & fiber_flags_1.FiberFlags.PlacementDEV) {
            // Something in the subtree could have been suspended.
            // We need to continue traversal and find newly inserted fibers.
            recursivelyTraverseAndDoubleInvokeEffectsInDEV(root, fiber, isInStrictMode);
        }
        (0, react_current_fiber_1.resetCurrentFiber)();
    }
}
function recursivelyTraverseAndDoubleInvokeEffectsInDEV(root, parentFiber, isInStrictMode) {
    if ((parentFiber.subtreeFlags & (fiber_flags_1.FiberFlags.PlacementDEV | fiber_flags_1.FiberFlags.Visibility)) === fiber_flags_1.FiberFlags.NoFlags) {
        // Parent's descendants have already had effects double invoked.
        // Early exit to avoid unnecessary tree traversal.
        return;
    }
    var child = parentFiber.child;
    while (child !== null) {
        doubleInvokeEffectsInDEVIfNecessary(root, child, isInStrictMode);
        child = child.sibling;
    }
}
function commitDoubleInvokeEffectsInDEV(root, hasPassiveEffects) {
    if (__DEV__) {
        if (react_feature_flags_1.useModernStrictMode) {
            var doubleInvokeEffects = true;
            if (root.tag === root_tags_1.LegacyRoot && !(root.current.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode)) {
                doubleInvokeEffects = false;
            }
            if (root.tag === root_tags_1.ConcurrentRoot && !(root.current.mode & (type_of_mode_1.TypeOfMode.StrictLegacyMode | type_of_mode_1.TypeOfMode.StrictEffectsMode))) {
                doubleInvokeEffects = false;
            }
            recursivelyTraverseAndDoubleInvokeEffectsInDEV(root, root.current, doubleInvokeEffects);
        }
        else {
            legacyCommitDoubleInvokeEffectsInDEV(root.current, hasPassiveEffects);
        }
    }
}
