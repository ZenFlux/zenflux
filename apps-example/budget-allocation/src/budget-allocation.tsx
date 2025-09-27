import { QueryComponent } from "@zenflux/react-commander/query/component";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";
import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components/channel/channel-item-accordion";

import { ChannelsQueryModule } from "@zenflux/app-budget-allocation/src/api/channels-query-module";

export default function BudgetAllocation() {
    return (
        <QueryComponent
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ ChannelsQueryModule }
            component={ ChannelsList }
            props={ { view: "accordion" } }
        >
            <QueryComponent component={ ChannelItemAccordion }/>
        </QueryComponent>
    );
}
