import Redis from "ioredis";
import {config} from "../configs/config";

export class RedisService {
    public redis: Redis;
    private queueName: string;

    constructor(queueName: string) {
        this.redis = new Redis({
            host: config.redis.host, // Используем "redis-stack-server"
            port: config.redis.port  // Порт 6379
        });
        this.queueName = queueName;
    }

    async pushToQueue(number: number): Promise<void> {
        await this.redis.rpush(this.queueName, number.toString());
    }

    async popFromQueue(): Promise<number | null> {
        const number = await this.redis.lpop(this.queueName);
        return number !== null ? parseInt(number, 10) : null;
    }

    async peekQueue(): Promise<number[]> {
        const items = await this.redis.lrange(this.queueName, 0, -1);
        return items.map((item) => parseInt(item, 10));
    }

    disconnect(): void {
        this.redis.disconnect();
    }
}