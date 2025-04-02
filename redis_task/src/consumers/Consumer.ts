import { RedisService } from "../services/RedisService";
import { NumberResult } from "../models/NumberResult";
import { sleep } from "../utils/sleep";

export class Consumer {
    private redisService: RedisService;
    private readonly results: Record<number, NumberResult>;

    constructor(redisService: RedisService) {
        this.redisService = redisService;
        this.results = {};
    }

    async start(numberRange: number): Promise<NumberResult[]> {
        while (Object.keys(this.results).length < numberRange) {
            const number = await this.redisService.popFromQueue();
            if (number !== null && !this.results[number]) {
                this.results[number] = {number, generatedAt: new Date().toISOString()};
                console.log(`Consumer processed: ${number}`);
            } else {
                await sleep(20);
            }
        }
        return Object.values(this.results);
    }
}