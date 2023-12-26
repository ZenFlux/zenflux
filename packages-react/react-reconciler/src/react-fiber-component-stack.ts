import {
    describeBuiltInComponentFrame,
    describeClassComponentFrame,
    describeFunctionComponentFrame
} from "@zenflux/react-shared/src/react-component-stack-frame";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

function describeFiber( fiber: Fiber ): string {
    const owner: null | ( ( ... args: Array<any> ) => any ) = __DEV__ ? fiber._debugOwner ? fiber._debugOwner.type : null : null;
    const source = __DEV__ ? fiber._debugSource : null;

    switch ( fiber.tag ) {
        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent:
            return describeBuiltInComponentFrame( fiber.type, source, owner );

        case WorkTag.LazyComponent:
            return describeBuiltInComponentFrame( "Lazy", source, owner );

        case WorkTag.SuspenseComponent:
            return describeBuiltInComponentFrame( "Suspense", source, owner );

        case WorkTag.SuspenseListComponent:
            return describeBuiltInComponentFrame( "SuspenseList", source, owner );

        case WorkTag.FunctionComponent:
        case WorkTag.IndeterminateComponent:
        case WorkTag.SimpleMemoComponent:
            return describeFunctionComponentFrame( fiber.type, source, owner );

        case WorkTag.ForwardRef:
            return describeFunctionComponentFrame( fiber.type.render, source, owner );

        case WorkTag.ClassComponent:
            return describeClassComponentFrame( fiber.type, source, owner );

        default:
            return "";
    }
}

export function getStackByFiberInDevAndProd( workInProgress: Fiber ): string {
    try {
        let info = "";
        let node: Fiber | null = workInProgress;

        do {
            info += describeFiber( node );
            // $FlowFixMe[incompatible-type] we bail out when we get a null
            node = node.return;
        } while ( node );

        return info;
    } catch ( x: any ) {
        return "\nError generating stack: " + x.message + "\n" + x.stack;
    }
}
