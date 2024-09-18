"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwOnHydrationMismatch = exports.shouldClientRenderOnMismatch = void 0;
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
function shouldClientRenderOnMismatch(fiber) {
    return (fiber.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode &&
        (fiber.flags & fiber_flags_1.FiberFlags.DidCapture) === fiber_flags_1.FiberFlags.NoFlags;
}
exports.shouldClientRenderOnMismatch = shouldClientRenderOnMismatch;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function throwOnHydrationMismatch(fiber) {
    throw new Error("Hydration failed because the initial UI does not match what was " + "rendered on the server.");
}
exports.throwOnHydrationMismatch = throwOnHydrationMismatch;
