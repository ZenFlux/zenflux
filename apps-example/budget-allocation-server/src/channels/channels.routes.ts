import { ChannelsService } from "@zenflux/budget-allocation-server/src/channels/channels.service";
import { DelayUtil } from "@zenflux/budget-allocation-server/src/utils/delay.util";
import { serverConfig } from "@zenflux/budget-allocation-server/src/config/server.config";

import type { FastifyInstance, FastifyPluginOptions } from "fastify";

import type { CreateChannelDto, UpdateChannelDto, UpdateChannelsListDto } from "@zenflux/budget-allocation-server/src/channels/channel.interface";

const channelsService = new ChannelsService();

export async function channelsRoutes(
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
) {
    fastify.get("/channels", async (_request, _reply) => {
        return DelayUtil.withDelay(() => channelsService.findAllMetaOnly(), {
            ...serverConfig.delays.endpoints.getChannels,
            enabled: serverConfig.delays.enabled
        });
    });

    fastify.post("/channels/reset", async (_request, _reply) => {
        return DelayUtil.withDelay(() => {
            channelsService.reset();
            return channelsService.findAll();
        }, {
            ...serverConfig.delays.endpoints.resetChannels,
            enabled: serverConfig.delays.enabled
        });
    });

    fastify.post<{ Body: UpdateChannelsListDto }>("/channels/list", async (request, _reply) => {
        const updateListDto = request.body;

        fastify.log.info({ channels: updateListDto.channels.length }, "Updating channels list");

        return DelayUtil.withDelay(() => {
            const updatedChannels = channelsService.updateList(updateListDto);
            return { ok: true, channels: updatedChannels };
        }, {
            ...serverConfig.delays.endpoints.updateChannelsList,
            enabled: serverConfig.delays.enabled
        });
    });

    fastify.get<{ Params: { key: string } }>("/channels/:key", async (request, reply) => {
        const { key } = request.params;

        return DelayUtil.withDelay(() => {
            const channel = channelsService.findOne(key);

            if (!channel) {
                return reply.code(404).send({ error: "Channel not found" });
            }

            return channel;
        }, {
            ...serverConfig.delays.endpoints.getChannel,
            enabled: serverConfig.delays.enabled
        });
    });

    fastify.post<{ Params: { key: string }; Body: CreateChannelDto }>(
        "/channels/:key",
        async (request, _reply) => {
            const { key } = request.params;
            const createChannelDto = request.body;

            return DelayUtil.withDelay(() => {
                const existingChannel = channelsService.findOne(key);

                if (existingChannel) {
                    const updateDto: UpdateChannelDto = {
                        meta: createChannelDto.meta,
                        allocation: createChannelDto.allocation,
                        baseline: createChannelDto.baseline,
                        frequency: createChannelDto.frequency,
                        breaks: createChannelDto.breaks,
                    };
                    return channelsService.update(key, updateDto);
                } else {
                    return channelsService.create({ ...createChannelDto, key });
                }
            }, {
                ...serverConfig.delays.endpoints.createChannel,
                enabled: serverConfig.delays.enabled
            });
        }
    );

    fastify.put<{ Params: { key: string }; Body: UpdateChannelDto }>(
        "/channels/:key",
        async (request, reply) => {
            const { key } = request.params;
            const updateChannelDto = request.body;

            return DelayUtil.withDelay(() => {
                const channel = channelsService.update(key, updateChannelDto);

                if (!channel) {
                    return reply.code(404).send({ error: "Channel not found" });
                }

                return channel;
            }, {
                ...serverConfig.delays.endpoints.updateChannel,
                enabled: serverConfig.delays.enabled
            });
        }
    );

    fastify.delete<{ Params: { key: string } }>("/channels/:key", async (request, reply) => {
        const { key } = request.params;

        return DelayUtil.withDelay(() => {
            const deleted = channelsService.remove(key);

            if (!deleted) {
                return reply.code(404).send({ error: "Channel not found" });
            }

            return { ok: true };
        }, {
            ...serverConfig.delays.endpoints.deleteChannel,
            enabled: serverConfig.delays.enabled
        });
    });
}

