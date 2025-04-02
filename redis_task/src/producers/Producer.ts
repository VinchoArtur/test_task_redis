import { RedisService } from "../services/RedisService";

export class Producer {
    private readonly id: number;
    private readonly range: number;
    private redisService: RedisService;
    private keepRunning: boolean;

    constructor(id: number, range: number, redisService: RedisService) {
        this.id = id;
        this.range = range;
        this.redisService = redisService;
        this.keepRunning = true;
    }

    async start(): Promise<void> {
        while (this.keepRunning) {
            const randomNumber = Math.floor(Math.random() * this.range);
            const isNew = await this.redisService.tryAddUniqueNumber(randomNumber);
            if (isNew) {
                console.log(`Producer #${this.id} добавил уникальное: ${randomNumber}`);
            }
        }
    }

    stop(): void {
        this.keepRunning = false;
    }
}