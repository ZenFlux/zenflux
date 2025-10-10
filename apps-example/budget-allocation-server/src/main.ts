import Fastify from "fastify";
import cors from "@fastify/cors";

import { channelsRoutes } from "@zenflux/budget-allocation-server/src/channels/channels.routes";
import { serverConfig } from "@zenflux/budget-allocation-server/src/config/server.config";

async function bootstrap() {
    const fastify = Fastify({
        logger: true,
    });

    await fastify.register(cors, {
        origin: serverConfig.cors.origins,
        methods: serverConfig.cors.methods,
        allowedHeaders: serverConfig.cors.allowedHeaders,
    });

    await fastify.register(channelsRoutes, { prefix: "/v1" });

    try {
        await fastify.listen({ port: serverConfig.port, host: serverConfig.host });
        console.log(`Budget Allocation Server running on http://localhost:${serverConfig.port}`);
        console.log(`Fake delays: ${serverConfig.delays.enabled ? "enabled" : "disabled"}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

bootstrap();
