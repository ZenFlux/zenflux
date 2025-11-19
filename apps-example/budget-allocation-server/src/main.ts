import Fastify from "fastify";

import { channelsRoutes } from "./channels/channels.routes.js";
import { serverConfig } from "./config/server.config.js";

async function bootstrap() {
    const fastify = Fastify( {
        logger: true,
    } );

    const corsPlugin = ( await import( "@fastify/cors" ) ).default;

    await fastify.register( corsPlugin, {
        origin: serverConfig.cors.origins,
        methods: serverConfig.cors.methods,
        allowedHeaders: serverConfig.cors.allowedHeaders,
    } );

    await fastify.register( channelsRoutes, { prefix: "/v1" } );

    try {
        await fastify.listen( { port: serverConfig.port, host: serverConfig.host } );
        console.log( `Budget Allocation Server running on http://localhost:${ serverConfig.port }` );
        console.log( `Fake delays: ${ serverConfig.delays.enabled ? "enabled" : "disabled" }` );
    } catch ( err ) {
        fastify.log.error( err );
        process.exit( 1 );
    }
}

bootstrap();
