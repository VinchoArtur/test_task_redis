import { RedisService } from "../services/RedisService";
import { sleep } from "../utils/sleep";

export class Producer {
    private readonly id: number;
    private readonly range: number;
    private redisService: RedisService;
    private keepRunning: boolean;

    constructor(id: number, range: number, redisService: RedisService) {
        this.id = id;
        this.range = range;
        this.redisService = redisService;
        this.keepRunning = true; // Флаг для остановки
    }

    async start(): Promise<void> {
        while (this.keepRunning) {
            const randomNumber = Math.floor(Math.random() * this.range);
            await this.redisService.pushToQueue(randomNumber);
            console.log(`Producer #${this.id} generated: ${randomNumber}`);
            // await sleep(50);
        }
    }

    stop(): void {
        this.keepRunning = false;
    }
}