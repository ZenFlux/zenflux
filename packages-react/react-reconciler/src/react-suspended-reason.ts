export enum SuspendedReason {
    NotSuspended = 0,
    SuspendedOnError = 1,
    SuspendedOnData = 2,
    SuspendedOnImmediate = 3,
    SuspendedOnInstance = 4,
    SuspendedOnInstanceAndReadyToContinue = 5,
    SuspendedOnDeprecatedThrowPromise = 6,
    SuspendedAndReadyToContinue = 7,
    SuspendedOnHydration = 8,
}
