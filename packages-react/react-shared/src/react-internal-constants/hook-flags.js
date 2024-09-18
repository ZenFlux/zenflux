"use strict";
// export type HookFlags = number;
//
// export const NoFlags =
//     /*   */
//     0b0000;
// // Represents whether effect should fire.
// export const HasEffect =
//     /* */
//     0b0001;
// // Represents the phase in which the effect (not the clean-up) fires.
// export const Insertion =
//     /* */
//     0b0010;
// export const Layout =
//     /*    */
//     0b0100;
// export const Passive =
//     /*   */
//     0b1000;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookFlags = void 0;
// TODO: - HookEffectFlags
var HookFlags;
(function (HookFlags) {
    // Represents whether effect should fire.
    HookFlags[HookFlags["NoFlags"] = 0] = "NoFlags";
    HookFlags[HookFlags["NoHookEffect"] = 0] = "NoHookEffect";
    // Represents the phase in which the effect (not the clean-up) fires.
    HookFlags[HookFlags["HasEffect"] = 1] = "HasEffect";
    HookFlags[HookFlags["Insertion"] = 2] = "Insertion";
    HookFlags[HookFlags["Layout"] = 4] = "Layout";
    HookFlags[HookFlags["Passive"] = 8] = "Passive";
})(HookFlags || (exports.HookFlags = HookFlags = {}));
