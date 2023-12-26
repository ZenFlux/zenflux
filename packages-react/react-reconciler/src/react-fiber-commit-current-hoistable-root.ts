import type { HoistableRoot } from "@zenflux/react-reconciler/src/react-fiber-config";

let currentHoistableRoot: HoistableRoot | null = null;

export function getCurrentHoistableRoot() {
    return currentHoistableRoot;
}

export function getCurrentHoistableRootSafe() {
    return currentHoistableRoot!;
}
export function setCurrentHoistableRoot( root: HoistableRoot | null ) {
    currentHoistableRoot = root;
}
