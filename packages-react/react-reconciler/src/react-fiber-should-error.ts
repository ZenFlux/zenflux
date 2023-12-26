import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

let shouldErrorImpl: ( fiber: Fiber ) => boolean | undefined = () => undefined;

export function setShouldError( impl: typeof shouldErrorImpl ): void {
    shouldErrorImpl = impl;
};

export function shouldError( fiber: Fiber ) {
    return shouldErrorImpl( fiber );
}
