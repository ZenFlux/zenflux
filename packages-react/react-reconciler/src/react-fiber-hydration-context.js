"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnIfUnhydratedTailNodes = exports.hasUnhydratedTailNodes = exports.popHydrationState = exports.prepareToHydrateHostSuspenseInstance = exports.prepareToHydrateHostTextInstance = exports.prepareToHydrateHostInstance = exports.resetHydrationState = exports.reenterHydrationStateFromDehydratedSuspenseInstance = exports.enterHydrationState = exports.warnIfHydrating = exports.upgradeHydrationErrorsToRecoverable = exports.deleteHydratableInstance = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var react_fiber_tree_context_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-context");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_hydration_did_suspend_on_error_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error");
var react_fiber_hydration_error_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-error");
var react_fiber_hydration_context_parent_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-parent");
var react_fiber_hydration_context_next_instance_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-next-instance");
var react_fiber_hydration_context_root_or_singleton_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-root-or-singleton");
var react_fiber_hydration_context_mismatch_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-mismatch");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var _a = globalThis.__RECONCILER__CONFIG__, didNotHydrateInstance = _a.didNotHydrateInstance, didNotHydrateInstanceWithinContainer = _a.didNotHydrateInstanceWithinContainer, didNotHydrateInstanceWithinSuspenseInstance = _a.didNotHydrateInstanceWithinSuspenseInstance, didNotMatchHydratedContainerTextInstance = _a.didNotMatchHydratedContainerTextInstance, didNotMatchHydratedTextInstance = _a.didNotMatchHydratedTextInstance, getFirstHydratableChildWithinContainer = _a.getFirstHydratableChildWithinContainer, getFirstHydratableChildWithinSuspenseInstance = _a.getFirstHydratableChildWithinSuspenseInstance, getNextHydratableInstanceAfterSuspenseInstance = _a.getNextHydratableInstanceAfterSuspenseInstance, getNextHydratableSibling = _a.getNextHydratableSibling, hydrateInstance = _a.hydrateInstance, hydrateSuspenseInstance = _a.hydrateSuspenseInstance, hydrateTextInstance = _a.hydrateTextInstance, shouldDeleteUnhydratedTailInstances = _a.shouldDeleteUnhydratedTailInstances, shouldSetTextContent = _a.shouldSetTextContent, supportsHydration = _a.supportsHydration, supportsSingletons = _a.supportsSingletons;
function warnIfHydrating() {
    if (__DEV__) {
        if ((0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
            console.error("We should not be hydrating here. This is a bug in React. Please file a bug.");
        }
    }
}
exports.warnIfHydrating = warnIfHydrating;
function enterHydrationState(fiber) {
    if (!supportsHydration) {
        return false;
    }
    var parentInstance = fiber.stateNode.containerInfo;
    (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getFirstHydratableChildWithinContainer(parentInstance));
    (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
    (0, react_fiber_hydration_is_hydrating_1.markHydrating)();
    (0, react_fiber_hydration_error_1.clearHydrationErrors)();
    (0, react_fiber_hydration_did_suspend_on_error_1.clearDidThrowWhileHydratingDEV)();
    (0, react_fiber_hydration_context_root_or_singleton_1.setRootOrSingletonContextFlag)();
    return true;
}
exports.enterHydrationState = enterHydrationState;
function reenterHydrationStateFromDehydratedSuspenseInstance(fiber, suspenseInstance, treeContext) {
    if (!supportsHydration) {
        return false;
    }
    (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getFirstHydratableChildWithinSuspenseInstance(suspenseInstance));
    (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
    (0, react_fiber_hydration_is_hydrating_1.markHydrating)();
    (0, react_fiber_hydration_error_1.clearHydrationErrors)();
    (0, react_fiber_hydration_did_suspend_on_error_1.clearDidThrowWhileHydratingDEV)();
    (0, react_fiber_hydration_context_root_or_singleton_1.clearRootOrSingletonContextFlag)();
    if (treeContext !== null) {
        (0, react_fiber_tree_context_1.restoreSuspendedTreeContext)(fiber, treeContext);
    }
    return true;
}
exports.reenterHydrationStateFromDehydratedSuspenseInstance = reenterHydrationStateFromDehydratedSuspenseInstance;
function warnUnhydratedInstance(returnFiber, instance) {
    if (__DEV__) {
        switch (returnFiber.tag) {
            case work_tags_1.WorkTag.HostRoot: {
                didNotHydrateInstanceWithinContainer(returnFiber.stateNode.containerInfo, instance);
                break;
            }
            case work_tags_1.WorkTag.HostSingleton:
            case work_tags_1.WorkTag.HostComponent: {
                var isConcurrentMode = (returnFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
                didNotHydrateInstance(returnFiber.type, returnFiber.memoizedProps, returnFiber.stateNode, instance, // TODO: Delete this argument when we remove the legacy root API.
                isConcurrentMode);
                break;
            }
            case work_tags_1.WorkTag.SuspenseComponent: {
                var suspenseState = returnFiber.memoizedState;
                if (suspenseState.dehydrated !== null)
                    didNotHydrateInstanceWithinSuspenseInstance(suspenseState.dehydrated, instance);
                break;
            }
        }
    }
}
function deleteHydratableInstance(returnFiber, instance) {
    warnUnhydratedInstance(returnFiber, instance);
    var childToDelete = (0, react_fiber_1.createFiberFromHostInstanceForDeletion)();
    childToDelete.stateNode = instance;
    childToDelete.return = returnFiber;
    var deletions = returnFiber.deletions;
    if (deletions === null) {
        returnFiber.deletions = [childToDelete];
        returnFiber.flags |= fiber_flags_1.FiberFlags.ChildDeletion;
    }
    else {
        deletions.push(childToDelete);
    }
}
exports.deleteHydratableInstance = deleteHydratableInstance;
function prepareToHydrateHostInstance(fiber, hostContext) {
    if (!supportsHydration) {
        throw new Error("Expected prepareToHydrateHostInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
    var instance = fiber.stateNode;
    var shouldWarnIfMismatchDev = (0, react_fiber_hydration_did_suspend_on_error_1.didntSuspendOrErrorWhileHydratingDEV)();
    hydrateInstance(instance, fiber.type, fiber.memoizedProps, hostContext, fiber, shouldWarnIfMismatchDev);
}
exports.prepareToHydrateHostInstance = prepareToHydrateHostInstance;
function prepareToHydrateHostTextInstance(fiber) {
    if (!supportsHydration) {
        throw new Error("Expected prepareToHydrateHostTextInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
    var textInstance = fiber.stateNode;
    var textContent = fiber.memoizedProps;
    var shouldWarnIfMismatchDev = (0, react_fiber_hydration_did_suspend_on_error_1.didntSuspendOrErrorWhileHydratingDEV)();
    var shouldUpdate = hydrateTextInstance(textInstance, textContent, fiber, shouldWarnIfMismatchDev);
    if (shouldUpdate) {
        // We assume that prepareToHydrateHostTextInstance is called in a context where the
        // hydration parent is the parent host component of this host text.
        var returnFiber = (0, react_fiber_hydration_context_parent_1.getHydrationParentFiber)();
        if (returnFiber !== null) {
            switch (returnFiber.tag) {
                case work_tags_1.WorkTag.HostRoot: {
                    var parentContainer = returnFiber.stateNode.containerInfo;
                    var isConcurrentMode = (returnFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
                    didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, textContent, // TODO: Delete this argument when we remove the legacy root API.
                    isConcurrentMode, shouldWarnIfMismatchDev);
                    if (isConcurrentMode && react_feature_flags_1.enableClientRenderFallbackOnTextMismatch) {
                        // In concurrent mode we never update the mismatched text,
                        // even if the error was ignored.
                        return false;
                    }
                    break;
                }
                case work_tags_1.WorkTag.HostSingleton:
                case work_tags_1.WorkTag.HostComponent: {
                    var parentType = returnFiber.type;
                    var parentProps = returnFiber.memoizedProps;
                    var parentInstance = returnFiber.stateNode;
                    var isConcurrentMode = (returnFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
                    didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, textContent, // TODO: Delete this argument when we remove the legacy root API.
                    isConcurrentMode, shouldWarnIfMismatchDev);
                    if (isConcurrentMode && react_feature_flags_1.enableClientRenderFallbackOnTextMismatch) {
                        // In concurrent mode we never update the mismatched text,
                        // even if the error was ignored.
                        return false;
                    }
                    break;
                }
            }
        }
    }
    return shouldUpdate;
}
exports.prepareToHydrateHostTextInstance = prepareToHydrateHostTextInstance;
function prepareToHydrateHostSuspenseInstance(fiber) {
    if (!supportsHydration) {
        throw new Error("Expected prepareToHydrateHostSuspenseInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
    var suspenseState = fiber.memoizedState;
    var suspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;
    if (!suspenseInstance) {
        throw new Error("Expected to have a hydrated suspense instance. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
    hydrateSuspenseInstance(suspenseInstance, fiber);
}
exports.prepareToHydrateHostSuspenseInstance = prepareToHydrateHostSuspenseInstance;
function skipPastDehydratedSuspenseInstance(fiber) {
    if (!supportsHydration) {
        throw new Error("Expected skipPastDehydratedSuspenseInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
    var suspenseState = fiber.memoizedState;
    var suspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;
    if (!suspenseInstance) {
        throw new Error("Expected to have a hydrated suspense instance. " + "This error is likely caused by a bug in React. Please file an issue.");
    }
    return getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance);
}
function popToNextHostParent(fiber) {
    (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber.return);
    while ((0, react_fiber_hydration_context_parent_1.hasHydrationParentFiber)()) {
        switch ((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)().tag) {
            case work_tags_1.WorkTag.HostRoot:
            case work_tags_1.WorkTag.HostSingleton:
                (0, react_fiber_hydration_context_root_or_singleton_1.setRootOrSingletonContextFlag)();
                return;
            case work_tags_1.WorkTag.HostComponent:
            case work_tags_1.WorkTag.SuspenseComponent:
                (0, react_fiber_hydration_context_root_or_singleton_1.clearRootOrSingletonContextFlag)();
                return;
            default:
                (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)().return);
        }
    }
}
function popHydrationState(fiber) {
    if (!supportsHydration) {
        return false;
    }
    if (fiber !== (0, react_fiber_hydration_context_parent_1.getHydrationParentFiber)()) {
        // We're deeper than the current hydration context, inside an inserted
        // tree.
        return false;
    }
    if (!react_fiber_hydration_is_hydrating_1.isHydrating) {
        // If we're not currently hydrating but we're in a hydration context, then
        // we were an insertion and now need to pop up reenter hydration of our
        // siblings.
        popToNextHostParent(fiber);
        (0, react_fiber_hydration_is_hydrating_1.markHydrating)();
        return false;
    }
    var shouldClear = false;
    if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
        // With float we never clear the Root, or Singleton instances. We also do not clear Instances
        // that have singleton text content
        if (fiber.tag !== work_tags_1.WorkTag.HostRoot && fiber.tag !== work_tags_1.WorkTag.HostSingleton && !(fiber.tag === work_tags_1.WorkTag.HostComponent && (!shouldDeleteUnhydratedTailInstances(fiber.type) || shouldSetTextContent(fiber.type, fiber.memoizedProps)))) {
            shouldClear = true;
        }
    }
    else {
        // If we have any remaining hydratable nodes, we need to delete them now.
        // We only do this deeper than head and body since they tend to have random
        // other nodes in them. We also ignore components with pure text content in
        // side of them. We also don't delete anything inside the root container.
        if (fiber.tag !== work_tags_1.WorkTag.HostRoot && (fiber.tag !== work_tags_1.WorkTag.HostComponent || shouldDeleteUnhydratedTailInstances(fiber.type) && !shouldSetTextContent(fiber.type, fiber.memoizedProps))) {
            shouldClear = true;
        }
    }
    if (shouldClear) {
        var nextInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
        if (nextInstance) {
            if ((0, react_fiber_hydration_context_mismatch_1.shouldClientRenderOnMismatch)(fiber)) {
                warnIfUnhydratedTailNodes(fiber);
                (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
            }
            else {
                while (nextInstance) {
                    deleteHydratableInstance(fiber, nextInstance);
                    nextInstance = getNextHydratableSibling(nextInstance);
                }
            }
        }
    }
    popToNextHostParent(fiber);
    if (fiber.tag === work_tags_1.WorkTag.SuspenseComponent) {
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(skipPastDehydratedSuspenseInstance(fiber));
    }
    else {
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)((0, react_fiber_hydration_context_parent_1.getHydrationParentFiber)() ? getNextHydratableSibling(fiber.stateNode) : null);
    }
    return true;
}
exports.popHydrationState = popHydrationState;
function hasUnhydratedTailNodes() {
    return (0, react_fiber_hydration_is_hydrating_1.isHydrating)() && (0, react_fiber_hydration_context_next_instance_1.hasNextHydratableInstance)();
}
exports.hasUnhydratedTailNodes = hasUnhydratedTailNodes;
function warnIfUnhydratedTailNodes(fiber) {
    var nextInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
    while (nextInstance) {
        warnUnhydratedInstance(fiber, nextInstance);
        nextInstance = getNextHydratableSibling(nextInstance);
    }
}
exports.warnIfUnhydratedTailNodes = warnIfUnhydratedTailNodes;
function resetHydrationState() {
    if (!supportsHydration) {
        return;
    }
    (0, react_fiber_hydration_context_parent_1.clearHydrationParentFiber)();
    (0, react_fiber_hydration_context_next_instance_1.clearNextHydratableInstance)();
    (0, react_fiber_hydration_is_hydrating_1.freeHydrating)();
    (0, react_fiber_hydration_did_suspend_on_error_1.clearDidThrowWhileHydratingDEV)();
}
exports.resetHydrationState = resetHydrationState;
function upgradeHydrationErrorsToRecoverable() {
    if ((0, react_fiber_hydration_error_1.hasHydrationErrors)()) {
        // Successfully completed a forced client render. The errors that occurred
        // during the hydration attempt are now recovered. We will log them in
        // commit phase, once the entire tree has finished.
        (0, react_fiber_work_in_progress_1.queueRecoverableErrors)((0, react_fiber_hydration_error_1.getHydrationErrorsSafe)());
        (0, react_fiber_hydration_error_1.clearHydrationErrors)();
    }
}
exports.upgradeHydrationErrorsToRecoverable = upgradeHydrationErrorsToRecoverable;
