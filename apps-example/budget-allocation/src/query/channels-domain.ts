import type { ChannelMetaData, ChannelBreakData, ChannelState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

export interface Channel extends ChannelState {
    meta: ChannelMetaData;
    breaks?: ChannelBreakData[];
}

export interface ChannelListApiResponse {
    key: string;
    meta: ChannelMetaData;
    frequency?: Channel["frequency"];
    baseline?: string;
    allocation?: Channel["allocation"];
    breaks?: Array<{
        date: string;
        value: string;
    }>;
}

export interface ChannelListWithBreaksApiResponse {
    key: string;
    meta: ChannelMetaData;
    breaks?: Array<{
        date: string;
        value: string;
    }>;
}

export interface ChannelItemApiResponseBase {
    frequency: Channel["frequency"];
    baseline: string;
    allocation: Channel["allocation"];
    breaks?: Array<{
        date: string;
        value: string;
    }>;
}

export interface ChannelItemApiResponse extends ChannelItemApiResponseBase {
    meta: ChannelMetaData;
}

export interface ChannelListData {
    channels: Channel[];
}

export function transformChannelFromListApi( apiResponse: ChannelListApiResponse ): Channel {
    const breaks = apiResponse.breaks?.map( ( breakItem ) => ( {
        date: new Date( breakItem.date ),
        value: breakItem.value,
    } ) );

    return {
        meta: apiResponse.meta,
        frequency: apiResponse.frequency ?? "monthly",
        baseline: apiResponse.baseline ?? "0",
        allocation: apiResponse.allocation ?? "equal",
        breaks: breaks ?? [],
    };
}

export function transformChannelFromListWithBreaksApi( apiResponse: ChannelListWithBreaksApiResponse ): Channel {
    const breaks = apiResponse.breaks?.map( ( breakItem ) => ( {
        date: new Date( breakItem.date ),
        value: breakItem.value,
    } ) );

    return {
        meta: apiResponse.meta,
        frequency: "monthly",
        baseline: "0",
        allocation: "equal",
        breaks: breaks || [],
    };
}

