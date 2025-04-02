import Redis from "ioredis";
import { config } from "../configs/config";

export class RedisService {
    public redis: Redis;
    public streamName: string;
    public setName: string;

    constructor(streamName: string) {
        this.redis = new Redis({
            host: config.redis.host,
            port: config.redis.port,
        });
        this.streamName = streamName;
        this.setName = `${streamName}_uniques`;
    }

    async tryAddUniqueNumber(number: number): Promise<boolean> {
        const pipeline = this.redis.pipeline();
        pipeline.sadd(this.setName, number.toString());
        pipeline.xadd(this.streamName, "*", "number", number.toString(), "generatedAt", new Date().toISOString());
        const [setResult, streamResult] = await pipeline.exec();
        return !!setResult[1];
    }

    async createConsumerGroup(groupName: string): Promise<void> {
        try {
            await this.redis.xgroup('CREATE', this.streamName, groupName, '0', 'MKSTREAM');
            console.log(`Consumer group '${groupName}' created.`);
        } catch (error) {
            if (!String(error).includes('BUSYGROUP')) throw error;
            console.log(`Consumer group '${groupName}' already exists.`);
        }
    }

    async readGroupNumbers(groupName: string, consumerId: string, count = 200): Promise<[string, number, string][]> {
        const streams = await this.redis.xreadgroup(
          'GROUP', groupName, consumerId,
          'COUNT', count, 'BLOCK', 10,
          'STREAMS', this.streamName, '>'
        );
        if (!streams || streams.length === 0) return [];
        return streams[0][1].map(([id, data]) => [
            id,
            Number(data[1]),
            data[3]
        ]);
    }

    async ackNumbers(groupName: string, ids: string[]): Promise<number> {
        if (ids.length === 0) return 0;
        return this.redis.xack(this.streamName, groupName, ...ids);
    }




    async readNumbers(lastId: string, count: number = 200): Promise<[string, number, string][]> {
        const streams = await this.redis.xread("COUNT", count, "BLOCK", 10, "STREAMS", this.streamName, lastId);
        if (!streams || streams.length === 0) return [];
        return streams[0][1].map(([id, data]) => {
            const number = Number(data[1]);
            const generatedAt = data[3];
            return [id, number, generatedAt];
        });
    }

    getUniqueCount(): Promise<number> {
        return this.redis.scard(this.setName);
    }

    disconnect(): void {
        this.redis.disconnect();
    }

    async readPendingMessages(
      groupName: string,
      consumerId: string,
      count = 200
    ): Promise<[string, number, string][]> {
        const pendingMessages = await this.redis.xpending(this.streamName, groupName, "-", "+", count, consumerId);
        if (!pendingMessages || pendingMessages.length === 0) return [];
        return pendingMessages.map(([id, data]) => [
            id,
            Number(data[1]),
            data[3]
        ]);
    }
}