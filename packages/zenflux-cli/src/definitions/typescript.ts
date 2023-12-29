export type TZPreDiagnosticsOptions = {
    useCache?: boolean,
    haltOnError?: boolean,
}

export type TZPreDiagnosticsWorkerOptions = TZPreDiagnosticsOptions & {
    thread: number,
}

export type TZCreateDeclarationWorkerOptions = {
    thread: number,
}
