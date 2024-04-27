import type { RootTag } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import type {
    Container,
    Instance,
    PublicInstance,
    ReactReconcilerConfig,
    TextInstance
} from "@zenflux/react-reconciler/src/react-fiber-config";

import type * as ReactFiberReconciler from "@zenflux/react-reconciler/src/react-fiber-reconciler";

import type {
    Fiber,
    FiberRoot, Lane,
    SuspenseHydrationCallbacks,
    TransitionTracingCallbacks,
} from "@zenflux/react-shared/src/react-internal-types";

import type {
    BoundingRect,
    ComponentSelector,
    HasPseudoClassSelector,
    IntersectionObserverOptions,
    React$AbstractComponent,
    RoleSelector,
    Selector,
    TestNameSelector,
    TextSelector,
} from "@zenflux/react-reconciler/src/react-test-selectors";

import type { Component } from "@zenflux/react-shared/src/component";
import type { ReactNodeList, ReactPortal, } from "@zenflux/react-shared/src/react-types";

declare global {
    namespace globalThis {
        var __RECONCILER__CONFIG__: ReactReconcilerConfig;
    }
}

export type {
    Fiber,
    Container,
};

type LanePriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;

type MutableSource = any;

export class ZenFluxReactReconciler {
    private reconciler: typeof ReactFiberReconciler;

    private readonly initPromise: Promise<any>;

    public constructor( private config?: Partial<ReactReconcilerConfig> ) {
        if ( config ) {
            globalThis.__RECONCILER__CONFIG__ = config as ReactReconcilerConfig;
        }

        this.initPromise = import( "./react-fiber-reconciler" ).then( r => this.reconciler = r );
    }

    public waitForInitialize(): Promise<void> {
        return this.initPromise;
    }

    public attemptContinuousHydration( fiber: Fiber ): void {
        return this.reconciler.attemptContinuousHydration( fiber );
    };

    public attemptDiscreteHydration( fiber: Fiber ): void {
        return this.reconciler.attemptDiscreteHydration( fiber ); // Not implemented
    }

    public attemptHydrationAtCurrentPriority( fiber: Fiber ): void {
        return this.reconciler.attemptHydrationAtCurrentPriority( fiber );
    }

    public attemptSynchronousHydration( fiber: Fiber ): void {
        return this.reconciler.attemptSynchronousHydration( fiber );
    }

    public batchedUpdates<A, R>( fn: ( a: A ) => R, a: A ): R {
        return this.reconciler.batchedUpdates<A, R>( fn, a );
    }

    public createComponentSelector( component: React$AbstractComponent<never, unknown> ): ComponentSelector {
        return this.reconciler.createComponentSelector( component );
    }

    public createContainer( containerInfo: Container, tag: RootTag, hydrationCallbacks: SuspenseHydrationCallbacks | null, isStrictMode: boolean, concurrentUpdatesByDefaultOverride: boolean | null, identifierPrefix: string, onRecoverableError: ( error: Error ) => void, transitionCallbacks: TransitionTracingCallbacks | null ): ReactFiberReconciler.OpaqueRoot {
        return this.reconciler.createContainer( containerInfo, tag, hydrationCallbacks as SuspenseHydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks );
    }

    public createHasPseudoClassSelector( selectors: Selector[] ): HasPseudoClassSelector {
        return this.reconciler.createHasPseudoClassSelector( selectors );
    }

    public createHydrationContainer(
        initialChildren: ReactNodeList, callback: ( () => void ) | null | undefined,
        containerInfo: Container,
        tag: RootTag,
        hydrationCallbacks: SuspenseHydrationCallbacks | null,
        isStrictMode: boolean,
        concurrentUpdatesByDefaultOverride: boolean | null,
        identifierPrefix: string,
        onRecoverableError: ( error: Error ) => void,
        transitionCallbacks: TransitionTracingCallbacks | null
    ): ReactFiberReconciler.OpaqueRoot {
        return this.reconciler.createHydrationContainer(
            initialChildren,
            callback,
            containerInfo,
            tag,
            hydrationCallbacks as SuspenseHydrationCallbacks,
            isStrictMode,
            concurrentUpdatesByDefaultOverride,
            identifierPrefix,
            onRecoverableError,
            transitionCallbacks,
            null, // formState not provided by definition
        );
    }

    public createPortal( children: ReactNodeList, containerInfo: any, implementation: any, key?: string | null ): ReactPortal {
        return this.reconciler.createPortal( children, containerInfo, implementation, key );
    }

