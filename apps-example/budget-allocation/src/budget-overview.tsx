import { QueryComponent } from "@zenflux/react-commander/query/component";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";

import { ChannelsListWithBreaksQuery } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-query";

import type { Channel } from "@zenflux/app-budget-allocation/src/query/channels-domain";
import type { ChannelListProps, ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

export default function BudgetOverview() {
    return (
        <QueryComponent<Channel[], ChannelListProps, Channel[], ChannelListState>
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ ChannelsListWithBreaksQuery }
            component={ ChannelsList }
            props={ { view: "table" } as const }
        />
    );
}
