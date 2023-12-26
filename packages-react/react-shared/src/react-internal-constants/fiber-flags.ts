import { enableCreateEventHandleAPI } from "@zenflux/react-shared/src/react-feature-flags";

// export type Flags = number;
// Don't change these values. They're used by React Dev Tools.
const _NoFlags =
    /*                      */
    0b0000000000000000000000000000;
const _PerformedWork =
    /*                */
    0b0000000000000000000000000001;
const _Placement =
    /*                    */
    0b0000000000000000000000000010;
const _DidCapture =
    /*                   */
    0b0000000000000000000010000000;
const _Hydrating =
    /*                    */
    0b0000000000000001000000000000;
// You can change the rest (and add more).
const _Update =
    /*                       */
    0b0000000000000000000000000100;

/* Skipped value:                                 0b0000000000000000000000001000; */
const _ChildDeletion =
    /*                */
    0b0000000000000000000000010000;
const _ContentReset =
    /*                 */
    0b0000000000000000000000100000;
const _Callback =
    /*                     */
    0b0000000000000000000001000000;

/* Used by DidCapture:                            0b0000000000000000000010000000; */
const _ForceClientRender =
    /*            */
    0b0000000000000000000100000000;
const _Ref =
    /*                          */
    0b0000000000000000001000000000;
const _Snapshot =
    /*                     */
    0b0000000000000000010000000000;
const _Passive =
    /*                      */
    0b0000000000000000100000000000;

/* Used by Hydrating:                             0b0000000000000001000000000000; */
const _Visibility =
    /*                   */
    0b0000000000000010000000000000;
const _StoreConsistency =
    /*             */
    0b0000000000000100000000000000;
// It's OK to reuse these bits because these flags are mutually exclusive for
// different fiber types. We should really be doing this for as many flags as
// possible, because we're about to run out of bits.
const _ScheduleRetry = _StoreConsistency;
const _ShouldSuspendCommit = _Visibility;
const _LifecycleEffectMask = _Passive | _Update | _Callback | _Ref | _Snapshot | _StoreConsistency;
// Union of all commit flags (flags with the lifetime of a particular commit)
const _HostEffectMask =
    /*               */
    0b0000000000000111111111111111;
// These are not really side effects, but we still reuse this field.
const _Incomplete =
    /*                   */
    0b0000000000001000000000000000;
const _ShouldCapture =
    /*                */
    0b0000000000010000000000000000;
const _ForceUpdateForLegacySuspense =
    /* */
    0b0000000000100000000000000000;
const _DidPropagateContext =
    /*          */
    0b0000000001000000000000000000;
const _NeedsPropagation =
    /*             */
    0b0000000010000000000000000000;
const _Forked =
    /*                       */
    0b0000000100000000000000000000;
// Static tags describe aspects of a fiber that are not specific to a render,
// e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
// This enables us to defer more work in the unmount case,
// since we can defer traversing the tree during layout to look for Passive effects,
// and instead rely on the static flag as a signal that there may be cleanup work.
const _RefStatic =
    /*                    */
    0b0000001000000000000000000000;
const _LayoutStatic =
    /*                 */
    0b0000010000000000000000000000;
const _PassiveStatic =
    /*                */
    0b0000100000000000000000000000;
const _MaySuspendCommit =
    /*             */
    0b0001000000000000000000000000;
// Flag used to identify newly inserted fibers. It isn't reset after commit unlike `Placement`.
const _PlacementDEV =
    /*                 */
    0b0010000000000000000000000000;
const _MountLayoutDev =
    /*               */
    0b0100000000000000000000000000;
const _MountPassiveDev =
    /*              */
    0b1000000000000000000000000000;
// Groups of flags that are used in the commit phase to skip over trees that
// don't contain effects, by checking subtreeFlags.
const _BeforeMutationMask: number = // TODO: Remove Update flag from before mutation phase by re-landing Visibility
// flag logic (see #20043)
    _Update | _Snapshot | ( enableCreateEventHandleAPI ? // createEventHandle needs to visit deleted and hidden trees to
        // fire beforeblur
        // TODO: Only need to visit Deletions during BeforeMutation phase if an
        // element is focused.
        _ChildDeletion | _Visibility : 0 );
const _MutationMask = _Placement | _Update | _ChildDeletion | _ContentReset | _Ref | _Hydrating | _Visibility;
const _LayoutMask = _Update | _Callback | _Ref | _Visibility;
// TODO: Split into PassiveMountMask and PassiveUnmountMask
const _PassiveMask = _Passive | _Visibility | _ChildDeletion;
// Union of tags that don't get reset on clones.
// This allows certain concepts to persist without recalculating them,
// e.g. whether a subtree contains passive effects or portals.
const _StaticMask = _LayoutStatic | _PassiveStatic | _RefStatic | _MaySuspendCommit;

export enum FiberFlags {
    NoFlags = _NoFlags,
    PerformedWork = _PerformedWork,
    Placement = _Placement,
    DidCapture = _DidCapture,
    Hydrating = _Hydrating,
    Update = _Update,
    ChildDeletion = _ChildDeletion,
    ContentReset = _ContentReset,
    Callback = _Callback,
    ForceClientRender = _ForceClientRender,
    Ref = _Ref,
    Snapshot = _Snapshot,
    Passive = _Passive,
    Visibility = _Visibility,
    StoreConsistency = _StoreConsistency,
    ScheduleRetry = _ScheduleRetry,
    ShouldSuspendCommit = _ShouldSuspendCommit,
    LifecycleEffectMask = _LifecycleEffectMask,
    HostEffectMask = _HostEffectMask,
    Incomplete = _Incomplete,
    ShouldCapture = _ShouldCapture,
    ForceUpdateForLegacySuspense = _ForceUpdateForLegacySuspense,
    DidPropagateContext = _DidPropagateContext,
    NeedsPropagation = _NeedsPropagation,
    Forked = _Forked,
    RefStatic = _RefStatic,
    LayoutStatic = _LayoutStatic,
    PassiveStatic = _PassiveStatic,
    MaySuspendCommit = _MaySuspendCommit,
    PlacementDEV = _PlacementDEV,
    MountLayoutDev = _MountLayoutDev,
    MountPassiveDev = _MountPassiveDev,
    BeforeMutationMask = _BeforeMutationMask,
    MutationMask = _MutationMask,
    LayoutMask = _LayoutMask,
    PassiveMask = _PassiveMask,
    StaticMask = _StaticMask,
}
