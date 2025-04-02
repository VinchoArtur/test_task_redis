import { Request, Response } from "express";
import { RedisService } from "../services/RedisService";

export class QueueController {
    private redisService: RedisService;

    constructor(redisService: RedisService) {
        this.redisService = redisService;
    }

    async addNumber(req: Request, res: Response) {
        const number = parseInt(req.body.number, 10);
        if (isNaN(number)) {
            return res.status(400).send("Invalid number");
        }
        await this.redisService.pushToQueue(number);
        res.send(`Number ${number} added to queue.`);
    }

    async getQueue(req: Request, res: Response) {
        const queueContent = await this.redisService.peekQueue();
        res.json(queueContent);
    }
}