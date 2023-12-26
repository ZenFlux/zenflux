import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

let nextEffect: Fiber | null = null;

export function setNextEffect( effect: Fiber | null ): void {
    nextEffect = effect;
}

export function hasNextEffect(): boolean {
    return nextEffect !== null;
}

export function getNextEffect(): Fiber | null {
    return nextEffect;
}

export function getNextEffectSafe(): Fiber {
    return nextEffect!;
}

export function clearNextEffect(): void {
    nextEffect = null;
}
