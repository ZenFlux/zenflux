const { getTestFlags } = require( './react-utils/get-test-flags' );

// Dynamic version of @gate pragma
global.gate = fn => {
    const flags = getTestFlags();
    return fn( flags );
};
