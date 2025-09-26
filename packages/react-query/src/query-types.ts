import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

import type React from "react";

import type { QueryClient } from "@zenflux/react-query/src/query-client";

import type { QueryModuleBase } from "@zenflux/react-query/src/query-module-base";

export interface QueryModuleBaseStatic {
    new( query: QueryClient ): QueryModuleBase;

    getName(): string;
}

export interface QueryComponentProps {
    children?: React.ReactElement;
    module?: QueryModuleBaseStatic;
    fallback?: React.ReactElement;
    type: DCommandFunctionComponent;
    chainProps?: any;
}
