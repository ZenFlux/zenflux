import { QueryComponent } from "@zenflux/react-commander/query/component";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";

import { ChannelsListQuery } from "@zenflux/app-budget-allocation/src/api/channels-list-query";

import type { Channel } from "@zenflux/app-budget-allocation/src/api/channels-domain";
import type { ChannelListProps } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

export default function BudgetOverview() {
    return (
        <QueryComponent<Channel[], ChannelListProps, Channel[]>
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ ChannelsListQuery }
            component={ ChannelsList }
            props={ { view: "accordion" } as const }
        />
    );
}
