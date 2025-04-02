import { RedisService } from "../services/RedisService";

export class Producer {
    private readonly id: number;
    private readonly range: number;
    private redisService: RedisService;
    private keepRunning: boolean;
    private batch: number[];

    constructor(id: number, range: number, redisService: RedisService) {
        this.id = id;
        this.range = range;
        this.redisService = redisService;
        this.keepRunning = true;
        this.batch = [];
    }

    async start(): Promise<void> {
        const batchSize = 100;
        const uniqueSet = new Set<number>();

        while (this.keepRunning) {
            const randomNumber = Math.floor(Math.random() * this.range);

            if (!uniqueSet.has(randomNumber)) {
                uniqueSet.add(randomNumber);
                this.batch.push(randomNumber);
            }

            if (this.batch.length >= batchSize) {
                const pipeline = this.redisService.redis.pipeline();
                this.batch.forEach((number) => {
                    pipeline.sadd(this.redisService.setName, number.toString());
                    pipeline.xadd(this.redisService.streamName, "*", "number", number.toString(), "generatedAt", new Date().toISOString());
                });
                await pipeline.exec();
                this.batch.length = 0;
            }

            if (uniqueSet.size > 10000) {
                uniqueSet.clear();
            }
        }
    }

    async stop(): Promise<void> {
        this.keepRunning = false;
        if (this.batch.length > 0) {
            const pipeline = this.redisService.redis.pipeline();
            this.batch.forEach((number) => {
                pipeline.sadd(this.redisService.setName, number.toString());
                pipeline.xadd(this.redisService.streamName, "*", "number", number.toString(), "generatedAt", new Date().toISOString());
            });
            await pipeline.exec();
            this.batch.length = 0;
            console.log(`Producer ${this.id}: remaining data sent during stop.`);
        }
    }
}