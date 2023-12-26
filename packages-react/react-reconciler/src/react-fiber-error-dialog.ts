import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";
import type { CapturedValue } from "@zenflux/react-reconciler/src/react-captured-value";

// This module is forked in different environments.
// By default, return `true` to log errors to the console.
// Forks can return `false` if this isn't desirable.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function showErrorDialog( boundary: Fiber, errorInfo: CapturedValue<unknown> ): boolean {
    return true;
}
