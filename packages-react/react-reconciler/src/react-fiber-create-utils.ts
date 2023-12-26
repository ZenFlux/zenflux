import { REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE } from "@zenflux/react-shared/src/react-symbols";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

export function shouldConstruct( Component: ( ... args: Array<any> ) => any ) {
    const prototype = Component.prototype;
    return !! ( prototype && prototype.isReactComponent );
}

export function isSimpleFunctionComponent( type: any ): boolean {
    return typeof type === "function" && ! shouldConstruct( type ) && type.defaultProps === undefined;
}

export function resolveLazyComponentTag( Component: ( ... args: Array<any> ) => any ): WorkTag {
    if ( typeof Component === "function" ) {
        return shouldConstruct( Component ) ? WorkTag.ClassComponent : WorkTag.FunctionComponent;
    } else if ( Component !== undefined && Component !== null ) {
        // @ts-ignore
        const $$typeof = Component.$$typeof;

        if ( $$typeof === REACT_FORWARD_REF_TYPE ) {
            return WorkTag.ForwardRef;
        }

        if ( $$typeof === REACT_MEMO_TYPE ) {
            return WorkTag.MemoComponent;
        }
    }

    return WorkTag.IndeterminateComponent;
}
