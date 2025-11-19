// This should be "infer SS" but can't use it yet
import type { ReactContext, ReactNode } from "@zenflux/react-shared/src/react-types";

import type { ReactElement } from "@zenflux/react-shared/src/react-element-type";

interface NewLifecycle<P, S, SS> {
    /**
     * Runs before React applies the result of `render` to the document, and
     * returns an object to be given to componentDidUpdate. Useful for saving
     * things such as scroll position before `render` causes changes to it.
     *
     * Note: the presence of getSnapshotBeforeUpdate prevents any of the deprecated
     * lifecycle events from running.
     */
    getSnapshotBeforeUpdate?( prevProps: Readonly<P>, prevState: Readonly<S> ): SS | null;
    /**
     * Called immediately after updating occurs. Not called for the initial render.
     *
     * The snapshot is only present if getSnapshotBeforeUpdate is present and returns non-null.
     */
    componentDidUpdate?( prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: SS ): void;
}

interface DeprecatedLifecycle<P, S> {
    /**
     * Called immediately before mounting occurs, and before `Component#render`.
     * Avoid introducing any side-effects or subscriptions in this method.
     *
     * Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
     * prevents this from being invoked.
     *
     * @deprecated 16.3, use componentDidMount or the constructor instead; will stop working in React 17
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
     */
    componentWillMount?(): void;
    /**
     * Called immediately before mounting occurs, and before `Component#render`.
     * Avoid introducing any side-effects or subscriptions in this method.
     *
     * This method will not stop working in React 17.
     *
     * Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
     * prevents this from being invoked.
     *
     * @deprecated 16.3, use componentDidMount or the constructor instead
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
     */
    UNSAFE_componentWillMount?(): void;
    /**
     * Called when the component may be receiving new props.
     * React may call this even if props have not changed, so be sure to compare new and existing
     * props if you only want to handle changes.
     *
     * Calling `Component#setState` generally does not trigger this method.
     *
     * Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
     * prevents this from being invoked.
     *
     * @deprecated 16.3, use static getDerivedStateFromProps instead; will stop working in React 17
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
     */
    componentWillReceiveProps?( nextProps: Readonly<P>, nextContext: any ): void;
    /**
     * Called when the component may be receiving new props.
     * React may call this even if props have not changed, so be sure to compare new and existing
     * props if you only want to handle changes.
     *
     * Calling `Component#setState` generally does not trigger this method.
     *
     * This method will not stop working in React 17.
     *
     * Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
     * prevents this from being invoked.
     *
     * @deprecated 16.3, use static getDerivedStateFromProps instead
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
     */
    UNSAFE_componentWillReceiveProps?( nextProps: Readonly<P>, nextContext: any ): void;
    /**
     * Called immediately before rendering when new props or state is received. Not called for the initial render.
     *
     * Note: You cannot call `Component#setState` here.
     *
     * Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
     * prevents this from being invoked.
     *
     * @deprecated 16.3, use getSnapshotBeforeUpdate instead; will stop working in React 17
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
     */
    componentWillUpdate?( nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any ): void;
    /**
     * Called immediately before rendering when new props or state is received. Not called for the initial render.
     *
     * Note: You cannot call `Component#setState` here.
     *
     * This method will not stop working in React 17.
     *
     * Note: the presence of getSnapshotBeforeUpdate or getDerivedStateFromProps
     * prevents this from being invoked.
     *
     * @deprecated 16.3, use getSnapshotBeforeUpdate instead
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update
     * @see https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
     */
    UNSAFE_componentWillUpdate?( nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any ): void;
}

interface ComponentLifecycle<P, S, SS = any> extends NewLifecycle<P, S, SS>, DeprecatedLifecycle<P, S> {
    /**
     * Called immediately after a component is mounted. Setting state here will trigger re-rendering.
     */
    componentDidMount?(): void;
    /**
     * Called to determine whether the change in props and state should trigger a re-render.
     *
     * `Component` always returns true.
     * `PureComponent` implements a shallow comparison on props and state and returns true if any
     * props or states have changed.
     *
     * If false is returned, `Component#render`, `componentWillUpdate`
     * and `componentDidUpdate` will not be called.
     */
    shouldComponentUpdate?( nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any ): boolean;
    /**
     * Called immediately before a component is destroyed. Perform any necessary cleanup in this method, such as
     * cancelled network requests, or cleaning up any DOM elements created in `componentDidMount`.
     */
    componentWillUnmount?(): void;
    /**
     * Catches exceptions generated in descendant components. Unhandled exceptions will cause
     * the entire component tree to unmount.
     */
    componentDidCatch?( error: Error, errorInfo: {
        // TODO: Create type for this.
        digest?: string | null | undefined;
        componentStack?: string | null | undefined;
    } ): void;
}

/* Handles static members */
export namespace Component {
    // tslint won't let me format the sample code in a way that vscode likes it :(
    /**
     * If set, `this.context` will be set at runtime to the current value of the given Context.
     *
     * Usage:
     *
     * ```ts
     * type MyContext = number
     * const Ctx = React.createContext<MyContext>(0)
     *
     * class Foo extends React.Component {
     *   static contextType = Ctx
     *   context!: React.ContextType<typeof Ctx>
     *   render () {
     *     return <>My context's value: {this.context}</>;
     *   }
     * }
     * ```
     *
     * @see https://react.dev/reference/react/Component#static-contexttype
     */
    export const contextType: ReactContext<any> | null | undefined = undefined;
}

export interface Component<P = {}, S = {}, SS = any> extends ComponentLifecycle<P, S, SS> {
    _reactInternals: any;

    /**
     * If using the new style context, re-declare this in your class to be the
     * `React.ContextType` of your `static contextType`.
     * Should be used with type annotation or static contextType.
     *
     * ```ts
     * static contextType = MyContext
     * // For TS pre-3.7:
     * context!: React.ContextType<typeof MyContext>
     * // For TS 3.7 and above:
     * declare context: React.ContextType<typeof MyContext>
     * ```
     *
     * @see https://react.dev/reference/react/Component#context
     */
    context: unknown;

    props: Readonly<P>;

    state: Readonly<S>;

    /**
     * @deprecated
     * https://legacy.reactjs.org/docs/refs-and-the-dom.html#legacy-api-string-refs
     */
    refs: {
        [ key: string ]: Component | ReactElement;
    };

    constructor( props: Readonly<P> | P ): void;

    /**
     * @deprecated
     * @see https://legacy.reactjs.org/docs/legacy-context.html
     */
    constructor( props: P, context: any ): void;

    // We MUST keep setState() as a unified signature because it allows proper checking of the method return type.
    // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/18365#issuecomment-351013257
    // Also, the ` | S` allows intellisense to not be dumbisense
    setState<K extends keyof S>(
        state: ( ( prevState: Readonly<S>, props: Readonly<P> ) => Pick<S, K> | S | null ) | ( Pick<S, K> | S | null ),
        callback?: () => void,
    ): void;

    forceUpdate( callback?: () => void ): void;

    render(): ReactNode;
}
