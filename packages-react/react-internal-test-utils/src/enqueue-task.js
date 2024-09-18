"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueTask = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var node_worker_threads_1 = require("node:worker_threads");
function enqueueTask(task) {
    var channel = new node_worker_threads_1.MessageChannel();
    // @ts-ignore
    channel.port1.onmessage = function () {
        channel.port1.close();
        task();
    };
    channel.port2.postMessage(undefined);
}
exports.enqueueTask = enqueueTask;
