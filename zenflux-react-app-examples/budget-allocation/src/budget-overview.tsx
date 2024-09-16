import { API } from "@zenflux/react-api/src";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";
import ChannelItemTable from "@zenflux/app-budget-allocation/src/components/channel/channel-item-table";

import { APIChannelsModule } from "@zenflux/app-budget-allocation/src/api/api-channels-module";

export default function BudgetOverview() {
    return (
        <API.Component
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ APIChannelsModule }
            type={ ChannelsList }
            chainProps={ { view: "table" } }
        >
            <API.Component type={ ChannelItemTable }/>
        </API.Component>
    );
}
