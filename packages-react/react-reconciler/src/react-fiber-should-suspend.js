"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldSuspend = exports.setShouldSuspend = exports.shouldSuspendImpl = void 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var shouldSuspendImpl = function (fiber) { return false; };
exports.shouldSuspendImpl = shouldSuspendImpl;
function setShouldSuspend(impl) {
    exports.shouldSuspendImpl = impl;
}
exports.setShouldSuspend = setShouldSuspend;
function shouldSuspend(fiber) {
    return (0, exports.shouldSuspendImpl)(fiber);
}
exports.shouldSuspend = shouldSuspend;
