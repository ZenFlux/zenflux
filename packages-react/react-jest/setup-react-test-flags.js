/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

// These flags can be in a @gate pragma to declare that a test depends on
// certain conditions. They"re like GKs.
//
// Examples:
//   // @gate enableSomeAPI
//   test("uses an unstable API", () => {/*...*/})
//
//   // @gate __DEV__
//   test("only passes in development", () => {/*...*/})
//
// Most flags are defined in ReactFeatureFlags. If it"s defined there, you don"t
// have to do anything extra here.
//
// There are also flags based on the environment, like __DEV__. Feel free to
// add new flags and aliases below.
//
// You can also combine flags using multiple gates:
//
//   // @gate enableSomeAPI
//   // @gate __DEV__
//   test("both conditions must pass", () => {/*...*/})
//
// Or using logical operators
//   // @gate enableSomeAPI && __DEV__
//   test("both conditions must pass", () => {/*...*/})
//
// Negation also works:
//   // @gate !deprecateLegacyContext
//   test("uses a deprecated feature", () => {/*...*/})

// These flags are based on the environment and don"t change for the entire
// test run.
const environmentFlags = {
    __DEV__,
    build: __DEV__ ? "development" : "production",

    // TODO: Should "experimental" also imply "modern"? Maybe we should
    // always compare to the channel?
    experimental: __EXPERIMENTAL__,
    // Similarly, should stable imply "classic"?
    stable: ! __EXPERIMENTAL__,

    variant: __VARIANT__,

    persistent: global.__PERSISTENT__ === true,

    // Use this for tests that are known to be broken.
    FIXME: false,
    TODO: false,

    // Turn these flags back on (or delete) once the effect list is removed in
    // favor of a depth-first traversal using `subtreeTags`.
    dfsEffectsRefactor: true,
    enableUseJSStackToTrackPassiveDurations: false,
};

// Added by ZenFlux
if ( ! global.__ENVIRONMENT_FLAGS__ ) {
    global.__ENVIRONMENT_FLAGS__ = environmentFlags;
}
