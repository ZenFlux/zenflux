let _didWarnAboutReassigningProps: boolean;

export function markWarningAboutReassigningProps() {
    _didWarnAboutReassigningProps = true;
}

export function didWarnAboutReassigningProps() {
    return _didWarnAboutReassigningProps;
}

export function clearWarningAboutReassigningProps() {
    _didWarnAboutReassigningProps = false;
}
