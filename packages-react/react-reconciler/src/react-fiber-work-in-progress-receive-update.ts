let didReceiveUpdate: boolean = false;

export function markWorkInProgressReceivedUpdate() {
    didReceiveUpdate = true;
}

export function checkIfWorkInProgressReceivedUpdate(): boolean {
    return didReceiveUpdate;
}

export function didWorkInProgressReceiveUpdate() {
    return didReceiveUpdate;
}

export function resetWorkInProgressReceivedUpdate() {
    didReceiveUpdate = false;
}
