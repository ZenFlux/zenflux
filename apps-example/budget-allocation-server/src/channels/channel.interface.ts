export interface ChannelMeta {
    id: string;
    name: string;
    icon: string;
    createdAt: number;
}

export interface ChannelBreak {
    date: Date;
    value: string;
}

export interface Channel {
    key: string;
    meta: ChannelMeta;
    allocation: string;
    baseline: string;
    frequency: string;
    breaks: ChannelBreak[];
}

export interface CreateChannelDto {
    key: string;
    meta?: ChannelMeta;
    allocation?: string;
    baseline?: string;
    frequency?: string;
    breaks?: ChannelBreak[];
}

export interface UpdateChannelDto {
    meta?: Partial<ChannelMeta>;
    allocation?: string;
    baseline?: string;
    frequency?: string;
    breaks?: ChannelBreak[];
}

export interface UpdateChannelsListDto {
    key: string;
    channels: Array<{
        meta: ChannelMeta;
        allocation?: string;
        baseline?: string;
        frequency?: string;
        breaks?: ChannelBreak[];
    }>;
}

export interface SetChannelNameDto {
    id: string;
    name: string;
}
