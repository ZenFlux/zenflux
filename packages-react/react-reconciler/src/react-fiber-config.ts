import * as domConfig from "@zenflux/react-dom-bindings/src/client/react-fiber-config-dom";

import type {
    ChildSet,
    Container,
    HoistableRoot,
    HostContext,
    HydratableInstance,
    Instance,
    NoTimeout,
    Props,
    PublicInstance,
    RendererInspectionConfig,
    Resource,
    TextInstance,
    TimeoutHandle,
    Type,
    UpdatePayload,
} from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

// TODO: Should be configurable
export type {
    ChildSet,
    Container,
    Instance,
    Props,
    HoistableRoot,
    TextInstance,
    UpdatePayload,
    Resource,
    Type,
    HostContext,
    HydratableInstance,
    PublicInstance,
    RendererInspectionConfig,
    NoTimeout,
    TimeoutHandle,
    Fiber, // TODO: Is it the right place?
};

// -------------------
//      BaseConfig
// -------------------
const ReactFiberConfigSupportsSwitchesMethods = [
    "supportsMutation",
    "supportsPersistence",
    "supportsHydration",
    "supportsMicrotasks",
    "supportsTestSelectors",
    "supportsResources",
    "supportsSingletons",
] as const;

type ReactFiberConfigSupportsSwitches<T = boolean> = {
    [ Key in typeof ReactFiberConfigSupportsSwitchesMethods[ number ] ]: T;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ReactFiberConfigBaseMethods = [
    "getPublicInstance",
    "getRootHostContext",
    "getChildHostContext",
    "prepareForCommit",
    "resetAfterCommit",
    "createInstance",
    "appendInitialChild",
    "finalizeInitialChildren",
    "shouldSetTextContent",
    "createTextInstance",
    "scheduleTimeout",
    "cancelTimeout",
    "noTimeout",
    "isPrimaryRenderer",
    "warnsIfNotActing",

    "getInstanceFromNode",
    "beforeActiveInstanceBlur",
    "afterActiveInstanceBlur",
    "preparePortalMount",
    "prepareScopeUpdate",
    "getInstanceFromScope",
    "getCurrentEventPriority",
    "shouldAttemptEagerTransition",
    "detachDeletedInstance",
    "requestPostPaintCallback",
    "maySuspendCommit",
    "preloadInstance",
    "startSuspendingCommit",
    "suspendInstance",
    "waitForCommitToBeReady",
    "NotPendingTransition",
] as const;

type ReactFiberConfigBaseMethodsType = {
    [ Key in typeof ReactFiberConfigBaseMethods[ number ] ]: typeof domConfig[ Key ];
}

type ReactFiberConfigBase = ReactFiberConfigBaseMethodsType & ReactFiberConfigSupportsSwitches;

// -------------------
//      Mutation
// -------------------
const ReactFiberConfigMutationMethods = [
    "appendChild",
    "appendChildToContainer",
    "insertBefore",
    "insertInContainerBefore",
    "removeChild",
    "removeChildFromContainer",
    "resetTextContent",
    "commitTextUpdate",
    "commitMount",
    "commitUpdate",
    "hideInstance",
    "hideTextInstance",
    "unhideInstance",
    "unhideTextInstance",
    "clearContainer",
] as const;

type MutationReconcilerConfig = {
    [ Key in typeof ReactFiberConfigMutationMethods[ number ] ]: typeof domConfig[ Key ];
}

// -------------------
//      Persistent
// -------------------
const ReactFiberConfigPersistentMethods = [
    "cloneInstance",
    "createContainerChildSet",
    "appendChildToContainerChildSet",
    "finalizeContainerChildren",
    "replaceContainerChildren",
    "cloneHiddenInstance",
    "cloneHiddenTextInstance",
] as const;

type ReactFiberConfigPersistentMethods = typeof ReactFiberConfigPersistentMethods[number];

type CloneInstance = (
    instance: Instance,
    type: Type,
    oldProps: Props,
    newProps: Props,
    keepChildren: boolean,
    newChildSet: null | ChildSet,
) => Instance;

type CreateContainerChildSet = (container?: Container) => ChildSet;

type AppendChildToContainerChildSet = (childSet: ChildSet, child: Instance | TextInstance) => void;

type FinalizeContainerChildren = (container: Container, newChildren: ChildSet) => void;

type ReplaceContainerChildren = (container: Container, newChildren: ChildSet) => void;

type CloneHiddenInstance = (
    instance: Instance,
    type: Type,
    props: Props,
) => Instance;

type CloneHiddenTextInstance = (
    instance: Instance,
    text: Type,
) => TextInstance;

type PersistentReconcilerConfig = {
    cloneInstance: CloneInstance;
    createContainerChildSet: CreateContainerChildSet;
    appendChildToContainerChildSet: AppendChildToContainerChildSet;
    finalizeContainerChildren: FinalizeContainerChildren;
    replaceContainerChildren: ReplaceContainerChildren;
    cloneHiddenInstance: CloneHiddenInstance;
    cloneHiddenTextInstance: CloneHiddenTextInstance;
}

// -------------------
//      Hydration
// -------------------
const ReactFiberConfigHydrationMethods = [
    "isHydratableText",
    "isSuspenseInstancePending",
    "isSuspenseInstanceFallback",
    "getSuspenseInstanceFallbackErrorDetails",
    "registerSuspenseInstanceRetry",
    "canHydrateFormStateMarker",
    "isFormStateMarkerMatching",
    "getNextHydratableSibling",
    "getFirstHydratableChild",
    "getFirstHydratableChildWithinContainer",
    "getFirstHydratableChildWithinSuspenseInstance",
    "canHydrateInstance",
    "canHydrateTextInstance",
    "canHydrateSuspenseInstance",
    "hydrateInstance",
    "hydrateTextInstance",
    "hydrateSuspenseInstance",
    "getNextHydratableInstanceAfterSuspenseInstance",
    "commitHydratedContainer",
    "commitHydratedSuspenseInstance",
    "clearSuspenseBoundary",
    "clearSuspenseBoundaryFromContainer",
    "shouldDeleteUnhydratedTailInstances",
    "didNotMatchHydratedContainerTextInstance",
    "didNotMatchHydratedTextInstance",
    "didNotHydrateInstanceWithinContainer",
    "didNotHydrateInstanceWithinSuspenseInstance",
    "didNotHydrateInstance",
    "didNotFindHydratableInstanceWithinContainer",
    "didNotFindHydratableTextInstanceWithinContainer",
    "didNotFindHydratableSuspenseInstanceWithinContainer",
    "didNotFindHydratableInstanceWithinSuspenseInstance",
    "didNotFindHydratableTextInstanceWithinSuspenseInstance",
    "didNotFindHydratableSuspenseInstanceWithinSuspenseInstance",
    "didNotFindHydratableInstance",
    "didNotFindHydratableTextInstance",
    "didNotFindHydratableSuspenseInstance",
    "errorHydratingContainer",
] as const;

type HydrationReconcilerConfig = {
    [ Key in typeof ReactFiberConfigHydrationMethods[ number ] ]: typeof domConfig[ Key ];
}
// -------------------
//      Microtask
// -------------------
const ReactFiberConfigMicrotaskMethods = [
    "scheduleMicrotask",
] as const;

type MicrotaskReconcilerConfig = {
    [ Key in typeof ReactFiberConfigMicrotaskMethods[ number ] ]: typeof domConfig[ Key ];
}

// -------------------
//      TestSelector
// -------------------
const ReactFiberConfigTestSelectorMethods = [
    "findFiberRoot",
    "getBoundingRect",
    "getTextContent",
    "isHiddenSubtree",
    "matchAccessibilityRole",
    "setFocusIfFocusable",
    "setupIntersectionObserver",
] as const;

type TestSelectorReconcilerConfig = {
    [ Key in typeof ReactFiberConfigTestSelectorMethods[ number ] ]: typeof domConfig[ Key ];
}
// -------------------
//      Resource
// -------------------
const ReactFiberConfigResourceMethods = [
    "isHostHoistableType",
    "getHoistableRoot",
    "getResource",
    "acquireResource",
    "releaseResource",
    "hydrateHoistable",
    "mountHoistable",
    "unmountHoistable",
    "createHoistableInstance",
    "prepareToCommitHoistables",
    "mayResourceSuspendCommit",
    "preloadResource",
    "suspendResource",
] as const;

type ResourceReconcilerConfig = {
    [ Key in typeof ReactFiberConfigResourceMethods[ number ] ]: typeof domConfig[ Key ];
}

// -------------------
//      Singleton
// -------------------
const ReactFiberConfigSingletonMethods = [
    "resolveSingletonInstance",
    "clearSingleton",
    "acquireSingletonInstance",
    "releaseSingletonInstance",
    "isHostSingletonType",
] as const;

type SingletonReconcilerConfig = {
    [ Key in typeof ReactFiberConfigSingletonMethods[ number ] ]: typeof domConfig[ Key ];
}
// -------------------
//      General
// -------------------
type TPossibleMethods =
    typeof ReactFiberConfigMutationMethods |
    typeof ReactFiberConfigPersistentMethods |
    typeof ReactFiberConfigHydrationMethods |
    typeof ReactFiberConfigMicrotaskMethods |
    typeof ReactFiberConfigTestSelectorMethods |
    typeof ReactFiberConfigResourceMethods |
    typeof ReactFiberConfigSingletonMethods;

export type ReactReconcilerConfig = ReactFiberConfigBase &
    MutationReconcilerConfig &
    PersistentReconcilerConfig &
    HydrationReconcilerConfig &
    MicrotaskReconcilerConfig &
    TestSelectorReconcilerConfig &
    ResourceReconcilerConfig &
    SingletonReconcilerConfig;

declare global {
    namespace globalThis {
        var __RECONCILER__CONFIG_INTERNAL__: ReactReconcilerConfig;
    }
}
class ReactFiberConfig implements ReactReconcilerConfig {
    public supportsMutation: ReactFiberConfigBase[ "supportsMutation" ];
    public supportsPersistence: ReactFiberConfigBase[ "supportsPersistence" ];
    public supportsHydration: ReactFiberConfigBase[ "supportsHydration" ];
    public supportsMicrotasks: ReactFiberConfigBase[ "supportsMicrotasks" ];
    public supportsTestSelectors: ReactFiberConfigBase[ "supportsTestSelectors" ];
    public supportsResources: ReactFiberConfigBase[ "supportsResources" ];
    public supportsSingletons: ReactFiberConfigBase[ "supportsSingletons" ];

    public getPublicInstance: ReactFiberConfigBase["getPublicInstance"];
    public getRootHostContext: ReactFiberConfigBase["getRootHostContext"];
    public getChildHostContext: ReactFiberConfigBase["getChildHostContext"];
    public prepareForCommit: ReactFiberConfigBase["prepareForCommit"];
    public resetAfterCommit: ReactFiberConfigBase["resetAfterCommit"];
    public createInstance: ReactFiberConfigBase["createInstance"];
    public appendInitialChild: ReactFiberConfigBase["appendInitialChild"];
    public finalizeInitialChildren: ReactFiberConfigBase["finalizeInitialChildren"];
    public shouldSetTextContent: ReactFiberConfigBase["shouldSetTextContent"];
    public createTextInstance: ReactFiberConfigBase["createTextInstance"];
    public scheduleTimeout: ReactFiberConfigBase["scheduleTimeout"];
    public cancelTimeout: ReactFiberConfigBase["cancelTimeout"];
    public noTimeout: ReactFiberConfigBase["noTimeout"];
    public isPrimaryRenderer: ReactFiberConfigBase["isPrimaryRenderer"];
    public warnsIfNotActing: ReactFiberConfigBase["warnsIfNotActing"];
    public getInstanceFromNode: ReactFiberConfigBase["getInstanceFromNode"];
    public beforeActiveInstanceBlur: ReactFiberConfigBase["beforeActiveInstanceBlur"];
    public afterActiveInstanceBlur: ReactFiberConfigBase["afterActiveInstanceBlur"];
    public preparePortalMount: ReactFiberConfigBase["preparePortalMount"];
    public prepareScopeUpdate: ReactFiberConfigBase["prepareScopeUpdate"];
    public getInstanceFromScope: ReactFiberConfigBase["getInstanceFromScope"];
    public getCurrentEventPriority: ReactFiberConfigBase["getCurrentEventPriority"];
    public shouldAttemptEagerTransition: ReactFiberConfigBase["shouldAttemptEagerTransition"];
    public detachDeletedInstance: ReactFiberConfigBase["detachDeletedInstance"];
    public requestPostPaintCallback: ReactFiberConfigBase["requestPostPaintCallback"];
    public maySuspendCommit: ReactFiberConfigBase["maySuspendCommit"];
    public preloadInstance: ReactFiberConfigBase["preloadInstance"];
    public startSuspendingCommit: ReactFiberConfigBase["startSuspendingCommit"];
    public suspendInstance: ReactFiberConfigBase["suspendInstance"];
    public waitForCommitToBeReady: ReactFiberConfigBase["waitForCommitToBeReady"];
    public NotPendingTransition: ReactFiberConfigBase["NotPendingTransition"];
    // -------------------
    //      Microtasks (optional)
    // -------------------
    public scheduleMicrotask: MicrotaskReconcilerConfig["scheduleMicrotask"];
    // -------------------
    //      Test selectors (optional)
    // -------------------
    public findFiberRoot: TestSelectorReconcilerConfig["findFiberRoot"];
    public getBoundingRect: TestSelectorReconcilerConfig["getBoundingRect"];
    public getTextContent: TestSelectorReconcilerConfig["getTextContent"];
    public isHiddenSubtree: TestSelectorReconcilerConfig["isHiddenSubtree"];
    public matchAccessibilityRole: TestSelectorReconcilerConfig["matchAccessibilityRole"];
    public setFocusIfFocusable: TestSelectorReconcilerConfig["setFocusIfFocusable"];
    public setupIntersectionObserver: TestSelectorReconcilerConfig["setupIntersectionObserver"];
    // -------------------
    //      Mutation (optional)
    // -------------------
    public appendChild: MutationReconcilerConfig["appendChild"];
    public appendChildToContainer: MutationReconcilerConfig["appendChildToContainer"];
    public insertBefore: MutationReconcilerConfig["insertBefore"];
    public insertInContainerBefore: MutationReconcilerConfig["insertInContainerBefore"];
    public removeChild: MutationReconcilerConfig["removeChild"];
    public removeChildFromContainer: MutationReconcilerConfig["removeChildFromContainer"];
    public resetTextContent: MutationReconcilerConfig["resetTextContent"];
    public commitTextUpdate: MutationReconcilerConfig["commitTextUpdate"];
    public commitMount: MutationReconcilerConfig["commitMount"];
    public commitUpdate: MutationReconcilerConfig["commitUpdate"];
    public hideInstance: MutationReconcilerConfig["hideInstance"];
    public hideTextInstance: MutationReconcilerConfig["hideTextInstance"];
    public unhideInstance: MutationReconcilerConfig["unhideInstance"];
    public unhideTextInstance: MutationReconcilerConfig["unhideTextInstance"];
    public clearContainer: MutationReconcilerConfig["clearContainer"];
    // -------------------
    //      Persistent (optional)
    // -------------------
    public cloneInstance: PersistentReconcilerConfig[ "cloneInstance" ];
    public createContainerChildSet: PersistentReconcilerConfig[ "createContainerChildSet" ];
    public appendChildToContainerChildSet: PersistentReconcilerConfig[ "appendChildToContainerChildSet" ];
    public finalizeContainerChildren: PersistentReconcilerConfig[ "finalizeContainerChildren" ];
    public replaceContainerChildren: PersistentReconcilerConfig[ "replaceContainerChildren" ];
    public cloneHiddenInstance: PersistentReconcilerConfig[ "cloneHiddenInstance" ];
    public cloneHiddenTextInstance: PersistentReconcilerConfig[ "cloneHiddenTextInstance" ];
    // -------------------
    //      Hydration (optional)
    // -------------------
    public isHydratableText: HydrationReconcilerConfig["isHydratableText"];
    public isSuspenseInstancePending: HydrationReconcilerConfig["isSuspenseInstancePending"];
    public isSuspenseInstanceFallback: HydrationReconcilerConfig["isSuspenseInstanceFallback"];
    public getSuspenseInstanceFallbackErrorDetails: HydrationReconcilerConfig["getSuspenseInstanceFallbackErrorDetails"];
    public registerSuspenseInstanceRetry: HydrationReconcilerConfig["registerSuspenseInstanceRetry"];
    public canHydrateFormStateMarker: HydrationReconcilerConfig["canHydrateFormStateMarker"];
    public isFormStateMarkerMatching: HydrationReconcilerConfig["isFormStateMarkerMatching"];
    public getNextHydratableSibling: HydrationReconcilerConfig["getNextHydratableSibling"];
    public getFirstHydratableChild: HydrationReconcilerConfig["getFirstHydratableChild"];
    public getFirstHydratableChildWithinContainer: HydrationReconcilerConfig["getFirstHydratableChildWithinContainer"];
    public getFirstHydratableChildWithinSuspenseInstance: HydrationReconcilerConfig["getFirstHydratableChildWithinSuspenseInstance"];
    public canHydrateInstance: HydrationReconcilerConfig["canHydrateInstance"];
    public canHydrateTextInstance: HydrationReconcilerConfig["canHydrateTextInstance"];
    public canHydrateSuspenseInstance: HydrationReconcilerConfig["canHydrateSuspenseInstance"];
    public hydrateInstance: HydrationReconcilerConfig["hydrateInstance"];
    public hydrateTextInstance: HydrationReconcilerConfig["hydrateTextInstance"];
    public hydrateSuspenseInstance: HydrationReconcilerConfig["hydrateSuspenseInstance"];
    public getNextHydratableInstanceAfterSuspenseInstance: HydrationReconcilerConfig["getNextHydratableInstanceAfterSuspenseInstance"];
    public commitHydratedContainer: HydrationReconcilerConfig["commitHydratedContainer"];
    public commitHydratedSuspenseInstance: HydrationReconcilerConfig["commitHydratedSuspenseInstance"];
    public clearSuspenseBoundary: HydrationReconcilerConfig["clearSuspenseBoundary"];
    public clearSuspenseBoundaryFromContainer: HydrationReconcilerConfig["clearSuspenseBoundaryFromContainer"];
    public shouldDeleteUnhydratedTailInstances: HydrationReconcilerConfig["shouldDeleteUnhydratedTailInstances"];
    public didNotMatchHydratedContainerTextInstance: HydrationReconcilerConfig["didNotMatchHydratedContainerTextInstance"];
    public didNotMatchHydratedTextInstance: HydrationReconcilerConfig["didNotMatchHydratedTextInstance"];
    public didNotHydrateInstanceWithinContainer: HydrationReconcilerConfig["didNotHydrateInstanceWithinContainer"];
    public didNotHydrateInstanceWithinSuspenseInstance: HydrationReconcilerConfig["didNotHydrateInstanceWithinSuspenseInstance"];
    public didNotHydrateInstance: HydrationReconcilerConfig["didNotHydrateInstance"];
    public didNotFindHydratableInstanceWithinContainer: HydrationReconcilerConfig["didNotFindHydratableInstanceWithinContainer"];
    public didNotFindHydratableTextInstanceWithinContainer: HydrationReconcilerConfig["didNotFindHydratableTextInstanceWithinContainer"];
    public didNotFindHydratableSuspenseInstanceWithinContainer: HydrationReconcilerConfig["didNotFindHydratableSuspenseInstanceWithinContainer"];
    public didNotFindHydratableInstanceWithinSuspenseInstance: HydrationReconcilerConfig["didNotFindHydratableInstanceWithinSuspenseInstance"];
    public didNotFindHydratableTextInstanceWithinSuspenseInstance: HydrationReconcilerConfig["didNotFindHydratableTextInstanceWithinSuspenseInstance"];
    public didNotFindHydratableSuspenseInstanceWithinSuspenseInstance: HydrationReconcilerConfig["didNotFindHydratableSuspenseInstanceWithinSuspenseInstance"];
    public didNotFindHydratableInstance: HydrationReconcilerConfig["didNotFindHydratableInstance"];
    public didNotFindHydratableTextInstance: HydrationReconcilerConfig["didNotFindHydratableTextInstance"];
    public didNotFindHydratableSuspenseInstance: HydrationReconcilerConfig["didNotFindHydratableSuspenseInstance"];
    public errorHydratingContainer: HydrationReconcilerConfig["errorHydratingContainer"];
    // -------------------
    //      Resource (optional)
    // -------------------
    public isHostHoistableType: ResourceReconcilerConfig["isHostHoistableType"];
    public getHoistableRoot: ResourceReconcilerConfig["getHoistableRoot"];
    public getResource: ResourceReconcilerConfig["getResource"];
    public acquireResource: ResourceReconcilerConfig["acquireResource"];
    public releaseResource: ResourceReconcilerConfig["releaseResource"];
    public hydrateHoistable: ResourceReconcilerConfig["hydrateHoistable"];
    public mountHoistable: ResourceReconcilerConfig["mountHoistable"];
    public unmountHoistable: ResourceReconcilerConfig["unmountHoistable"];
    public createHoistableInstance: ResourceReconcilerConfig["createHoistableInstance"];
    public prepareToCommitHoistables: ResourceReconcilerConfig["prepareToCommitHoistables"];
    public mayResourceSuspendCommit: ResourceReconcilerConfig["mayResourceSuspendCommit"];
    public preloadResource: ResourceReconcilerConfig["preloadResource"];
    public suspendResource: ResourceReconcilerConfig["suspendResource"];
    // -------------------
    //      Singleton (optional)
    // -------------------
    public resolveSingletonInstance: SingletonReconcilerConfig["resolveSingletonInstance"];
    public clearSingleton: SingletonReconcilerConfig["clearSingleton"];
    public acquireSingletonInstance: SingletonReconcilerConfig["acquireSingletonInstance"];
    public releaseSingletonInstance: SingletonReconcilerConfig["releaseSingletonInstance"];
    public isHostSingletonType: SingletonReconcilerConfig["isHostSingletonType"];

    private config: Partial<ReactReconcilerConfig> = {};
    private configInternal: ReactReconcilerConfig = {
        ... domConfig,
        ... {
            supportsPersistence: false
        },
    } as any;

    public constructor() {
        // The issue is that on require this file it asks for all implementation methods, while some of them are optional.
        // To handle this we need to call only required constants

        if ( "undefined" !== typeof globalThis.__RECONCILER__CONFIG_INTERNAL__ ) {
            throw new Error( "ReactFiberConfig should be initialized only once" );
        }

        globalThis.__RECONCILER__CONFIG_INTERNAL__ = this.configInternal;

        this.config = {
            ... this.configInternal,
            ... typeof globalThis.__RECONCILER__CONFIG__ !== "undefined" ? globalThis.__RECONCILER__CONFIG__ : {},
        };

        this.initialize();
    }

    private initialize() {
        const methodsAccordingToSupports: ReactFiberConfigSupportsSwitches<TPossibleMethods> = {
            supportsMutation: ReactFiberConfigMutationMethods,
            supportsPersistence: ReactFiberConfigPersistentMethods,
            supportsHydration: ReactFiberConfigHydrationMethods,
            supportsMicrotasks: ReactFiberConfigMicrotaskMethods,
            supportsTestSelectors: ReactFiberConfigTestSelectorMethods,
            supportsResources: ReactFiberConfigResourceMethods,
            supportsSingletons: ReactFiberConfigSingletonMethods,
        };

        for ( const supportKey of ReactFiberConfigSupportsSwitchesMethods ) {
            if ( ! this.config[ supportKey ] ) {
                // Disable all not supported methods
                const methods = methodsAccordingToSupports[ supportKey ];

                methods.forEach( ( method ) => {
                    Object.defineProperty( this, method, {
                        get: () => {
                            throw new Error( `Method '${ method }' is not supported, you can enable it via configuration key: ${ supportKey }` );
                        },
                    } );
                } );

                continue;
            }

            // Enable all supported methods
            const methods = methodsAccordingToSupports[ supportKey ];

            methods.forEach( ( method ) => {
                this[ method ] = this.config[ method ];
            } );
        }
    }
}

export default new ReactFiberConfig();
