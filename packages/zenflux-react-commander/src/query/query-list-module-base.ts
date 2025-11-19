import { QueryModuleBase } from "@zenflux/react-commander/query/module-base";
import { QueryRouterBase } from "@zenflux/react-commander/query/router";

import type { QueryClient } from "@zenflux/react-commander/query/client";

class SimpleItemRouter<TEntity extends object> extends QueryRouterBase<TEntity, QueryModuleBase<TEntity[]>> {
    public constructor( api: QueryClient, resource: string, model: QueryModuleBase<TEntity[]> ) {
        super( api, resource, model );
    }
}

export abstract class QueryListModuleBase<TEntity extends object> extends QueryModuleBase<TEntity[]> {
    protected readonly itemRouter: QueryRouterBase<TEntity, QueryModuleBase<TEntity[]>>;

    protected constructor( api: QueryClient ) {
        super( api );
        this.itemRouter = new SimpleItemRouter<TEntity>( api, this.getResourceName(), this );
    }
}

