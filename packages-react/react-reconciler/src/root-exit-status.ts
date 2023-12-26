export enum RootExitStatus {
    RootInProgress = 0,
    RootFatalErrored = 1,
    RootErrored = 2,
    RootSuspended = 3,
    RootSuspendedWithDelay = 4,
    RootCompleted = 5,
    RootDidNotComplete = 6,
}
