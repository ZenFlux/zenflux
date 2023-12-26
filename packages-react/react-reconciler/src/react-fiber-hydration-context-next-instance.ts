import type { HydratableInstance } from "@zenflux/react-reconciler/src/react-fiber-config";

let nextHydratableInstance: null | HydratableInstance = null;

export function getNextHydratableInstance() {
    return nextHydratableInstance;
}

export function getNextHydratableInstanceSafe() {
    return nextHydratableInstance!;
}

export function setNextHydratableInstance( nextInstance: HydratableInstance | null ) {
    nextHydratableInstance = nextInstance;
}

export function hasNextHydratableInstance() {
    return nextHydratableInstance !== null;
}

export function clearNextHydratableInstance() {
    nextHydratableInstance = null;
}
