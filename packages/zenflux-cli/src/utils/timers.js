"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDebounce = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var zDebounceTimers = {};
function zDebounce(id, fn, delay) {
    clearTimeout(zDebounceTimers[id]);
    zDebounceTimers[id] = setTimeout(function () {
        delete zDebounceTimers[id];
        fn();
    }, delay);
}
exports.zDebounce = zDebounce;
;
