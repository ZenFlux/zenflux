import { QueryComponent } from "@zenflux/react-query/src/query-component";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";
import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components/channel/channel-item-accordion";

import { APIChannelsModule } from "@zenflux/app-budget-allocation/src/api/api-channels-module";

export default function BudgetAllocation() {
    return (
        <QueryComponent
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ APIChannelsModule }
            type={ ChannelsList }
            chainProps={ { view: "accordion" } }
        >
            <QueryComponent type={ ChannelItemAccordion }/>
        </QueryComponent>
    );
}
