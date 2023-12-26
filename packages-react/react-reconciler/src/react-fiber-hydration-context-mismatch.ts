import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";
import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

export function shouldClientRenderOnMismatch( fiber: Fiber ) {
    return ( fiber.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode &&
        ( fiber.flags & FiberFlags.DidCapture ) === FiberFlags.NoFlags;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function throwOnHydrationMismatch( fiber: Fiber ) {
    throw new Error( "Hydration failed because the initial UI does not match what was " + "rendered on the server." );
}
