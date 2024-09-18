"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactFiberWorkOnRootShared = void 0;
var mightHavePendingSyncWork = false;
var isFlushingWork = false;
var ReactFiberWorkOnRootShared = /** @class */ (function () {
    function ReactFiberWorkOnRootShared() {
    }
    ReactFiberWorkOnRootShared.isFlushingWork = function () {
        return isFlushingWork;
    };
    ReactFiberWorkOnRootShared.setIsFlushingOnWork = function () {
        isFlushingWork = true;
    };
    ReactFiberWorkOnRootShared.unsetIsFlushingOnWork = function () {
        isFlushingWork = false;
    };
    ReactFiberWorkOnRootShared.hasPendingSyncWork = function () {
        return mightHavePendingSyncWork;
    };
    ReactFiberWorkOnRootShared.setHavePendingSyncWork = function () {
        mightHavePendingSyncWork = true;
    };
    ReactFiberWorkOnRootShared.unsetHavePendingSyncWork = function () {
        mightHavePendingSyncWork = false;
    };
    return ReactFiberWorkOnRootShared;
}());
exports.ReactFiberWorkOnRootShared = ReactFiberWorkOnRootShared;
