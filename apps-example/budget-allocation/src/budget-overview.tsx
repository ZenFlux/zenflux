import { QueryComponent } from "@zenflux/react-query/src/query-component.tsx";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";
import ChannelItemTable from "@zenflux/app-budget-allocation/src/components/channel/channel-item-table";

import { APIChannelsModule } from "@zenflux/app-budget-allocation/src/api/api-channels-module.ts";

export default function BudgetOverview() {
    return (
        <QueryComponent
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ APIChannelsModule }
            type={ ChannelsList }
            chainProps={ { view: "table" } }
        >
            <QueryComponent type={ ChannelItemTable }/>
        </QueryComponent>
    );
}
