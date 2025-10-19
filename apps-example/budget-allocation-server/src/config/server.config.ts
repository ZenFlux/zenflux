export interface ServerConfig {
    port: number;
    host: string;
    cors: {
        origins: string[];
        methods: string[];
        allowedHeaders: string[];
    };
    delays: {
        enabled: boolean;
        default: {
            min: number;
            max: number;
        };
        endpoints: {
            getChannels: { min: number; max: number };
            getChannel: { min: number; max: number };
            createChannel: { min: number; max: number };
            updateChannel: { min: number; max: number };
            deleteChannel: { min: number; max: number };
            updateChannelsList: { min: number; max: number };
            resetChannels: { min: number; max: number };
        };
    };
}

export const serverConfig: ServerConfig = {
    port: 3000,
    host: "0.0.0.0",
    cors: {
        origins: true, // Allow all origins for now
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    },
    delays: {
        enabled: process.env.FAKE_DELAYS !== "false",
        default: {
            min: 1000,
            max: 3000,
        },
        endpoints: {
            getChannels: { min: 1000, max: 2500 },
            getChannel: { min: 1000, max: 2000 },
            createChannel: { min: 1200, max: 2800 },
            updateChannel: { min: 1100, max: 2600 },
            deleteChannel: { min: 1000, max: 2200 },
            updateChannelsList: { min: 1500, max: 3000 },
            resetChannels: { min: 1200, max: 2500 },
        },
    },
};
