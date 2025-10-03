import { defaultChannels } from "@zenflux/budget-allocation-server/src/channels/channels.defaults";

import type { Channel, CreateChannelDto, UpdateChannelDto } from "@zenflux/budget-allocation-server/src/channels/channel.interface";

export class ChannelsService {
    private channels: Map<string, Channel> = new Map();

    public constructor() {
        this.initializeDefaultChannels();
    }

    private initializeDefaultChannels(): void {
        defaultChannels.forEach(channel => {
            this.channels.set(channel.key, channel);
        });
    }

    public findAll(): Channel[] {
        return Array.from(this.channels.values()).sort((a, b) =>
            a.meta.createdAt - b.meta.createdAt
        );
    }

    public findOne(key: string): Channel | undefined {
        return this.channels.get(key);
    }

    public create(createChannelDto: CreateChannelDto): Channel {
        const channel: Channel = {
            key: createChannelDto.key,
            meta: createChannelDto.meta || {
                id: createChannelDto.key,
                name: createChannelDto.key,
                icon: "",
                createdAt: Date.now(),
            },
            allocation: createChannelDto.allocation || "equal",
            baseline: createChannelDto.baseline || "0",
            frequency: createChannelDto.frequency || "annually",
            breaks: createChannelDto.breaks || [],
        };

        this.channels.set(channel.key, channel);
        return channel;
    }

    public update(key: string, updateChannelDto: UpdateChannelDto): Channel | undefined {
        const existingChannel = this.channels.get(key);
        if (!existingChannel) {
            return undefined;
        }

        const updatedChannel: Channel = {
            ...existingChannel,
            ...updateChannelDto,
            meta: updateChannelDto.meta
                ? { ...existingChannel.meta, ...updateChannelDto.meta }
                : existingChannel.meta,
            key,
        };

        this.channels.set(key, updatedChannel);
        return updatedChannel;
    }

    public remove(key: string): boolean {
        return this.channels.delete(key);
    }

    public reset(): void {
        this.channels.clear();
        this.initializeDefaultChannels();
    }
}
