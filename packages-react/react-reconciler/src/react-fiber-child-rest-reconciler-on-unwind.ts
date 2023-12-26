import { ReactChildFiberCurrent } from "@zenflux/react-reconciler/src/react-fiber-child-shared";

export function resetChildReconcilerOnUnwind(): void {
    // On unwind, clear any pending thenables that were used.
    ReactChildFiberCurrent.thenableState = null;
    ReactChildFiberCurrent.thenableIndexCounter = 0;
}
