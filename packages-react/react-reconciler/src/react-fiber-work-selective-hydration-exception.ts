export const SelectiveHydrationException = new Error(
    "This is not a real error. It's an implementation detail of React's " +
    "selective hydration feature. If this leaks into userspace, it's a bug in " +
    "React. Please file an issue."
);
