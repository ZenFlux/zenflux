"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHexColorDelta = void 0;
/**
 * Function hexColorDelta() : Return color difference in ratio decimal point.
 *
 * @copyright http://jsfiddle.net/96sME/
 */
var getHexColorDelta = function (hex1, hex2) {
    hex1 = hex1.replace("#", "");
    hex2 = hex2.replace("#", "");
    // Get red/green/blue int values of hex1
    var r1 = parseInt(hex1.substring(0, 2), 16);
    var g1 = parseInt(hex1.substring(2, 4), 16);
    var b1 = parseInt(hex1.substring(4, 6), 16);
    // Get red/green/blue int values of hex2
    var r2 = parseInt(hex2.substring(0, 2), 16);
    var g2 = parseInt(hex2.substring(2, 4), 16);
    var b2 = parseInt(hex2.substring(4, 6), 16);
    // Calculate differences between reds, greens and blues
    var r = 255 - Math.abs(r1 - r2);
    var g = 255 - Math.abs(g1 - g2);
    var b = 255 - Math.abs(b1 - b2);
    // Limit differences between 0 and 1
    r /= 255;
    g /= 255;
    b /= 255;
    // 0 means opposite colors, 1 means same colors
    return (r + g + b) / 3;
};
exports.getHexColorDelta = getHexColorDelta;
