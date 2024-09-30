// eslint-disable-next-line
import shared from "./__shared__";

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
