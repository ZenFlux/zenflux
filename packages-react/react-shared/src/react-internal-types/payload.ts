export type EventFunctionPayload<Args, Return, F extends ( ... args: Array<Args> ) => Return> = {
    ref: {
        eventFn: F;
        impl: F;
    };
    nextImpl: F;
};
