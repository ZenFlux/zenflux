"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetWorkInProgressReceivedUpdate = exports.didWorkInProgressReceiveUpdate = exports.checkIfWorkInProgressReceivedUpdate = exports.markWorkInProgressReceivedUpdate = void 0;
var didReceiveUpdate = false;
function markWorkInProgressReceivedUpdate() {
    didReceiveUpdate = true;
}
exports.markWorkInProgressReceivedUpdate = markWorkInProgressReceivedUpdate;
function checkIfWorkInProgressReceivedUpdate() {
    return didReceiveUpdate;
}
exports.checkIfWorkInProgressReceivedUpdate = checkIfWorkInProgressReceivedUpdate;
function didWorkInProgressReceiveUpdate() {
    return didReceiveUpdate;
}
exports.didWorkInProgressReceiveUpdate = didWorkInProgressReceiveUpdate;
function resetWorkInProgressReceivedUpdate() {
    didReceiveUpdate = false;
}
exports.resetWorkInProgressReceivedUpdate = resetWorkInProgressReceivedUpdate;
