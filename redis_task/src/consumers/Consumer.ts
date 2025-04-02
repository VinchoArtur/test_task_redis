// Consumer.ts
import { RedisService } from "../services/RedisService";
import { NumberResult } from "../models/NumberResult";

export class Consumer {
    private redisService: RedisService;
    private results: NumberResult[] = [];
    private groupName = 'numberConsumers';
    private consumerId: string;

    constructor(redisService: RedisService, consumerId: string) {
        this.redisService = redisService;
        this.consumerId = consumerId;
    }

    async start(numberRange: number): Promise<NumberResult[]> {
        const batchSize = 200;

        await this.redisService.createConsumerGroup(this.groupName);

        while (this.results.length < numberRange) {
            const entries = await this.redisService.readGroupNumbers(this.groupName, this.consumerId, batchSize);

            if (entries.length === 0) continue;

            const ackIds: string[] = [];

            entries.forEach(([id, number, generatedAt]) => {
                if (this.results.length < numberRange) {
                    this.results.push({number, generatedAt});
                    ackIds.push(id);
                    console.log(`Consumer ${this.consumerId} обработал ${number}`);
                }
            });

            await this.redisService.ackNumbers(this.groupName, ackIds);
        }

        return this.results;
    }
}