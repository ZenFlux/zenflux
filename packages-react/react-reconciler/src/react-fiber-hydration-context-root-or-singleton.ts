let rootOrSingletonContext = false;

export function hasRootOrSingletonContextFlag() {
    return rootOrSingletonContext;
}

export function setRootOrSingletonContextFlag() {
    rootOrSingletonContext = true;
}

export function clearRootOrSingletonContextFlag() {
    rootOrSingletonContext = false;
}
