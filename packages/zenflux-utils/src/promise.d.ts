export function zCreateResolvablePromise(): {
    promise: Promise<any>;
    resolve: Function;
    reject: Function;
    isPending: boolean;
    isRejected: boolean;
    isFulfilled: boolean;
    await: Promise<any>;
};
