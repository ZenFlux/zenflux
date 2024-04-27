/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let act;
let ReactFiberReconciler;
let ConcurrentRoot;
let DefaultEventPriority;

describe( 'ReactFiberHostContext', () => {
    beforeEach( () => {
        jest.resetModules();

        global.IS_REACT_ACT_ENVIRONMENT = true;

        if ( globalThis.globalThis.__Z_CUSTOM_LOADER__ !== undefined ) {
            delete global.React;

            globalThis.__Z_CUSTOM_LOADER_DATA__ = {};
        }

        React = require( 'react' );

        require( "@zenflux/react-x-env/internals" );

        act = React.unstable_act;

        ReactFiberReconciler = require( '@zenflux/react-reconciler' ).reactReconciler;

        ConcurrentRoot =
            require( '@zenflux/react-shared/src/react-internal-constants/root-tags' ).ConcurrentRoot;
        DefaultEventPriority =
            require( '@zenflux/react-reconciler/src/react-event-priorities' ).DefaultEventPriority;
    } );


    // @gate __DEV__
    it( 'should send the context to prepareForCommit and resetAfterCommit', async () => {
        const rootContext = {};
        const childContext = {};
        const Renderer = await ReactFiberReconciler( {
            prepareForCommit: function ( hostContext ) {
                expect( hostContext ).toBe( rootContext );
                return null;
            },
            resetAfterCommit: function ( hostContext ) {
                expect( hostContext ).toBe( rootContext );
            },
            getRootHostContext: function () {
                return rootContext;
            },
            getChildHostContext: function () {
                return childContext;
            },
            shouldSetTextContent: function () {
                return false;
            },
            createInstance: function () {
                return null;
            },
            finalizeInitialChildren: function () {
                return null;
            },
            appendInitialChild: function () {
                return null;
            },
            now: function () {
                return 0;
            },
            appendChildToContainer: function () {
                return null;
            },
            clearContainer: function () {
            },
            getCurrentEventPriority: function () {
                return DefaultEventPriority;
            },
            shouldAttemptEagerTransition() {
                return false;
            },
            requestPostPaintCallback: function () {
            },
            maySuspendCommit( type, props ) {
                return false;
            },
            preloadInstance( type, props ) {
                return true;
            },
            startSuspendingCommit() {
            },
            suspendInstance( type, props ) {
            },
            waitForCommitToBeReady() {
                return null;
            },
            supportsMutation: true,
        } );

        const container = Renderer.createContainer(
            rootContext,
            ConcurrentRoot,
            null,
            false,
            '',
            null,
        );
        act( () => {
            Renderer.updateContainer(
                <a>
                    <b/>
                </a>,
                container,
                /* parentComponent: */ null,
                /* callback: */ null,
            );
        } );
    } );
} );
