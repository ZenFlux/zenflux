export interface ChannelMeta {
    id: string;
    name: string;
    icon: string;
    createdAt: number;
}

export interface ChannelBreak {
    date: Date;
    amount: string;
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
