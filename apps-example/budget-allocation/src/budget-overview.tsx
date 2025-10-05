import { QueryComponent } from "@zenflux/react-commander/query/component";

import { ChannelItemQuery } from "@zenflux/app-budget-allocation/src/api/channel-item-query";

import ChannelItemTable from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-table";

import ChannelsList from "@zenflux/app-budget-allocation/src/components/channels/channels-list";

import { ChannelsListQuery } from "@zenflux/app-budget-allocation/src/api/channels-list-query";

import type { Channel } from "@zenflux/app-budget-allocation/src/api/channels-domain";
import type { ChannelListProps } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

export default function BudgetOverview() {
    return (
        <QueryComponent<Channel[], ChannelListProps, Channel>
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ ChannelsListQuery }
            component={ ChannelsList }
            props={ { view: "table" } as const }
        >
            <QueryComponent<Channel, { $data: Channel }, Channel>
                module={ ChannelItemQuery }
                component={ ChannelItemTable }
            />
        </QueryComponent>
    );
}