    public createRoleSelector( role: string ): RoleSelector {
        return this.reconciler.createRoleSelector( role );
    }

    public createTestNameSelector( id: string ): TestNameSelector {
        return this.reconciler.createTestNameSelector( id );
    }

    public createTextSelector( text: string ): TextSelector {
        return this.reconciler.createTextSelector( text );
    }

    public deferredUpdates<A>( fn: () => A ): A {
        // @ts-ignore
        return this.reconciler.deferredUpdates<A>( fn );
    }

    public discreteUpdates<A, B, C, D, R>( fn: ( arg0: A, arg1: B, arg2: C, arg3: D ) => R, a: A, b: B, c: C, d: D ): R {
        return this.reconciler.discreteUpdates( fn, a, b, c, d );
    }

    public findAllNodes( hostRoot: Instance, selectors: Selector[] ): Instance[] {
        return this.reconciler.findAllNodes( hostRoot, selectors );
    }

    public findBoundingRects( hostRoot: Instance, selectors: Selector[] ): BoundingRect[] {
        return this.reconciler.findBoundingRects( hostRoot, selectors );
    }

    public findHostInstance( component: any ): PublicInstance | null {
        return this.reconciler.findHostInstance( component );
    }

    public findHostInstanceWithNoPortals( fiber: Fiber ): PublicInstance | null {
        return this.reconciler.findHostInstanceWithNoPortals( fiber );
    }

    public findHostInstanceWithWarning( component: any, methodName: string ): PublicInstance | null {
        return this.reconciler.findHostInstanceWithWarning( component, methodName );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public flushControlled( fn: () => any ): void {
        throw new Error( "Method not implemented." );
    }

    public flushPassiveEffects(): boolean {
        return this.reconciler.flushPassiveEffects();
    }

    public flushSync(): void;
    public flushSync<R>( fn: () => R ): R;
    public flushSync( fn?: any ): any {
        return this.reconciler.flushSync( fn );
    }

    public focusWithin( hostRoot: Instance, selectors: Selector[] ): boolean {
        return this.reconciler.focusWithin( hostRoot, selectors );
    }

    public getCurrentUpdatePriority(): LanePriority {
        return this.reconciler.getCurrentUpdatePriority() as LanePriority;
    }

    public getFindAllNodesFailureDescription( hostRoot: Instance, selectors: Selector[] ): string | null {
        return this.reconciler.getFindAllNodesFailureDescription( hostRoot, selectors );
    }

    public getPublicRootInstance( container: ReactFiberReconciler.OpaqueRoot ): React.Component<any, any> | PublicInstance | null {
        return this.reconciler.getPublicRootInstance( container );
    }

    public injectIntoDevTools( devToolsConfig: ReactFiberReconciler.DevToolsConfig<Instance, TextInstance> ): boolean {
        // TODO Handle issue with devToolsConfig generics.
        return this.reconciler.injectIntoDevTools( devToolsConfig as ReactFiberReconciler.DevToolsConfig<Instance, TextInstance> );
    }

    public isAlreadyRendering(): boolean {
        return this.reconciler.isAlreadyRendering();
    }

    public observeVisibleRects( hostRoot: Instance, selectors: Selector[], callback: ( intersections: Array<{
        ratio: number;
        rect: BoundingRect
    }> ) => void, options?: IntersectionObserverOptions ): { disconnect: () => void } {
        return this.reconciler.observeVisibleRects( hostRoot, selectors, callback, options );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public registerMutableSourceForHydration( root: FiberRoot, mutableSource: MutableSource ): void {
        throw new Error( "Method not implemented." );
    }

    public runWithPriority<T>( priority: LanePriority, fn: () => T ): T {
        return this.reconciler.runWithPriority( priority, fn );
    }

    public shouldError( fiber: Fiber ): boolean | undefined {
        // TODO: Try to see what about 'null';
        return this.reconciler.shouldError( fiber ) as boolean | undefined;
    }

    public shouldSuspend( fiber: Fiber ): boolean {
        return this.reconciler.shouldSuspend( fiber );
    }

    public updateContainer( element: ReactNodeList, container: ReactFiberReconciler.OpaqueRoot, parentComponent?: Component | null, callback?: ( () => void ) | null ): Lane {
        return this.reconciler.updateContainer( element, container, parentComponent, callback );
    }
}

export async function reactReconciler( config?: Partial<ReactReconcilerConfig> ) {
    const reconciler = new ZenFluxReactReconciler( config );

    await reconciler.waitForInitialize();

    return reconciler;
}

export default reactReconciler;
