import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

import type React from "react";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

export interface DQueryModuleBaseStatic<TResource extends Record<string, unknown> = Record<string, unknown>> {
    new( query: QueryClient ): QueryModuleBase<TResource>;

    getName(): string;
}

export interface DQueryComponentProps<TData = unknown, TProps = Record<string, unknown>> {
    children?: React.ReactElement;
    module?: DQueryModuleBaseStatic;
    fallback?: React.ReactElement;
    component: DCommandFunctionComponent<TProps & { $data: TData }>;
    props?: TProps;
}

export interface DQueryReadOnlyContext {
    componentName: string;
    props: Readonly<Record<string, unknown>>;
}

export interface DQueryEndpointConfig<TApiResponse, TData> {
    method: string;
    path: string;
    prepareData?: ( apiResponse: TApiResponse ) => TData;
}
