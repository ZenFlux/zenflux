"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspendedReason = void 0;
var SuspendedReason;
(function (SuspendedReason) {
    SuspendedReason[SuspendedReason["NotSuspended"] = 0] = "NotSuspended";
    SuspendedReason[SuspendedReason["SuspendedOnError"] = 1] = "SuspendedOnError";
    SuspendedReason[SuspendedReason["SuspendedOnData"] = 2] = "SuspendedOnData";
    SuspendedReason[SuspendedReason["SuspendedOnImmediate"] = 3] = "SuspendedOnImmediate";
    SuspendedReason[SuspendedReason["SuspendedOnInstance"] = 4] = "SuspendedOnInstance";
    SuspendedReason[SuspendedReason["SuspendedOnInstanceAndReadyToContinue"] = 5] = "SuspendedOnInstanceAndReadyToContinue";
    SuspendedReason[SuspendedReason["SuspendedOnDeprecatedThrowPromise"] = 6] = "SuspendedOnDeprecatedThrowPromise";
    SuspendedReason[SuspendedReason["SuspendedAndReadyToContinue"] = 7] = "SuspendedAndReadyToContinue";
    SuspendedReason[SuspendedReason["SuspendedOnHydration"] = 8] = "SuspendedOnHydration";
})(SuspendedReason || (exports.SuspendedReason = SuspendedReason = {}));
