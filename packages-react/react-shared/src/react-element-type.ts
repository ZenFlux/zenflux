/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactElementType.js
 */

export type Source = {
    fileName: string;
    lineNumber: number;
};

export type ReactElement = {
    nodeName: any;
    $$typeof: any;
    type: any;
    key: any;
    ref: any;
    props: any;
    // ReactFiber
    _owner: any;
    // __DEV__
    _store: {
        validated: boolean;
    };
    _self: ReactElement;
    _shadowChildren: any;
    _source: Source;
};
