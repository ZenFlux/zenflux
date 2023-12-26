// This tracks the thenables that are unwrapped during reconcilation.
import type { ThenableState } from "@zenflux/react-reconciler/src/react-fiber-thenable";

let thenableState: ThenableState | null = null;
let thenableIndexCounter: number = 0;

let didWarnAboutMaps: boolean;
let didWarnAboutGenerators: boolean;
let didWarnAboutStringRefs: Record<string, boolean>;
let ownerHasKeyUseWarning: Record<string, boolean>;
let ownerHasFunctionTypeWarning: Record<string, boolean>;

export class ReactChildFiberCurrent {
    public static thenableState: ThenableState | null = thenableState;
    public static thenableIndexCounter: number = thenableIndexCounter;
}

export class ReactChildFlags {
    public static didWarnAboutMaps: boolean = didWarnAboutMaps;
    public static didWarnAboutGenerators: boolean = didWarnAboutGenerators;
    public static didWarnAboutStringRefs: Record<string, boolean> = didWarnAboutStringRefs;
    public static ownerHasKeyUseWarning: Record<string, boolean> = ownerHasKeyUseWarning;
    public static ownerHasFunctionTypeWarning: Record<string, boolean> = ownerHasFunctionTypeWarning;
}
