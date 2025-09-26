import { Injectable } from '@nestjs/common';
import { Channel, CreateChannelDto, UpdateChannelDto } from './channel.interface';

@Injectable()
export class ChannelsService {
  private channels: Map<string, Channel> = new Map();

  constructor() {
    this.initializeDefaultChannels();
  }

  private initializeDefaultChannels(): void {
    const defaultChannels: Channel[] = [
      {
        key: 'free-reviews',
        meta: {
          id: 'free-reviews',
          name: 'Free Reviews',
          icon: '/assets/test.png',
          createdAt: 0,
        },
        allocation: 'equal',
        baseline: '0',
        frequency: 'annually',
        breaks: [],
      },
      {
        key: 'paid-reviews',
        meta: {
          id: 'paid-reviews',
          name: 'Paid Reviews',
          icon: '/assets/affiliate-program.png',
          createdAt: 1,
        },
        allocation: 'equal',
        baseline: '0',
        frequency: 'annually',
        breaks: [],
      },
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.key, channel);
    });
  }

  findAll(): Channel[] {
    return Array.from(this.channels.values()).sort((a, b) => 
      a.meta.createdAt - b.meta.createdAt
    );
  }

  findOne(key: string): Channel | undefined {
    return this.channels.get(key);
  }

  create(createChannelDto: CreateChannelDto): Channel {
    const channel: Channel = {
      key: createChannelDto.key,
      meta: createChannelDto.meta || {
        id: createChannelDto.key,
        name: createChannelDto.key,
        icon: '',
        createdAt: Date.now(),
      },
      allocation: createChannelDto.allocation || 'equal',
      baseline: createChannelDto.baseline || '0',
      frequency: createChannelDto.frequency || 'annually',
      breaks: createChannelDto.breaks || [],
    };

    this.channels.set(channel.key, channel);
    return channel;
  }

  update(key: string, updateChannelDto: UpdateChannelDto): Channel | undefined {
    const existingChannel = this.channels.get(key);
    if (!existingChannel) {
      return undefined;
    }

    const updatedChannel: Channel = {
      ...existingChannel,
      ...updateChannelDto,
      key,
    };

    this.channels.set(key, updatedChannel);
    return updatedChannel;
  }

  remove(key: string): boolean {
    return this.channels.delete(key);
  }
}
