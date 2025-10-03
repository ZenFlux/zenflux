import type { ChannelMetaData, ChannelBreakData, ChannelState } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

export interface Channel extends ChannelState {
    meta: ChannelMetaData;
    breaks?: ChannelBreakData[];
}

export interface ChannelListApiResponse {
    key: string;
    meta: ChannelMetaData;
    frequency: Channel["frequency"];
    baseline: string;
    allocation: Channel["allocation"];
    breaks?: Array<{
        date: string;
        value: string;
    }>;
}

export interface ChannelItemApiResponse {
    meta: ChannelMetaData;
    frequency: Channel["frequency"];
    baseline: string;
    allocation: Channel["allocation"];
    breaks?: Array<{
        date: string;
        value: string;
    }>;
}

export interface ChannelListData {
    channels: Channel[];
}

export function transformChannelFromApi( apiResponse: ChannelItemApiResponse ): Channel {
    const breaks = apiResponse.breaks?.map( ( breakItem ) => ( {
        date: new Date( breakItem.date ),
        value: breakItem.value,
    } ) );

    return {
        meta: apiResponse.meta,
        frequency: apiResponse.frequency,
        baseline: apiResponse.baseline,
        allocation: apiResponse.allocation,
        breaks,
    };
}



