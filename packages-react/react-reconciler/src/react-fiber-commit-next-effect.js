"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearNextEffect = exports.getNextEffectSafe = exports.getNextEffect = exports.hasNextEffect = exports.setNextEffect = void 0;
var nextEffect = null;
function setNextEffect(effect) {
    nextEffect = effect;
}
exports.setNextEffect = setNextEffect;
function hasNextEffect() {
    return nextEffect !== null;
}
exports.hasNextEffect = hasNextEffect;
function getNextEffect() {
    return nextEffect;
}
exports.getNextEffect = getNextEffect;
function getNextEffectSafe() {
    return nextEffect;
}
exports.getNextEffectSafe = getNextEffectSafe;
function clearNextEffect() {
    nextEffect = null;
}
exports.clearNextEffect = clearNextEffect;
