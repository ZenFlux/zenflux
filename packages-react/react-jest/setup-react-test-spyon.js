// By default, jest.spyOn also calls the spied method.
const spyOn = jest.spyOn;
const noop = jest.fn;

// Spying on console methods in production builds can mask errors.
// This is why we added an explicit spyOnDev() helper.
// It's too easy to accidentally use the more familiar spyOn() helper though,
// So we disable it entirely.
// Spying on both dev and prod will require using both spyOnDev() and spyOnProd().
global.spyOn = function () {
    throw new Error(
        'Do not use spyOn(). ' +
        'It can accidentally hide unexpected errors in production builds. ' +
        'Use spyOnDev(), spyOnProd(), or spyOnDevAndProd() instead.'
    );
};

if ( process.env.NODE_ENV === 'production' ) {
    global.spyOnDev = noop;
    global.spyOnProd = spyOn;
    global.spyOnDevAndProd = spyOn;
} else {
    global.spyOnDev = spyOn;
    global.spyOnProd = noop;
    global.spyOnDevAndProd = spyOn;
}
