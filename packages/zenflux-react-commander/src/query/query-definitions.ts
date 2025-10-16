import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

import type React from "react";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

export interface DQueryModuleBaseStatic<TResource extends object = object> {
    new( query: QueryClient ): QueryModuleBase<TResource>;

    getName(): string;
}

export interface DQueryComponentProps<TData = Record<string, unknown>, TProps = Record<string, unknown>, TResource extends object = object, TState = React.ComponentState> {
    children?: React.ReactElement;
    module?: DQueryModuleBaseStatic<TResource>;
    fallback?: React.ReactElement;
    component: DCommandFunctionComponent<TProps & { $data: TData }, TState>;
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
