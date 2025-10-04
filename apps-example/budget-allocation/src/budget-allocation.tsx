import { QueryComponent } from "@zenflux/react-commander/query/component";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";
import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components/channel/channel-item-accordion";

import { ChannelsQueryModule } from "@zenflux/app-budget-allocation/src/api/channels-query-module";
import { ChannelQueryModule } from "@zenflux/app-budget-allocation/src/api/channel-query-module";

import type { Channel } from "@zenflux/app-budget-allocation/src/api/channels-domain";
import type { ChannelListProps } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

export default function BudgetAllocation() {
    return (
        <QueryComponent<Channel[], ChannelListProps, Channel>
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ ChannelsQueryModule }
            component={ ChannelsList }
            props={ { view: "accordion" } as const }
        >
            <QueryComponent<Channel, { $data: Channel }, Channel>
                module={ ChannelQueryModule }
                component={ ChannelItemAccordion }
            />
        </QueryComponent>
    );
}
