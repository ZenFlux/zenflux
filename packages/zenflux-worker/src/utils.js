"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureInWorker = void 0;
var node_worker_threads_1 = require("node:worker_threads");
function ensureInWorker() {
    if (node_worker_threads_1.isMainThread) {
        throw new Error("This function must be called from a worker thread.");
    }
}
exports.ensureInWorker = ensureInWorker;
