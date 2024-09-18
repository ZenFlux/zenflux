"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulePostPaintCallback = void 0;
var requestPostPaintCallback = globalThis.__RECONCILER__CONFIG__.requestPostPaintCallback;
var postPaintCallbackScheduled = false;
var callbacks = [];
function schedulePostPaintCallback(callback) {
    callbacks.push(callback);
    if (!postPaintCallbackScheduled) {
        postPaintCallbackScheduled = true;
        requestPostPaintCallback(function (endTime) {
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i](endTime);
            }
            postPaintCallbackScheduled = false;
            callbacks = [];
        });
    }
}
exports.schedulePostPaintCallback = schedulePostPaintCallback;
