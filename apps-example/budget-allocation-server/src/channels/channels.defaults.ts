import type { Channel } from "@zenflux/budget-allocation-server/src/channels/channel.interface";

export const defaultChannels: Channel[] = [
    {
        key: "free-reviews",
        meta: {
            id: "free-reviews",
            name: "Free Reviews",
            icon: "assets/test.png",
            createdAt: 0,
        },
        allocation: "equal",
        baseline: "0",
        frequency: "annually",
        breaks: [],
    },
    {
        key: "paid-reviews",
        meta: {
            id: "paid-reviews",
            name: "Paid Reviews",
            icon: "assets/affiliate-program.png",
            createdAt: 1,
        },
        allocation: "equal",
        baseline: "0",
        frequency: "annually",
        breaks: [],
    },
];

