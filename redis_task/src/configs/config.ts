import dotenv from "dotenv";

dotenv.config();


export const config = {
    redis: {
        queueName: "numberQueue",
        host: "127.0.0.1",
        port: 6379
    },
    producersCount: parseInt(process.env.PRODUCERS_COUNT || "5", 10),
    numberRange: parseInt(process.env.NUMBER_RANGE || "100", 10),

};