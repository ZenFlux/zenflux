/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { MessageChannel } from "node:worker_threads";

export function enqueueTask( task: () => void ): void {
    const channel = new MessageChannel();
    // @ts-ignore
    channel.port1.onmessage = () => {
        channel.port1.close();
        task();
    };
    channel.port2.postMessage( undefined );
}

