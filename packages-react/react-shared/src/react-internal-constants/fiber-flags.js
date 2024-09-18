"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiberFlags = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
// export type Flags = number;
// Don't change these values. They're used by React Dev Tools.
var _NoFlags = 
/*                      */
0;
var _PerformedWork = 
/*                */
1;
var _Placement = 
/*                    */
2;
var _DidCapture = 
/*                   */
128;
var _Hydrating = 
/*                    */
4096;
// You can change the rest (and add more).
var _Update = 
/*                       */
4;
/* Skipped value:                                 0b0000000000000000000000001000; */
var _ChildDeletion = 
/*                */
16;
var _ContentReset = 
/*                 */
32;
var _Callback = 
/*                     */
64;
/* Used by DidCapture:                            0b0000000000000000000010000000; */
var _ForceClientRender = 
/*            */
256;
var _Ref = 
/*                          */
512;
var _Snapshot = 
/*                     */
1024;
var _Passive = 
/*                      */
2048;
/* Used by Hydrating:                             0b0000000000000001000000000000; */
var _Visibility = 
/*                   */
8192;
var _StoreConsistency = 
/*             */
16384;
// It's OK to reuse these bits because these flags are mutually exclusive for
// different fiber types. We should really be doing this for as many flags as
// possible, because we're about to run out of bits.
var _ScheduleRetry = _StoreConsistency;
var _ShouldSuspendCommit = _Visibility;
var _LifecycleEffectMask = _Passive | _Update | _Callback | _Ref | _Snapshot | _StoreConsistency;
// Union of all commit flags (flags with the lifetime of a particular commit)
var _HostEffectMask = 
/*               */
32767;
// These are not really side effects, but we still reuse this field.
var _Incomplete = 
/*                   */
32768;
var _ShouldCapture = 
/*                */
65536;
var _ForceUpdateForLegacySuspense = 
/* */
131072;
var _DidPropagateContext = 
/*          */
262144;
var _NeedsPropagation = 
/*             */
524288;
var _Forked = 
/*                       */
1048576;
// Static tags describe aspects of a fiber that are not specific to a render,
// e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
// This enables us to defer more work in the unmount case,
// since we can defer traversing the tree during layout to look for Passive effects,
// and instead rely on the static flag as a signal that there may be cleanup work.
var _RefStatic = 
/*                    */
2097152;
var _LayoutStatic = 
/*                 */
4194304;
var _PassiveStatic = 
/*                */
8388608;
var _MaySuspendCommit = 
/*             */
16777216;
// Flag used to identify newly inserted fibers. It isn't reset after commit unlike `Placement`.
var _PlacementDEV = 
/*                 */
33554432;
var _MountLayoutDev = 
/*               */
67108864;
var _MountPassiveDev = 
/*              */
134217728;
// Groups of flags that are used in the commit phase to skip over trees that
// don't contain effects, by checking subtreeFlags.
var _BeforeMutationMask = // TODO: Remove Update flag from before mutation phase by re-landing Visibility
 
// flag logic (see #20043)
_Update | _Snapshot | (react_feature_flags_1.enableCreateEventHandleAPI ? // createEventHandle needs to visit deleted and hidden trees to
    // fire beforeblur
    // TODO: Only need to visit Deletions during BeforeMutation phase if an
    // element is focused.
    _ChildDeletion | _Visibility : 0);
var _MutationMask = _Placement | _Update | _ChildDeletion | _ContentReset | _Ref | _Hydrating | _Visibility;
var _LayoutMask = _Update | _Callback | _Ref | _Visibility;
// TODO: Split into PassiveMountMask and PassiveUnmountMask
var _PassiveMask = _Passive | _Visibility | _ChildDeletion;
// Union of tags that don't get reset on clones.
// This allows certain concepts to persist without recalculating them,
// e.g. whether a subtree contains passive effects or portals.
var _StaticMask = _LayoutStatic | _PassiveStatic | _RefStatic | _MaySuspendCommit;
var FiberFlags;
(function (FiberFlags) {
    FiberFlags[FiberFlags["NoFlags"] = 0] = "NoFlags";
    FiberFlags[FiberFlags["PerformedWork"] = 1] = "PerformedWork";
    FiberFlags[FiberFlags["Placement"] = 2] = "Placement";
    FiberFlags[FiberFlags["DidCapture"] = 128] = "DidCapture";
    FiberFlags[FiberFlags["Hydrating"] = 4096] = "Hydrating";
    FiberFlags[FiberFlags["Update"] = 4] = "Update";
    FiberFlags[FiberFlags["ChildDeletion"] = 16] = "ChildDeletion";
    FiberFlags[FiberFlags["ContentReset"] = 32] = "ContentReset";
    FiberFlags[FiberFlags["Callback"] = 64] = "Callback";
    FiberFlags[FiberFlags["ForceClientRender"] = 256] = "ForceClientRender";
    FiberFlags[FiberFlags["Ref"] = 512] = "Ref";
    FiberFlags[FiberFlags["Snapshot"] = 1024] = "Snapshot";
    FiberFlags[FiberFlags["Passive"] = 2048] = "Passive";
    FiberFlags[FiberFlags["Visibility"] = 8192] = "Visibility";
    FiberFlags[FiberFlags["StoreConsistency"] = 16384] = "StoreConsistency";
    FiberFlags[FiberFlags["ScheduleRetry"] = 16384] = "ScheduleRetry";
    FiberFlags[FiberFlags["ShouldSuspendCommit"] = 8192] = "ShouldSuspendCommit";
    FiberFlags[FiberFlags["LifecycleEffectMask"] = 20036] = "LifecycleEffectMask";
    FiberFlags[FiberFlags["HostEffectMask"] = 32767] = "HostEffectMask";
    FiberFlags[FiberFlags["Incomplete"] = 32768] = "Incomplete";
    FiberFlags[FiberFlags["ShouldCapture"] = 65536] = "ShouldCapture";
    FiberFlags[FiberFlags["ForceUpdateForLegacySuspense"] = 131072] = "ForceUpdateForLegacySuspense";
    FiberFlags[FiberFlags["DidPropagateContext"] = 262144] = "DidPropagateContext";
    FiberFlags[FiberFlags["NeedsPropagation"] = 524288] = "NeedsPropagation";
    FiberFlags[FiberFlags["Forked"] = 1048576] = "Forked";
    FiberFlags[FiberFlags["RefStatic"] = 2097152] = "RefStatic";
    FiberFlags[FiberFlags["LayoutStatic"] = 4194304] = "LayoutStatic";
    FiberFlags[FiberFlags["PassiveStatic"] = 8388608] = "PassiveStatic";
    FiberFlags[FiberFlags["MaySuspendCommit"] = 16777216] = "MaySuspendCommit";
    FiberFlags[FiberFlags["PlacementDEV"] = 33554432] = "PlacementDEV";
    FiberFlags[FiberFlags["MountLayoutDev"] = 67108864] = "MountLayoutDev";
    FiberFlags[FiberFlags["MountPassiveDev"] = 134217728] = "MountPassiveDev";
    FiberFlags[FiberFlags["BeforeMutationMask"] = _BeforeMutationMask] = "BeforeMutationMask";
    FiberFlags[FiberFlags["MutationMask"] = 12854] = "MutationMask";
    FiberFlags[FiberFlags["LayoutMask"] = 8772] = "LayoutMask";
    FiberFlags[FiberFlags["PassiveMask"] = 10256] = "PassiveMask";
    FiberFlags[FiberFlags["StaticMask"] = 31457280] = "StaticMask";
})(FiberFlags || (exports.FiberFlags = FiberFlags = {}));
