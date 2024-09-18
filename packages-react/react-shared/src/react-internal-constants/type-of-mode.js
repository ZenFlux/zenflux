"use strict";
// export type TypeOfMode = number;
// export const NoMode =
//     /*                         */
//     0b0000000;
// // TODO: Remove ConcurrentMode by reading from the root tag instead
// export const ConcurrentMode =
//     /*                 */
//     0b0000001;
// export const ProfileMode =
//     /*                    */
//     0b0000010;
// export const DebugTracingMode =
//     /*               */
//     0b0000100;
// export const StrictLegacyMode =
//     /*               */
//     0b0001000;
// export const StrictEffectsMode =
//     /*              */
//     0b0010000;
// export const ConcurrentUpdatesByDefaultMode =
//     /* */
//     0b0100000;
// export const NoStrictPassiveEffectsMode =
//     /*     */
//     0b1000000;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOfMode = void 0;
// TODO: Remove ConcurrentMode by reading from the root tag instead
var TypeOfMode;
(function (TypeOfMode) {
    TypeOfMode[TypeOfMode["NoMode"] = 0] = "NoMode";
    TypeOfMode[TypeOfMode["ConcurrentMode"] = 1] = "ConcurrentMode";
    TypeOfMode[TypeOfMode["ProfileMode"] = 2] = "ProfileMode";
    TypeOfMode[TypeOfMode["DebugTracingMode"] = 4] = "DebugTracingMode";
    TypeOfMode[TypeOfMode["StrictLegacyMode"] = 8] = "StrictLegacyMode";
    TypeOfMode[TypeOfMode["StrictEffectsMode"] = 16] = "StrictEffectsMode";
    TypeOfMode[TypeOfMode["ConcurrentUpdatesByDefaultMode"] = 32] = "ConcurrentUpdatesByDefaultMode";
    TypeOfMode[TypeOfMode["NoStrictPassiveEffectsMode"] = 64] = "NoStrictPassiveEffectsMode";
})(TypeOfMode || (exports.TypeOfMode = TypeOfMode = {}));
