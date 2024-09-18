"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pop = exports.peek = exports.push = void 0;
function push(heap, node) {
    var index = heap.length;
    heap.push(node);
    siftUp(heap, node, index);
}
exports.push = push;
function peek(heap) {
    return heap.length === 0 ? null : heap[0];
}
exports.peek = peek;
function pop(heap) {
    if (heap.length === 0) {
        return null;
    }
    var first = heap[0];
    var last = heap.pop();
    if (last !== first) {
        // @ts-ignore
        heap[0] = last;
        // @ts-ignore
        siftDown(heap, last, 0);
    }
    return first;
}
exports.pop = pop;
function siftUp(heap, node, i) {
    var index = i;
    while (index > 0) {
        var parentIndex = index - 1 >>> 1;
        var parent_1 = heap[parentIndex];
        if (compare(parent_1, node) > 0) {
            // The parent is larger. Swap positions.
            heap[parentIndex] = node;
            heap[index] = parent_1;
            index = parentIndex;
        }
        else {
            // The parent is smaller. Exit.
            return;
        }
    }
}
function siftDown(heap, node, i) {
    var index = i;
    var length = heap.length;
    var halfLength = length >>> 1;
    while (index < halfLength) {
        var leftIndex = (index + 1) * 2 - 1;
        var left = heap[leftIndex];
        var rightIndex = leftIndex + 1;
        var right = heap[rightIndex];
        // If the left or right node is smaller, swap with the smaller of those.
        if (compare(left, node) < 0) {
            if (rightIndex < length && compare(right, left) < 0) {
                heap[index] = right;
                heap[rightIndex] = node;
                index = rightIndex;
            }
            else {
                heap[index] = left;
                heap[leftIndex] = node;
                index = leftIndex;
            }
        }
        else if (rightIndex < length && compare(right, node) < 0) {
            heap[index] = right;
            heap[rightIndex] = node;
            index = rightIndex;
        }
        else {
            // Neither child is smaller. Exit.
            return;
        }
    }
}
function compare(a, b) {
    // Compare sort index first, then task id.
    var diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
}
