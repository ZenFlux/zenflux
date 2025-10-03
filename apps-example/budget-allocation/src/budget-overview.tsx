import { QueryComponent } from "@zenflux/react-commander/query/component";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";
import ChannelItemTable from "@zenflux/app-budget-allocation/src/components/channel/channel-item-table";

import { ChannelsQueryModule } from "@zenflux/app-budget-allocation/src/api/channels-query-module";
import { ChannelQueryModule } from "@zenflux/app-budget-allocation/src/api/channel-query-module";

export default function BudgetOverview() {
    return (
        <QueryComponent
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ ChannelsQueryModule }
            component={ ChannelsList }
            props={ { view: "table" } }
        >
            <QueryComponent module={ ChannelQueryModule } component={ ChannelItemTable }/>
        </QueryComponent>
    );
}
