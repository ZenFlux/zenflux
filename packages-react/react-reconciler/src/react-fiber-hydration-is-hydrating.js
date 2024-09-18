"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freeHydrating = exports.markHydrating = exports.isHydrating = void 0;
var _isHydrating = false;
function isHydrating() {
    return _isHydrating;
}
exports.isHydrating = isHydrating;
function markHydrating() {
    _isHydrating = true;
}
exports.markHydrating = markHydrating;
function freeHydrating() {
    _isHydrating = false;
}
exports.freeHydrating = freeHydrating;
