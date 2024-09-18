"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootExitStatus = void 0;
var RootExitStatus;
(function (RootExitStatus) {
    RootExitStatus[RootExitStatus["RootInProgress"] = 0] = "RootInProgress";
    RootExitStatus[RootExitStatus["RootFatalErrored"] = 1] = "RootFatalErrored";
    RootExitStatus[RootExitStatus["RootErrored"] = 2] = "RootErrored";
    RootExitStatus[RootExitStatus["RootSuspended"] = 3] = "RootSuspended";
    RootExitStatus[RootExitStatus["RootSuspendedWithDelay"] = 4] = "RootSuspendedWithDelay";
    RootExitStatus[RootExitStatus["RootCompleted"] = 5] = "RootCompleted";
    RootExitStatus[RootExitStatus["RootDidNotComplete"] = 6] = "RootDidNotComplete";
})(RootExitStatus || (exports.RootExitStatus = RootExitStatus = {}));
