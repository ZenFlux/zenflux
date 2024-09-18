"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findHostInstancesForRefresh = exports.scheduleRoot = exports.scheduleRefresh = exports.isCompatibleFamilyForHotReloading = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_concurrent_updates_1 = require("@zenflux/react-reconciler/src/react-fiber-concurrent-updates");
var react_fiber_context_1 = require("@zenflux/react-reconciler/src/react-fiber-context");
var react_fiber_hot_reloading_error_boundray_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-error-boundray");
var react_fiber_hot_reloading_resvole_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole");
var react_fiber_reconciler_contianer_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler-contianer");
var react_fiber_work_flush_sync_1 = require("@zenflux/react-reconciler/src/react-fiber-work-flush-sync");
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
var react_fiber_work_schedule_update_1 = require("@zenflux/react-reconciler/src/react-fiber-work-schedule-update");
var supportsSingletons = globalThis.__RECONCILER__CONFIG__.supportsSingletons;
function isCompatibleFamilyForHotReloading(fiber, element) {
    if (__DEV__) {
        if (!(0, react_fiber_hot_reloading_resvole_1.isRefreshHandler)()) {
            // Hot reloading is disabled.
            return false;
        }
        var prevType = fiber.elementType;
        var nextType = element.type;
        // If we got here, we know types aren't === equal.
        var needsCompareFamilies = false;
        var $$typeofNextType = typeof nextType === "object" && nextType !== null ? nextType.$$typeof : null;
        switch (fiber.tag) {
            case work_tags_1.WorkTag.ClassComponent: {
                if (typeof nextType === "function") {
                    needsCompareFamilies = true;
                }
                break;
            }
            case work_tags_1.WorkTag.FunctionComponent: {
                if (typeof nextType === "function") {
                    needsCompareFamilies = true;
                }
                else if ($$typeofNextType === react_symbols_1.REACT_LAZY_TYPE) {
                    // We don't know the inner type yet.
                    // We're going to assume that the lazy inner type is stable,
                    // and so it is sufficient to avoid reconciling it away.
                    // We're not going to unwrap or actually use the new lazy type.
                    needsCompareFamilies = true;
                }
                break;
            }
            case work_tags_1.WorkTag.ForwardRef: {
                if ($$typeofNextType === react_symbols_1.REACT_FORWARD_REF_TYPE) {
                    needsCompareFamilies = true;
                }
                else if ($$typeofNextType === react_symbols_1.REACT_LAZY_TYPE) {
                    needsCompareFamilies = true;
                }
                break;
            }
            case work_tags_1.WorkTag.MemoComponent:
            case work_tags_1.WorkTag.SimpleMemoComponent: {
                if ($$typeofNextType === react_symbols_1.REACT_MEMO_TYPE) {
                    // TODO: if it was but can no longer be simple,
                    // we shouldn't set this.
                    needsCompareFamilies = true;
                }
                else if ($$typeofNextType === react_symbols_1.REACT_LAZY_TYPE) {
                    needsCompareFamilies = true;
                }
                break;
            }
            default:
                return false;
        }
        // Check if both types have a family and it's the same one.
        if (needsCompareFamilies) {
            // Note: memo() and forwardRef() we'll compare outer rather than inner type.
            // This means both of them need to be registered to preserve state.
            // If we unwrapped and compared the inner types for wrappers instead,
            // then we would risk falsely saying two separate memo(Foo)
            // calls are equivalent because they wrap the same Foo function.
            var prevFamily = (0, react_fiber_hot_reloading_resvole_1.refresherHandler)(prevType);
            // $FlowFixMe[not-a-function] found when upgrading Flow
            if (prevFamily !== undefined && prevFamily === (0, react_fiber_hot_reloading_resvole_1.refresherHandler)(nextType)) {
                return true;
            }
        }
        return false;
    }
    else {
        return false;
    }
}
exports.isCompatibleFamilyForHotReloading = isCompatibleFamilyForHotReloading;
var scheduleRefresh = function (root, update) {
    if (__DEV__) {
        if ((0, react_fiber_hot_reloading_resvole_1.isRefreshHandler)()) {
            // Hot reloading is disabled.
            return;
        }
        var staleFamilies_1 = update.staleFamilies, updatedFamilies_1 = update.updatedFamilies;
        (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
        (0, react_fiber_work_flush_sync_1.flushSync)(function () {
            scheduleFibersWithFamiliesRecursively(root.current, updatedFamilies_1, staleFamilies_1);
        });
    }
};
exports.scheduleRefresh = scheduleRefresh;
var scheduleRoot = function (root, element) {
    if (__DEV__) {
        if (root.context !== react_fiber_context_1.emptyContextObject) {
            // Super edge case: root has a legacy _renderSubtree context
            // but we don't know the parentComponent so we can't pass it.
            // Just ignore. We'll delete this with _renderSubtree code path later.
            return;
        }
        (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
        (0, react_fiber_work_flush_sync_1.flushSync)(function () {
            (0, react_fiber_reconciler_contianer_1.updateContainer)(element, root, null, null);
        });
    }
};
exports.scheduleRoot = scheduleRoot;
function scheduleFibersWithFamiliesRecursively(fiber, updatedFamilies, staleFamilies) {
    if (__DEV__) {
        var alternate = fiber.alternate, child = fiber.child, sibling = fiber.sibling, tag = fiber.tag, type = fiber.type;
        var candidateType = null;
        switch (tag) {
            case work_tags_1.WorkTag.FunctionComponent:
            case work_tags_1.WorkTag.SimpleMemoComponent:
            case work_tags_1.WorkTag.ClassComponent:
                candidateType = type;
                break;
            case work_tags_1.WorkTag.ForwardRef:
                candidateType = type.render;
                break;
            default:
                break;
        }
        if ((0, react_fiber_hot_reloading_resvole_1.isRefreshHandler)()) {
            throw new Error("Expected resolveFamily to be set during hot reload.");
        }
        var needsRender = false;
        var needsRemount = false;
        if (candidateType !== null) {
            var family = (0, react_fiber_hot_reloading_resvole_1.refresherHandler)(candidateType);
            if (family !== undefined) {
                if (staleFamilies.has(family)) {
                    needsRemount = true;
                }
                else if (updatedFamilies.has(family)) {
                    if (tag === work_tags_1.WorkTag.ClassComponent) {
                        needsRemount = true;
                    }
                    else {
                        needsRender = true;
                    }
                }
            }
        }
        if ((0, react_fiber_hot_reloading_error_boundray_1.hasFailedErrorBoundary)()) {
            if ((0, react_fiber_hot_reloading_error_boundray_1.hasSpecificFailedErrorBoundarySafe)(fiber) ||
                alternate !== null &&
                    (0, react_fiber_hot_reloading_error_boundray_1.hasSpecificFailedErrorBoundarySafe)(alternate)) {
                needsRemount = true;
            }
        }
        if (needsRemount) {
            fiber._debugNeedsRemount = true;
        }
        if (needsRemount || needsRender) {
            var root = (0, react_fiber_concurrent_updates_1.enqueueConcurrentRenderForLane)(fiber, fiber_lane_constants_1.SyncLane);
            if (root !== null) {
                (0, react_fiber_work_schedule_update_1.scheduleUpdateOnFiber)(root, fiber, fiber_lane_constants_1.SyncLane);
            }
        }
        if (child !== null && !needsRemount) {
            scheduleFibersWithFamiliesRecursively(child, updatedFamilies, staleFamilies);
        }
        if (sibling !== null) {
            scheduleFibersWithFamiliesRecursively(sibling, updatedFamilies, staleFamilies);
        }
    }
}
var findHostInstancesForRefresh = function (root, families) {
    if (__DEV__) {
        var hostInstances = new Set();
        var types = new Set(families.map(function (family) { return family.current; }));
        findHostInstancesForMatchingFibersRecursively(root.current, types, hostInstances);
        return hostInstances;
    }
    else {
        throw new Error("Did not expect findHostInstancesForRefresh to be called in production.");
    }
};
exports.findHostInstancesForRefresh = findHostInstancesForRefresh;
function findHostInstancesForMatchingFibersRecursively(fiber, types, hostInstances) {
    if (__DEV__) {
        var child = fiber.child, sibling = fiber.sibling, tag = fiber.tag, type = fiber.type;
        var candidateType = null;
        switch (tag) {
            case work_tags_1.WorkTag.FunctionComponent:
            case work_tags_1.WorkTag.SimpleMemoComponent:
            case work_tags_1.WorkTag.ClassComponent:
                candidateType = type;
                break;
            case work_tags_1.WorkTag.ForwardRef:
                candidateType = type.render;
                break;
            default:
                break;
        }
        var didMatch = false;
        if (candidateType !== null) {
            if (types.has(candidateType)) {
                didMatch = true;
            }
        }
        if (didMatch) {
            // We have a match. This only drills down to the closest host components.
            // There's no need to search deeper because for the purpose of giving
            // visual feedback, "flashing" outermost parent rectangles is sufficient.
            findHostInstancesForFiberShallowly(fiber, hostInstances);
        }
        else {
            // If there's no match, maybe there will be one further down in the child tree.
            if (child !== null) {
                findHostInstancesForMatchingFibersRecursively(child, types, hostInstances);
            }
        }
        if (sibling !== null) {
            findHostInstancesForMatchingFibersRecursively(sibling, types, hostInstances);
        }
    }
}
function findHostInstancesForFiberShallowly(fiber, hostInstances) {
    if (__DEV__) {
        var foundHostInstances = findChildHostInstancesForFiberShallowly(fiber, hostInstances);
        if (foundHostInstances) {
            return;
        }
        // If we didn't find any host children, fallback to the closest host parent.
        var node = fiber;
        while (true) {
            switch (node.tag) {
                case work_tags_1.WorkTag.HostSingleton:
                case work_tags_1.WorkTag.HostComponent:
                    hostInstances.add(node.stateNode);
                    return;
                case work_tags_1.WorkTag.HostPortal:
                    hostInstances.add(node.stateNode.containerInfo);
                    return;
                case work_tags_1.WorkTag.HostRoot:
                    hostInstances.add(node.stateNode.containerInfo);
                    return;
            }
            if (node.return === null) {
                throw new Error("Expected to reach root first.");
            }
            node = node.return;
        }
    }
}
function findChildHostInstancesForFiberShallowly(fiber, hostInstances) {
    if (__DEV__) {
        var node = fiber;
        var foundHostInstances = false;
        while (true) {
            if (node.tag === work_tags_1.WorkTag.HostComponent ||
                (react_feature_flags_1.enableFloat ? node.tag === work_tags_1.WorkTag.HostHoistable : false) ||
                (react_feature_flags_1.enableHostSingletons && supportsSingletons ? node.tag === work_tags_1.WorkTag.HostSingleton : false)) {
                // We got a match.
                foundHostInstances = true;
                hostInstances.add(node.stateNode); // There may still be more, so keep searching.
            }
            else if (node.child !== null) {
                node.child.return = node;
                node = node.child;
                continue;
            }
            if (node === fiber) {
                return foundHostInstances;
            }
            while (node.sibling === null) {
                if (node.return === null || node.return === fiber) {
                    return foundHostInstances;
                }
                node = node.return;
            }
            node.sibling.return = node.return;
            node = node.sibling;
        }
    }
    return false;
}
