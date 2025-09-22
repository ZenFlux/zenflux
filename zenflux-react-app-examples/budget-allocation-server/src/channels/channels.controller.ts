import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelDto } from './channel.interface';

@Controller('v1/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    const channel = this.channelsService.findOne(key);
    if (!channel) {
      throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
    }
    return channel;
  }

  @Post(':key')
  createOrUpdate(@Param('key') key: string, @Body() createChannelDto: CreateChannelDto) {
    const existingChannel = this.channelsService.findOne(key);
    
    if (existingChannel) {
      const updateDto: UpdateChannelDto = {
        meta: createChannelDto.meta,
        allocation: createChannelDto.allocation,
        baseline: createChannelDto.baseline,
        frequency: createChannelDto.frequency,
        breaks: createChannelDto.breaks,
      };
      return this.channelsService.update(key, updateDto);
    } else {
      return this.channelsService.create({ ...createChannelDto, key });
    }
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() updateChannelDto: UpdateChannelDto) {
    const channel = this.channelsService.update(key, updateChannelDto);
    if (!channel) {
      throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
    }
    return channel;
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    const deleted = this.channelsService.remove(key);
    if (!deleted) {
      throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }
}
