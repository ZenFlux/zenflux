"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotPendingTransition = exports.waitForCommitToBeReady = exports.suspendInstance = exports.startSuspendingCommit = exports.preloadInstance = exports.maySuspendCommit = exports.requestPostPaintCallback = exports.logRecoverableError = exports.detachDeletedInstance = exports.getInstanceFromScope = exports.prepareScopeUpdate = exports.preparePortalMount = exports.afterActiveInstanceBlur = exports.beforeActiveInstanceBlur = exports.getInstanceFromNode = exports.unhideTextInstance = exports.unhideInstance = exports.hideTextInstance = exports.hideInstance = exports.removeChildFromContainer = exports.insertInContainerBefore = exports.appendChildToContainer = exports.resetTextContent = exports.commitTextUpdate = exports.commitMount = exports.commitUpdate = exports.supportsMutation = exports.noTimeout = exports.cancelTimeout = exports.scheduleTimeout = exports.warnsIfNotActing = exports.isPrimaryRenderer = exports.shouldAttemptEagerTransition = exports.getCurrentEventPriority = exports.createTextInstance = exports.shouldSetTextContent = exports.finalizeInitialChildren = exports.appendInitialChild = exports.createInstance = exports.resetAfterCommit = exports.prepareForCommit = exports.getChildHostContext = exports.getRootHostContext = exports.clearContainer = exports.removeChild = exports.insertBefore = exports.appendChild = exports.getPublicInstance = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var NO_CONTEXT = {};
var nodeToInstanceMap = new WeakMap();
function getPublicInstance(inst) {
    switch (inst.tag) {
        case "INSTANCE":
            var createNodeMock = inst.rootContainerInstance.createNodeMock;
            var mockNode = createNodeMock({
                type: inst.type,
                props: inst.props,
            });
            if (typeof mockNode === "object" && mockNode !== null) {
                nodeToInstanceMap.set(mockNode, inst);
            }
            return mockNode;
        default:
            return inst;
    }
}
exports.getPublicInstance = getPublicInstance;
function appendChild(parentInstance, child) {
    if (__DEV__) {
        if (!Array.isArray(parentInstance.children)) {
            console.error("An invalid container has been provided. " +
                "This may indicate that another renderer is being used in addition to the test renderer. " +
                "(For example, ReactDOM.createPortal inside of a ReactTestRenderer tree.) " +
                "This is not supported.");
        }
    }
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
        parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
}
exports.appendChild = appendChild;
function insertBefore(parentInstance, child, beforeChild) {
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
        parentInstance.children.splice(index, 1);
    }
    var beforeIndex = parentInstance.children.indexOf(beforeChild);
    parentInstance.children.splice(beforeIndex, 0, child);
}
exports.insertBefore = insertBefore;
function removeChild(parentInstance, child) {
    var index = parentInstance.children.indexOf(child);
    parentInstance.children.splice(index, 1);
}
exports.removeChild = removeChild;
function clearContainer(container) {
    container.children.splice(0);
}
exports.clearContainer = clearContainer;
function getRootHostContext(rootContainerInstance) {
    return NO_CONTEXT;
}
exports.getRootHostContext = getRootHostContext;
function getChildHostContext(parentHostContext, type) {
    return NO_CONTEXT;
}
exports.getChildHostContext = getChildHostContext;
function prepareForCommit(containerInfo) {
    // noop
    return null;
}
exports.prepareForCommit = prepareForCommit;
function resetAfterCommit(containerInfo) {
    // noop
}
exports.resetAfterCommit = resetAfterCommit;
function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    return {
        type: type,
        props: props,
        isHidden: false,
        children: [],
        internalInstanceHandle: internalInstanceHandle,
        rootContainerInstance: rootContainerInstance,
        tag: "INSTANCE",
    };
}
exports.createInstance = createInstance;
function appendInitialChild(parentInstance, child) {
    var index = parentInstance.children.indexOf(child);
    if (index !== -1) {
        parentInstance.children.splice(index, 1);
    }
    parentInstance.children.push(child);
}
exports.appendInitialChild = appendInitialChild;
function finalizeInitialChildren(testElement, type, props, rootContainerInstance, hostContext) {
    return false;
}
exports.finalizeInitialChildren = finalizeInitialChildren;
function shouldSetTextContent(type, props) {
    return false;
}
exports.shouldSetTextContent = shouldSetTextContent;
function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    return {
        text: text,
        isHidden: false,
        tag: "TEXT",
    };
}
exports.createTextInstance = createTextInstance;
function getCurrentEventPriority() {
    return react_event_priorities_1.DefaultEventPriority;
}
exports.getCurrentEventPriority = getCurrentEventPriority;
function shouldAttemptEagerTransition() {
    return false;
}
exports.shouldAttemptEagerTransition = shouldAttemptEagerTransition;
exports.isPrimaryRenderer = false;
exports.warnsIfNotActing = true;
exports.scheduleTimeout = setTimeout;
exports.cancelTimeout = clearTimeout;
exports.noTimeout = -1;
// -------------------
//     Mutation
// -------------------
exports.supportsMutation = true;
function commitUpdate(instance, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
    instance.type = type;
    instance.props = newProps;
}
exports.commitUpdate = commitUpdate;
function commitMount(instance, type, newProps, internalInstanceHandle) {
    // noop
}
exports.commitMount = commitMount;
function commitTextUpdate(textInstance, oldText, newText) {
    textInstance.text = newText;
}
exports.commitTextUpdate = commitTextUpdate;
function resetTextContent(testElement) {
    // noop
}
exports.resetTextContent = resetTextContent;
exports.appendChildToContainer = appendChild;
exports.insertInContainerBefore = insertBefore;
exports.removeChildFromContainer = removeChild;
function hideInstance(instance) {
    instance.isHidden = true;
}
exports.hideInstance = hideInstance;
function hideTextInstance(textInstance) {
    textInstance.isHidden = true;
}
exports.hideTextInstance = hideTextInstance;
function unhideInstance(instance, props) {
    instance.isHidden = false;
}
exports.unhideInstance = unhideInstance;
function unhideTextInstance(textInstance, text) {
    textInstance.isHidden = false;
}
exports.unhideTextInstance = unhideTextInstance;
function getInstanceFromNode(mockNode) {
    var instance = nodeToInstanceMap.get(mockNode);
    if (instance !== undefined) {
        return instance.internalInstanceHandle;
    }
    return null;
}
exports.getInstanceFromNode = getInstanceFromNode;
function beforeActiveInstanceBlur(internalInstanceHandle) {
    // noop
}
exports.beforeActiveInstanceBlur = beforeActiveInstanceBlur;
function afterActiveInstanceBlur() {
    // noop
}
exports.afterActiveInstanceBlur = afterActiveInstanceBlur;
function preparePortalMount(portalInstance) {
    // noop
}
exports.preparePortalMount = preparePortalMount;
function prepareScopeUpdate(scopeInstance, inst) {
    nodeToInstanceMap.set(scopeInstance, inst);
}
exports.prepareScopeUpdate = prepareScopeUpdate;
function getInstanceFromScope(scopeInstance) {
    return nodeToInstanceMap.get(scopeInstance) || null;
}
exports.getInstanceFromScope = getInstanceFromScope;
function detachDeletedInstance(node) {
    // noop
}
exports.detachDeletedInstance = detachDeletedInstance;
function logRecoverableError(error) {
    // noop
}
exports.logRecoverableError = logRecoverableError;
function requestPostPaintCallback(callback) {
    // noop
}
exports.requestPostPaintCallback = requestPostPaintCallback;
function maySuspendCommit(type, props) {
    return false;
}
exports.maySuspendCommit = maySuspendCommit;
function preloadInstance(type, props) {
    // Return true to indicate it's already loaded
    return true;
}
exports.preloadInstance = preloadInstance;
function startSuspendingCommit() {
}
exports.startSuspendingCommit = startSuspendingCommit;
function suspendInstance(type, props) {
}
exports.suspendInstance = suspendInstance;
function waitForCommitToBeReady() {
    return null;
}
exports.waitForCommitToBeReady = waitForCommitToBeReady;
exports.NotPendingTransition = null;
