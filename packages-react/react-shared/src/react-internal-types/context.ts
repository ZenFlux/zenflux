import type { ReactContext } from "@zenflux/react-shared/src/react-types";

export type ContextDependency<T> = {
    context: ReactContext<T>;
    next: ContextDependency<unknown> | null;
    memoizedValue: T;
};
