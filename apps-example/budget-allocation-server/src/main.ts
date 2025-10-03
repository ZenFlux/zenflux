import Fastify from "fastify";
import cors from "@fastify/cors";

import { channelsRoutes } from "@zenflux/budget-allocation-server/src/channels/channels.routes";

async function bootstrap() {
    const fastify = Fastify({
        logger: true,
    });

    await fastify.register(cors, {
        origin: ["http://localhost:3000", "http://localhost:5174"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    await fastify.register(channelsRoutes, { prefix: "/v1" });

    try {
        await fastify.listen({ port: 3002, host: "0.0.0.0" });
        console.log("Budget Allocation Server running on http://localhost:3002");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

bootstrap();
