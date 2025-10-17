/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import { GET_INTERNAL_MATCH_SYMBOL } from "../_internal/constants";

import core from "../_internal/core";

export function useCommandMatch( componentName: string ) {
    return core[ GET_INTERNAL_MATCH_SYMBOL ]( componentName + "*" );
}

