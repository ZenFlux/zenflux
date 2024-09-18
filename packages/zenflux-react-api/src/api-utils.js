"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fakeTimeout = exports.wrapPromiseSuspendable = void 0;
function wrapPromiseSuspendable(promise) {
    var status = "pending";
    var result;
    var suspender = promise.then(function (r) {
        status = "success";
        result = r;
    }, function (e) {
        status = "error";
        result = e;
    });
    return {
        read: function () {
            if (status === "pending") {
                throw suspender;
            }
            else if (status === "error") {
                throw result;
            }
            else if (status === "success") {
                return result;
            }
        }
    };
}
exports.wrapPromiseSuspendable = wrapPromiseSuspendable;
function fakeTimeout(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
exports.fakeTimeout = fakeTimeout;
