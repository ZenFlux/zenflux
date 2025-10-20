import shared from "@zenflux/core/test/__shared__";

beforeAll( async () => {
} );

beforeEach( async () => {
    shared.initZenCore();
} );

afterEach( () => {
    shared.destroyZenCore();

    jest.resetModules();
    jest.restoreAllMocks();
} );
