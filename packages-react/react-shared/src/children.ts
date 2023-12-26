import type { ReactNode } from "@zenflux/react-shared/src/react-types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Children = {
    map<T, C>(
        children: C | ReadonlyArray<C>,
        fn: ( child: C, index: number ) => T,
    ): C extends null | undefined ? C : Array<Exclude<T, boolean | null | undefined>>;
    forEach<C>( children: C | ReadonlyArray<C>, fn: ( child: C, index: number ) => void ): void;
    count( children: any ): number;
    only<C>( children: C ): C extends any[] ? never : C;
    toArray( children: ReactNode | ReactNode[] ): Array<Exclude<ReactNode, boolean | null | undefined>>;
};
