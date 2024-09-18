"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLRU = void 0;
var Scheduler = require("@zenflux/react-scheduler");
// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
var scheduleCallback = Scheduler.unstable_scheduleCallback, IdlePriority = Scheduler.unstable_IdlePriority;
function createLRU(limit) {
    var LIMIT = limit;
    // Circular, doubly-linked list
    var first = null;
    var size = 0;
    var cleanUpIsScheduled = false;
    function scheduleCleanUp() {
        if (cleanUpIsScheduled === false && size > LIMIT) {
            cleanUpIsScheduled = true;
            scheduleCallback(IdlePriority, cleanUp);
        }
    }
    function cleanUp() {
        cleanUpIsScheduled = false;
        deleteLeastRecentlyUsedEntries(LIMIT);
    }
    function deleteLeastRecentlyUsedEntries(targetSize) {
        if (first !== null) {
            var resolvedFirst = first;
            var last = resolvedFirst.previous;
            while (size > targetSize && last !== null) {
                var onDelete = last.onDelete;
                var previous = last.previous;
                last.onDelete = (function () {
                });
                last.previous = last.next = null;
                if (last === first) {
                    first = last = null;
                }
                else {
                    first.previous = previous;
                    previous.next = first;
                    last = previous;
                }
                size -= 1;
                onDelete();
            }
        }
    }
    function add(value, onDelete) {
        var entry = {
            value: value,
            onDelete: onDelete,
            next: null,
            previous: null,
        };
        if (first === null) {
            entry.previous = entry.next = entry;
            first = entry;
        }
        else {
            var last = first.previous;
            last.next = entry;
            entry.previous = last;
            first.previous = entry;
            entry.next = first;
            first = entry;
        }
        size += 1;
        return entry;
    }
    function update(entry, newValue) {
        entry.value = newValue;
    }
    function access(entry) {
        var next = entry.next;
        if (next !== null) {
            var resolvedFirst = first;
            if (first !== entry) {
                var previous = entry.previous;
                previous.next = next;
                next.previous = previous;
                var last = resolvedFirst.previous;
                last.next = entry;
                entry.previous = last;
                resolvedFirst.previous = entry;
                entry.next = resolvedFirst;
                first = entry;
            }
        }
        scheduleCleanUp();
        return entry.value;
    }
    function setLimit(newLimit) {
        LIMIT = newLimit;
        scheduleCleanUp();
    }
    return {
        add: add,
        update: update,
        access: access,
        setLimit: setLimit,
    };
}
exports.createLRU = createLRU;
