import { ChannelsService } from "@zenflux/budget-allocation-server/src/channels/channels.service";

import type { FastifyInstance, FastifyPluginOptions } from "fastify";

import type { CreateChannelDto, UpdateChannelDto, UpdateChannelsListDto } from "@zenflux/budget-allocation-server/src/channels/channel.interface";

const channelsService = new ChannelsService();

export async function channelsRoutes(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.get("/channels", async (request, reply) => {
        return channelsService.findAll();
    });

    fastify.post("/channels/reset", async (request, reply) => {
        channelsService.reset();
        return channelsService.findAll();
    });

    fastify.post<{ Body: UpdateChannelsListDto }>("/channels/list", async (request, reply) => {
        const updateListDto = request.body;

        fastify.log.info({ channels: updateListDto.channels.length }, "Updating channels list");

        const updatedChannels = channelsService.updateList(updateListDto);

        return { ok: true, channels: updatedChannels };
    });

    fastify.get<{ Params: { key: string } }>("/channels/:key", async (request, reply) => {
        const { key } = request.params;
        const channel = channelsService.findOne(key);

        if (!channel) {
            return reply.code(404).send({ error: "Channel not found" });
        }

        return channel;
    });

    fastify.post<{ Params: { key: string }; Body: CreateChannelDto }>(
        "/channels/:key",
        async (request, reply) => {
            const { key } = request.params;
            const createChannelDto = request.body;
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
        }
    );

    fastify.put<{ Params: { key: string }; Body: UpdateChannelDto }>(
        "/channels/:key",
        async (request, reply) => {
            const { key } = request.params;
            const updateChannelDto = request.body;
            const channel = channelsService.update(key, updateChannelDto);

            if (!channel) {
                return reply.code(404).send({ error: "Channel not found" });
            }

            return channel;
        }
    );

    fastify.delete<{ Params: { key: string } }>("/channels/:key", async (request, reply) => {
        const { key } = request.params;
        const deleted = channelsService.remove(key);

        if (!deleted) {
            return reply.code(404).send({ error: "Channel not found" });
        }

        return { ok: true };
    });
}

