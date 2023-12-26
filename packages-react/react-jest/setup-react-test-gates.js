const { getTestFlags } = require( './react-utils/get-test-flags' );

const { flushAllUnexpectedConsoleCalls, resetAllUnexpectedConsoleCalls } = require( './setup-react-test-console' );

const gatedErrorMessage = 'Gated test was expected to fail, but it passed.';

const expectTestToFail = async (callback, errorMsg) => {
    if (callback.length > 0) {
        throw Error(
            'Gated test helpers do not support the `done` callback. Return a ' +
            'promise instead.'
        );
    }
    try {
        const maybePromise = callback();
        if (
            maybePromise !== undefined &&
            maybePromise !== null &&
            typeof maybePromise.then === 'function'
        ) {
            await maybePromise;
        }
        // Flush unexpected console calls inside the test itself, instead of in
        // `afterEach` like we normally do. `afterEach` is too late because if it
        // throws, we won't have captured it.
        flushAllUnexpectedConsoleCalls();
    } catch (error) {
        // Failed as expected
        resetAllUnexpectedConsoleCalls();
        return;
    }
    throw Error(errorMsg);
};


// Dynamic version of @gate pragma
global.gate = fn => {
    const flags = getTestFlags();
    return fn( flags );
};

global._test_gate = (gateFn, testName, callback) => {
    let shouldPass;
    try {
        const flags = getTestFlags();
        shouldPass = gateFn(flags);
    } catch (e) {
        test(testName, () => {
            throw e;
        });
        return;
    }
    if (shouldPass) {
        test(testName, callback);
    } else {
        test(`[GATED, SHOULD FAIL] ${testName}`, () =>
            expectTestToFail(callback, gatedErrorMessage));
    }
};

global._test_gate_focus = (gateFn, testName, callback) => {
    let shouldPass;
    try {
        const flags = getTestFlags();
        shouldPass = gateFn(flags);
    } catch (e) {
        test.only(testName, () => {
            throw e;
        });
        return;
    }
    if (shouldPass) {
        test.only(testName, callback);
    } else {
        test.only(`[GATED, SHOULD FAIL] ${testName}`, () =>
            expectTestToFail(callback, gatedErrorMessage));
    }
};
