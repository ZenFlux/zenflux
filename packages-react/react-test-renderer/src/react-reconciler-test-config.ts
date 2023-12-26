/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { DefaultEventPriority } from "@zenflux/react-reconciler/src/react-event-priorities";

import type { EventPriority } from "@zenflux/react-reconciler/src/react-event-priorities";

export type Type = string;
export type Props = Record<string, any>;

export interface Container {
    children: Array<Instance | TextInstance>,
    createNodeMock: Function,
    tag: "CONTAINER",
}

export interface Instance {
    type: string,
    props: Record<string, any>,
    isHidden: boolean,
    children: Array<Instance | TextInstance>,
    internalInstanceHandle: Record<string, any>,
    rootContainerInstance: Container,
    tag: "INSTANCE",
}

export interface TextInstance {
    text: string,
    isHidden: boolean,
    tag: "TEXT",
}

export type HydratableInstance = Instance | TextInstance;
export type PublicInstance = Instance | TextInstance;
export type HostContext = Record<string, any>;
export type UpdatePayload = Record<string, any>;
export type ChildSet = void;
export type TimeoutHandle = number;
export type NoTimeout = -1;
export type EventResponder = any;
export type RendererInspectionConfig = Readonly<{}>;
export type TransitionStatus = any;

const NO_CONTEXT = {};
const nodeToInstanceMap = new WeakMap<any, Instance>();

export function getPublicInstance( inst: Instance | TextInstance ): any {
    switch ( inst.tag ) {
        case "INSTANCE":
            let createNodeMock: Function = inst.rootContainerInstance.createNodeMock;
            let mockNode = createNodeMock( {
                type: inst.type,
                props: inst.props,
            } );
            if ( typeof mockNode === "object" && mockNode !== null ) {
                nodeToInstanceMap.set( mockNode, inst );
            }
            return mockNode;
        default:
            return inst;
    }
}

export function appendChild(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
): void {
    if ( __DEV__ ) {
        if ( ! Array.isArray( parentInstance.children ) ) {
            console.error(
                "An invalid container has been provided. " +
                "This may indicate that another renderer is being used in addition to the test renderer. " +
                "(For example, ReactDOM.createPortal inside of a ReactTestRenderer tree.) " +
                "This is not supported.",
            );
        }
    }
    const index = parentInstance.children.indexOf( child );
    if ( index !== -1 ) {
        parentInstance.children.splice( index, 1 );
    }
    parentInstance.children.push( child );
}

export function insertBefore(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
    beforeChild: Instance | TextInstance,
): void {
    const index = parentInstance.children.indexOf( child );
    if ( index !== -1 ) {
        parentInstance.children.splice( index, 1 );
    }
    const beforeIndex = parentInstance.children.indexOf( beforeChild );
    parentInstance.children.splice( beforeIndex, 0, child );
}

export function removeChild(
    parentInstance: Instance | Container,
    child: Instance | TextInstance,
): void {
    const index = parentInstance.children.indexOf( child );
    parentInstance.children.splice( index, 1 );
}

export function clearContainer( container: Container ): void {
    container.children.splice( 0 );
}

export function getRootHostContext(
    rootContainerInstance: Container,
): HostContext {
    return NO_CONTEXT;
}

export function getChildHostContext(
    parentHostContext: HostContext,
    type: string,
): HostContext {
    return NO_CONTEXT;
}

export function prepareForCommit( containerInfo: Container ): null | Object {
    // noop
    return null;
}

export function resetAfterCommit( containerInfo: Container ): void {
    // noop
}

export function createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object,
): Instance {
    return {
        type,
        props,
        isHidden: false,
        children: [],
        internalInstanceHandle,
        rootContainerInstance,
        tag: "INSTANCE",
    };
}

export function appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
): void {
    const index = parentInstance.children.indexOf( child );
    if ( index !== -1 ) {
        parentInstance.children.splice( index, 1 );
    }
    parentInstance.children.push( child );
}

export function finalizeInitialChildren(
    testElement: Instance,
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: Object,
): boolean {
    return false;
}

export function shouldSetTextContent( type: string, props: Props ): boolean {
    return false;
}

export function createTextInstance(
    text: string,
    rootContainerInstance: Container,
    hostContext: Object,
    internalInstanceHandle: Object,
): TextInstance {
    return {
        text,
        isHidden: false,
        tag: "TEXT",
    };
}

export function getCurrentEventPriority(): EventPriority {
    return DefaultEventPriority;
}

export function shouldAttemptEagerTransition(): boolean {
    return false;
}

export const isPrimaryRenderer = false;
export const warnsIfNotActing = true;

export const scheduleTimeout = setTimeout;
export const cancelTimeout = clearTimeout;

export const noTimeout = -1;

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function commitUpdate(
    instance: Instance,
    updatePayload: null | Record<string, any>,
    type: string,
    oldProps: Props,
    newProps: Props,
    internalInstanceHandle: Record<string, any>,
): void {
    instance.type = type;
    instance.props = newProps;
}

export function commitMount(
    instance: Instance,
    type: string,
    newProps: Props,
    internalInstanceHandle: Object,
): void {
    // noop
}

export function commitTextUpdate(
    textInstance: TextInstance,
    oldText: string,
    newText: string,
): void {
    textInstance.text = newText;
}

export function resetTextContent( testElement: Instance ): void {
    // noop
}

export const appendChildToContainer = appendChild;
export const insertInContainerBefore = insertBefore;
export const removeChildFromContainer = removeChild;

export function hideInstance( instance: Instance ): void {
    instance.isHidden = true;
}

export function hideTextInstance( textInstance: TextInstance ): void {
    textInstance.isHidden = true;
}

export function unhideInstance( instance: Instance, props: Props ): void {
    instance.isHidden = false;
}

export function unhideTextInstance(
    textInstance: TextInstance,
    text: string,
): void {
    textInstance.isHidden = false;
}

export function getInstanceFromNode( mockNode: Object ): Object | null {
    const instance = nodeToInstanceMap.get( mockNode );
    if ( instance !== undefined ) {
        return instance.internalInstanceHandle;
    }
    return null;
}

export function beforeActiveInstanceBlur( internalInstanceHandle: Object ) {
    // noop
}

export function afterActiveInstanceBlur() {
    // noop
}

export function preparePortalMount( portalInstance: Instance ): void {
    // noop
}

export function prepareScopeUpdate( scopeInstance: Object, inst: Instance ): void {
    nodeToInstanceMap.set( scopeInstance, inst );
}

export function getInstanceFromScope( scopeInstance: Object ): null | Object {
    return nodeToInstanceMap.get( scopeInstance ) || null;
}

export function detachDeletedInstance( node: Instance ): void {
    // noop
}

export function logRecoverableError( error: any ): void {
    // noop
}

export function requestPostPaintCallback( callback: ( time: number ) => void ) {
    // noop
}

export function maySuspendCommit( type: Type, props: Props ): boolean {
    return false;
}

export function preloadInstance( type: Type, props: Props ): boolean {
    // Return true to indicate it's already loaded
    return true;
}

export function startSuspendingCommit(): void {
}

export function suspendInstance( type: Type, props: Props ): void {
}

export function waitForCommitToBeReady(): null {
    return null;
}

export const NotPendingTransition: TransitionStatus = null;
