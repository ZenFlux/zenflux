"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceCircularReferences = void 0;
/**
 * Reduce circular references.
 *
 * @copyright https://stackoverflow.com/a/53731154
 */
var reduceCircularReferences = function () {
    var seen = new WeakSet();
    return function (key, value) {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};
exports.reduceCircularReferences = reduceCircularReferences;
