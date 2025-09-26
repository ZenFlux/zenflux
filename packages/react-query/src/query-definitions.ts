import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

import type React from "react";

import type { QueryClient } from "@zenflux/react-query/src/query-client";

import type { QueryModuleBase } from "@zenflux/react-query/src/query-module-base";

export interface DQueryModuleBaseStatic {
    new( query: QueryClient ): QueryModuleBase;

    getName(): string;
}

export interface DQueryComponentProps {
    children?: React.ReactElement;
    module?: DQueryModuleBaseStatic;
    fallback?: React.ReactElement;
    component: DCommandFunctionComponent;
    props?: any;
}
