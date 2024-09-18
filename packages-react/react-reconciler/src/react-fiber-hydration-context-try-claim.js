"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryToClaimNextHydratableFormMarkerInstance = exports.tryToClaimNextHydratableSuspenseInstance = exports.tryToClaimNextHydratableTextInstance = exports.tryToClaimNextHydratableInstance = exports.claimHydratableSingleton = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_host_context_1 = require("@zenflux/react-reconciler/src/react-fiber-host-context");
var react_fiber_hydration_is_hydrating_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating");
var react_fiber_hydration_did_suspend_on_error_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error");
var react_fiber_hydration_context_parent_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-parent");
var react_fiber_hydration_context_next_instance_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-next-instance");
var react_fiber_hydration_context_root_or_singleton_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-root-or-singleton");
var react_fiber_hydration_context_mismatch_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-mismatch");
var react_fiber_hydration_context_try_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-try");
var react_fiber_hydration_context_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context");
var _a = globalThis.__RECONCILER__CONFIG__, canHydrateFormStateMarker = _a.canHydrateFormStateMarker, didNotFindHydratableInstance = _a.didNotFindHydratableInstance, didNotFindHydratableInstanceWithinContainer = _a.didNotFindHydratableInstanceWithinContainer, didNotFindHydratableInstanceWithinSuspenseInstance = _a.didNotFindHydratableInstanceWithinSuspenseInstance, didNotFindHydratableSuspenseInstance = _a.didNotFindHydratableSuspenseInstance, didNotFindHydratableSuspenseInstanceWithinContainer = _a.didNotFindHydratableSuspenseInstanceWithinContainer, didNotFindHydratableSuspenseInstanceWithinSuspenseInstance = _a.didNotFindHydratableSuspenseInstanceWithinSuspenseInstance, didNotFindHydratableTextInstance = _a.didNotFindHydratableTextInstance, didNotFindHydratableTextInstanceWithinContainer = _a.didNotFindHydratableTextInstanceWithinContainer, didNotFindHydratableTextInstanceWithinSuspenseInstance = _a.didNotFindHydratableTextInstanceWithinSuspenseInstance, getFirstHydratableChild = _a.getFirstHydratableChild, getNextHydratableSibling = _a.getNextHydratableSibling, isFormStateMarkerMatching = _a.isFormStateMarkerMatching, isHydratableText = _a.isHydratableText, resolveSingletonInstance = _a.resolveSingletonInstance, supportsSingletons = _a.supportsSingletons;
function warnNonHydratedInstance(returnFiber, fiber) {
    if (__DEV__) {
        if ((0, react_fiber_hydration_did_suspend_on_error_1.didSuspendOrErrorWhileHydratingDEV)()) {
            // Inside a boundary that already suspended. We're currently rendering the
            // siblings of a suspended node. The mismatch may be due to the missing
            // data, so it's probably a false positive.
            return;
        }
        switch (returnFiber.tag) {
            case work_tags_1.WorkTag.HostRoot: {
                var parentContainer = returnFiber.stateNode.containerInfo;
                switch (fiber.tag) {
                    case work_tags_1.WorkTag.HostSingleton:
                    case work_tags_1.WorkTag.HostComponent:
                        var type = fiber.type;
                        var props = fiber.pendingProps;
                        didNotFindHydratableInstanceWithinContainer(parentContainer, type, props);
                        break;
                    case work_tags_1.WorkTag.HostText:
                        var text = fiber.pendingProps;
                        didNotFindHydratableTextInstanceWithinContainer(parentContainer, text);
                        break;
                    case work_tags_1.WorkTag.SuspenseComponent:
                        didNotFindHydratableSuspenseInstanceWithinContainer(parentContainer);
                        break;
                }
                break;
            }
            case work_tags_1.WorkTag.HostSingleton:
            case work_tags_1.WorkTag.HostComponent: {
                var parentType = returnFiber.type;
                var parentProps = returnFiber.memoizedProps;
                var parentInstance = returnFiber.stateNode;
                switch (fiber.tag) {
                    case work_tags_1.WorkTag.HostSingleton:
                    case work_tags_1.WorkTag.HostComponent: {
                        var type = fiber.type;
                        var props = fiber.pendingProps;
                        var isConcurrentMode = (returnFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
                        didNotFindHydratableInstance(parentType, parentProps, parentInstance, type, props, // TODO: Delete this argument when we remove the legacy root API.
                        isConcurrentMode);
                        break;
                    }
                    case work_tags_1.WorkTag.HostText: {
                        var text = fiber.pendingProps;
                        var isConcurrentMode = (returnFiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
                        didNotFindHydratableTextInstance(parentType, parentProps, parentInstance, text, // TODO: Delete this argument when we remove the legacy root API.
                        isConcurrentMode);
                        break;
                    }
                    case work_tags_1.WorkTag.SuspenseComponent: {
                        didNotFindHydratableSuspenseInstance(parentType, parentProps, parentInstance);
                        break;
                    }
                }
                break;
            }
            case work_tags_1.WorkTag.SuspenseComponent: {
                var suspenseState = returnFiber.memoizedState;
                var parentInstance = suspenseState.dehydrated;
                if (parentInstance !== null)
                    switch (fiber.tag) {
                        case work_tags_1.WorkTag.HostSingleton:
                        case work_tags_1.WorkTag.HostComponent:
                            var type = fiber.type;
                            var props = fiber.pendingProps;
                            didNotFindHydratableInstanceWithinSuspenseInstance(parentInstance, type, props);
                            break;
                        case work_tags_1.WorkTag.HostText:
                            var text = fiber.pendingProps;
                            didNotFindHydratableTextInstanceWithinSuspenseInstance(parentInstance, text);
                            break;
                        case work_tags_1.WorkTag.SuspenseComponent:
                            didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(parentInstance);
                            break;
                    }
                break;
            }
            default:
                return;
        }
    }
}
function insertNonHydratedInstance(returnFiber, fiber) {
    fiber.flags = fiber.flags & ~fiber_flags_1.FiberFlags.Hydrating | fiber_flags_1.FiberFlags.Placement;
    warnNonHydratedInstance(returnFiber, fiber);
}
function claimHydratableSingleton(fiber) {
    if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
        if (!(0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
            return;
        }
        var currentRootContainer = (0, react_fiber_host_context_1.getRootHostContainer)();
        var currentHostContext = (0, react_fiber_host_context_1.getHostContext)();
        var instance = fiber.stateNode = resolveSingletonInstance(fiber.type, fiber.pendingProps, currentRootContainer, currentHostContext, false);
        (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
        (0, react_fiber_hydration_context_root_or_singleton_1.setRootOrSingletonContextFlag)();
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getFirstHydratableChild(instance));
    }
}
exports.claimHydratableSingleton = claimHydratableSingleton;
function tryToClaimNextHydratableInstance(fiber) {
    if (!(0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
        return;
    }
    var initialInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
    var nextInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
    if (!nextInstance) {
        if ((0, react_fiber_hydration_context_mismatch_1.shouldClientRenderOnMismatch)(fiber)) {
            warnNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
        }
        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
        (0, react_fiber_hydration_is_hydrating_1.freeHydrating)();
        (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(initialInstance);
        return;
    }
    if (!(0, react_fiber_hydration_context_try_1.tryHydrateInstance)(fiber, nextInstance)) {
        if ((0, react_fiber_hydration_context_mismatch_1.shouldClientRenderOnMismatch)(fiber)) {
            warnNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
        }
        // If we can't hydrate this instance let's try the next one.
        // We use this as a heuristic. It's based on intuition and not data so it
        // might be flawed or unnecessary.
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getNextHydratableSibling(nextInstance));
        var prevHydrationParentFiber = (0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)();
        if (!(0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)() || !(0, react_fiber_hydration_context_try_1.tryHydrateInstance)(fiber, (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)())) {
            // Nothing to hydrate. Make it an insertion.
            insertNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_is_hydrating_1.freeHydrating)();
            (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
            (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(initialInstance);
            return;
        }
        // We matched the next one, we'll now assume that the first one was
        // superfluous and we'll delete it. Since we can't eagerly delete it
        // we'll have to schedule a deletion. To do that, this node needs a dummy
        // fiber associated with it.
        (0, react_fiber_hydration_context_1.deleteHydratableInstance)(prevHydrationParentFiber, nextInstance);
    }
}
exports.tryToClaimNextHydratableInstance = tryToClaimNextHydratableInstance;
function tryToClaimNextHydratableTextInstance(fiber) {
    if (!(0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
        return;
    }
    var text = fiber.pendingProps;
    var isHydratable = isHydratableText(text);
    var initialInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
    var nextInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
    if (!nextInstance || !isHydratable) {
        // We exclude non hydrabable text because we know there are no matching hydratables.
        // We either throw or insert depending on the render mode.
        if ((0, react_fiber_hydration_context_mismatch_1.shouldClientRenderOnMismatch)(fiber)) {
            warnNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
        }
        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
        (0, react_fiber_hydration_is_hydrating_1.freeHydrating)();
        (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(initialInstance);
        return;
    }
    if (!(0, react_fiber_hydration_context_try_1.tryHydrateText)(fiber, nextInstance)) {
        if ((0, react_fiber_hydration_context_mismatch_1.shouldClientRenderOnMismatch)(fiber)) {
            warnNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
        }
        // If we can't hydrate this instance let's try the next one.
        // We use this as a heuristic. It's based on intuition and not data so it
        // might be flawed or unnecessary.
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getNextHydratableSibling(nextInstance));
        var prevHydrationParentFiber = (0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)();
        if (!(0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)() || !(0, react_fiber_hydration_context_try_1.tryHydrateText)(fiber, (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)())) {
            // Nothing to hydrate. Make it an insertion.
            insertNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_is_hydrating_1.freeHydrating)();
            (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
            (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(initialInstance);
            return;
        }
        // We matched the next one, we'll now assume that the first one was
        // superfluous and we'll delete it. Since we can't eagerly delete it
        // we'll have to schedule a deletion. To do that, this node needs a dummy
        // fiber associated with it.
        (0, react_fiber_hydration_context_1.deleteHydratableInstance)(prevHydrationParentFiber, nextInstance);
    }
}
exports.tryToClaimNextHydratableTextInstance = tryToClaimNextHydratableTextInstance;
function tryToClaimNextHydratableSuspenseInstance(fiber) {
    if (!(0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
        return;
    }
    var initialInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
    var nextInstance = (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)();
    if (!nextInstance) {
        if ((0, react_fiber_hydration_context_mismatch_1.shouldClientRenderOnMismatch)(fiber)) {
            warnNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
        }
        // Nothing to hydrate. Make it an insertion.
        insertNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
        (0, react_fiber_hydration_is_hydrating_1.freeHydrating)();
        (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(initialInstance);
        return;
    }
    if (!(0, react_fiber_hydration_context_try_1.tryHydrateSuspense)(fiber, nextInstance)) {
        if ((0, react_fiber_hydration_context_mismatch_1.shouldClientRenderOnMismatch)(fiber)) {
            warnNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
        }
        // If we can't hydrate this instance let's try the next one.
        // We use this as a heuristic. It's based on intuition and not data so it
        // might be flawed or unnecessary.
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getNextHydratableSibling(nextInstance));
        var prevHydrationParentFiber = (0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)();
        if (!(0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)() || !(0, react_fiber_hydration_context_try_1.tryHydrateSuspense)(fiber, (0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)())) {
            // Nothing to hydrate. Make it an insertion.
            insertNonHydratedInstance((0, react_fiber_hydration_context_parent_1.getHydrationParentFiberSafe)(), fiber);
            (0, react_fiber_hydration_is_hydrating_1.freeHydrating)();
            (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
            (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(initialInstance);
            return;
        }
        // We matched the next one, we'll now assume that the first one was
        // superfluous and we'll delete it. Since we can't eagerly delete it
        // we'll have to schedule a deletion. To do that, this node needs a dummy
        // fiber associated with it.
        (0, react_fiber_hydration_context_1.deleteHydratableInstance)(prevHydrationParentFiber, nextInstance);
    }
}
exports.tryToClaimNextHydratableSuspenseInstance = tryToClaimNextHydratableSuspenseInstance;
function tryToClaimNextHydratableFormMarkerInstance(fiber) {
    if (!(0, react_fiber_hydration_is_hydrating_1.isHydrating)()) {
        return false;
    }
    if ((0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstance)()) {
        var markerInstance = canHydrateFormStateMarker((0, react_fiber_hydration_context_next_instance_1.getNextHydratableInstanceSafe)(), (0, react_fiber_hydration_context_root_or_singleton_1.hasRootOrSingletonContextFlag)());
        if (markerInstance) {
            // Found the marker instance.
            (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getNextHydratableSibling(markerInstance));
            // Return true if this marker instance should use the state passed
            // to hydrateRoot.
            // TODO: As an optimization, Fizz should only emit these markers if form
            // state is passed at the root.
            return isFormStateMarkerMatching(markerInstance);
        }
    }
    // Should have found a marker instance. Throw an error to trigger client
    // rendering. We don't bother to check if we're in a concurrent root because
    // useFormState is a new API, so backwards compat is not an issue.
    (0, react_fiber_hydration_context_mismatch_1.throwOnHydrationMismatch)(fiber);
    return false;
}
exports.tryToClaimNextHydratableFormMarkerInstance = tryToClaimNextHydratableFormMarkerInstance;
